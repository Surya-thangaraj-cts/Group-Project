using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using System.Text.Json.Serialization;
using UserApprovalApi.Data;
using UserApprovalApi.Filters;
using UserApprovalApi.Models;
using UserApprovalApi.Services;
using UserApprovalApi.Repositories;

var builder = WebApplication.CreateBuilder(args);

// -------------------- Services --------------------

// EF Core - SQL Server
// In Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// After var app = builder.Build();

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddScoped<IUserRepository, UserRepository>();

// Controllers + JSON enum converter (accept "Admin" | "Manager" | "Officer")
builder.Services
    .AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// JWT options/service
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<JwtService>();

// Authentication / Authorization
var jwtSection = builder.Configuration.GetSection("Jwt");
var keyString = jwtSection["Key"];
if (string.IsNullOrWhiteSpace(keyString))
{
    throw new InvalidOperationException(
        "JWT Key is not configured. Set a strong Jwt:Key in appsettings.json.");
}
var key = Encoding.UTF8.GetBytes(keyString);

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.FromMinutes(5),
            RoleClaimType = "role",
            NameClaimType = "name"  
        };
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"JWT Auth Failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                Console.WriteLine($"JWT Challenge: {context.Error}, {context.ErrorDescription}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                var claims = context.Principal?.Claims.Select(c => $"{c.Type}={c.Value}");
                Console.WriteLine($"JWT Token Validated. Claims: {string.Join(", ", claims ?? Array.Empty<string>())}");
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                Console.WriteLine($"JWT Message Received. Token present: {!string.IsNullOrEmpty(context.Token)}");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// Swagger + JWT support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "UserApproval API",
        Version = "v1",
        Description = "User registration → admin approval → login with JWT"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Description = "Enter: Bearer {your JWT token}"
    });

    c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});

// (Optional) CORS if your frontend runs on a different origin
// builder.Services.AddCors(options =>
// {
//     options.AddPolicy("AllowFrontend", policy =>
//     {
//         policy.WithOrigins("https://localhost:5173", "http://localhost:5173")
//               .AllowAnyHeader()
//               .AllowAnyMethod();
//     });
// });

var app = builder.Build();

// -------------------- Middleware --------------------

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("AllowAngular");

app.UseHttpsRedirection();

// app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();


// -------------------- Database: migrate + seed --------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    // Seed one Admin user if none exists
    if (!db.Users.Any(u => u.Role == UserRole.Admin))
    {
        var (hash, salt) = PasswordService.HashPassword("Admin@123!");
        db.Users.Add(new User
        {
            UserId = "admin",
            Name = "System Admin",
            Email = "admin@example.com",
            Branch = "HQ",
            Role = UserRole.Admin,            // enum
            PasswordHash = hash,
            PasswordSalt = salt,
            Status = UserStatus.Active        // enum
        });
        db.SaveChanges();
    }
}

app.Run();