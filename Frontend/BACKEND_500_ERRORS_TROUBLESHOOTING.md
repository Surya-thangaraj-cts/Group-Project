# Backend 500 Errors - Troubleshooting Guide

## Current Errors

You're experiencing 500 (Internal Server Error) responses from three API endpoints:

1. **GET /api/accounts** - Status 500
2. **GET /api/transactions** - Status 500  
3. **GET /api/notifications** - Status 500 with error: "Unable to cast object of type 'System.Int32' to type 'System.String'"

## Root Cause

These are **backend server errors**, not frontend issues. The backend ASP.NET Core API is encountering internal errors when processing the requests.

## Diagnostic Steps

### 1. Check Backend Server Status

```powershell
# Check if the backend server is running
# Look for process listening on port 7021
netstat -ano | findstr :7021
```

The frontend is configured to connect to: `https://localhost:7021/api`

### 2. Check Backend Console Logs

Look at the backend server console/terminal for detailed error stack traces. The errors will show:
- Exact line where the error occurs
- Database connection issues
- Type casting problems
- Missing configuration

### 3. Common Backend Issues

#### A. Database Connection Failure

**Symptoms:** All APIs return 500 errors

**Solution:** Check your `appsettings.json` connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=BankingDB;Trusted_Connection=true;"
  }
}
```

Verify:
- SQL Server is running
- Database exists
- Connection string is correct
- User has proper permissions

#### B. Type Casting Error in Notifications API

**Error Message:** "Unable to cast object of type 'System.Int32' to type 'System.String'"

**Likely Cause:** The NotificationsController is trying to parse a query parameter incorrectly.

**Check your NotificationsController.cs:**

```csharp
[HttpGet]
public async Task<IActionResult> GetNotifications([FromQuery] string? type, [FromQuery] string? status)
{
    // Make sure 'type' and 'status' are declared as string or nullable int
    // NOT as int when they might contain string values
}
```

**Common mistake:**
```csharp
// WRONG - if query param is string, this will fail
[HttpGet]
public async Task<IActionResult> GetNotifications([FromQuery] int type)

// CORRECT - use nullable int or string
[HttpGet]
public async Task<IActionResult> GetNotifications([FromQuery] int? type)
// OR
[HttpGet]
public async Task<IActionResult> GetNotifications([FromQuery] string? type)
```

#### C. Missing Authentication/Authorization

**Symptoms:** 500 errors, or possibly 401/403 in some cases

**Solution:** Ensure JWT authentication is properly configured in the backend:

```csharp
// Program.cs or Startup.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });
```

#### D. CORS Configuration

**Symptoms:** Browser shows CORS errors along with 500 errors

**Solution:** Add CORS policy in backend:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDev", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Later in the pipeline
app.UseCors("AllowAngularDev");
```

### 4. Check Backend API Endpoints

Test the backend APIs directly using PowerShell:

```powershell
# Test Accounts API
Invoke-WebRequest -Uri "https://localhost:7021/api/accounts?pageNumber=1&pageSize=10" `
  -Method GET `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN_HERE"} `
  -SkipCertificateCheck

# Test Transactions API
Invoke-WebRequest -Uri "https://localhost:7021/api/transactions?pageNumber=1&pageSize=10" `
  -Method GET `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN_HERE"} `
  -SkipCertificateCheck

# Test Notifications API
Invoke-WebRequest -Uri "https://localhost:7021/api/notifications" `
  -Method GET `
  -Headers @{"Authorization"="Bearer YOUR_TOKEN_HERE"} `
  -SkipCertificateCheck
```

### 5. Frontend Changes Made

The frontend has been updated with enhanced error logging. Check your browser console for detailed error information:

- HTTP status code
- Request URL
- Response body
- Error message

## Quick Fixes

### Fix 1: Restart Backend Server

1. Stop the backend server (Ctrl+C)
2. Clean and rebuild:
   ```powershell
   dotnet clean
   dotnet build
   ```
3. Run the server:
   ```powershell
   dotnet run
   ```

### Fix 2: Check Database Migration

```powershell
# Apply pending migrations
dotnet ef database update

# Or recreate the database
dotnet ef database drop
dotnet ef database update
```

### Fix 3: Review NotificationsController

If you see the "cast" error, check your NotificationsController.cs:

```csharp
[HttpGet]
public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications(
    [FromQuery] int? type,    // Use nullable int
    [FromQuery] int? status)  // Use nullable int
{
    try
    {
        IQueryable<Notification> query = _context.Notifications;

        if (type.HasValue)
        {
            query = query.Where(n => n.Type == type.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(n => n.Status == status.Value);
        }

        var notifications = await query.ToListAsync();
        return Ok(notifications);
    }
    catch (Exception ex)
    {
        return StatusCode(500, ex.Message);
    }
}
```

## Testing After Fix

1. Start the backend server
2. Check backend console for any startup errors
3. Refresh the frontend application
4. Open browser DevTools Console
5. Look for success messages:
   - "Loaded X accounts successfully"
   - "Loaded X transactions successfully"
   - "Loaded X notifications successfully"

## Additional Resources

- Backend logs location: Check your project's `bin/Debug/net8.0/` or similar
- Database logs: Check SQL Server Management Studio
- Frontend environment config: `src/environments/environment.ts`

## Still Having Issues?

If errors persist:

1. Share the **complete backend error stack trace** from the server console
2. Share the **backend controller code** for the failing endpoints
3. Share the **appsettings.json** (without sensitive data)
4. Check if the database tables exist and have the correct schema
