/**
 * CORS Configuration for ASP.NET Core API
 * 
 * Add this to your Program.cs to allow Angular frontend to communicate with the API
 */

// ===== Add this in Program.cs BEFORE building the app =====

// Add CORS services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy =>
        {
            // Development: Allow Angular dev server
            policy.WithOrigins(
                    "http://localhost:4200",      // Angular default dev server
                    "http://localhost:4201",      // Alternative port
                    "https://localhost:4200"
                  )
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
            
            // Production: Add your production URL
            // policy.WithOrigins("https://your-production-domain.com")
        });
});

// ===== Add this AFTER building the app (after var app = builder.Build();) =====
// ===== Make sure this is BEFORE app.UseAuthentication() and app.UseAuthorization() =====

app.UseCors("AllowAngularApp");


/*
 * COMPLETE EXAMPLE:
 * 
 * var builder = WebApplication.CreateBuilder(args);
 * 
 * // Add services
 * builder.Services.AddControllers();
 * builder.Services.AddDbContext<AppDbContext>(...);
 * 
 * // Add CORS
 * builder.Services.AddCors(options =>
 * {
 *     options.AddPolicy("AllowAngularApp",
 *         policy =>
 *         {
 *             policy.WithOrigins("http://localhost:4200")
 *                   .AllowAnyHeader()
 *                   .AllowAnyMethod()
 *                   .AllowCredentials();
 *         });
 * });
 * 
 * var app = builder.Build();
 * 
 * // Use CORS (IMPORTANT: Before Authentication/Authorization)
 * app.UseCors("AllowAngularApp");
 * 
 * app.UseAuthentication();
 * app.UseAuthorization();
 * 
 * app.MapControllers();
 * app.Run();
 */
