# Add This Endpoint to AdminController.cs

Add this method to your `AdminController.cs` to fetch all existing users (non-pending):

```csharp
[HttpGet("all-users")]
public async Task<IActionResult> AllUsers()
{
    var list = await _db.Users
        .Where(u => u.Status != UserStatus.Pending)  // Only Active and Inactive users
        .Select(u => new {
            u.UserId,
            u.Name,
            u.Email,
            u.Branch,
            u.Role,
            Status = u.Status.ToString()
        })
        .ToListAsync();

    return Ok(list);
}
```

## Complete AdminController.cs Reference

Your `AdminController.cs` should have these endpoints:

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserApprovalApi.Data;
using UserApprovalApi.Models;

namespace UserApprovalApi.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        public AdminController(AppDbContext db) { _db = db; }

        // DEBUG: Test endpoint without auth
        [AllowAnonymous]
        [HttpGet("debug-auth")]
        public IActionResult DebugAuth()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            var isAuthenticated = User.Identity?.IsAuthenticated ?? false;
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();

            return Ok(new
            {
                authHeaderPresent = !string.IsNullOrEmpty(authHeader),
                authHeaderValue = authHeader.Length > 20 ? authHeader[..20] + "..." : authHeader,
                isAuthenticated,
                claims
            });
        }

        // ✅ NEW: Get all existing users (Active + Inactive)
        [HttpGet("all-users")]
        public async Task<IActionResult> AllUsers()
        {
            var list = await _db.Users
                .Where(u => u.Status != UserStatus.Pending)  // Exclude Pending
                .Select(u => new {
                    u.UserId,
                    u.Name,
                    u.Email,
                    u.Branch,
                    u.Role,
                    Status = u.Status.ToString()
                })
                .ToListAsync();

            return Ok(list);
        }

        // Get pending users only
        [HttpGet("pending-users")]
        public async Task<IActionResult> PendingUsers()
        {
            var list = await _db.Users
                .Where(u => u.Status == UserStatus.Pending)
                .Select(u => new {
                    u.UserId,
                    u.Name,
                    u.Email,
                    u.Branch,
                    u.Role,
                    Status = u.Status.ToString()
                })
                .ToListAsync();

            return Ok(list);
        }

        // Approve user (set to Active)
        [HttpPut("approve/{userId}")]
        public async Task<IActionResult> Approve(string userId)
        {
            var user = await _db.Users.SingleOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return NotFound();

            if (user.Status == UserStatus.Active)
                return BadRequest(new { message = "User already active" });

            var old = user.Status;
            user.Status = UserStatus.Active;
            user.UpdatedAtUtc = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "User approved", from = old.ToString(), to = user.Status.ToString() });
        }

        // Deactivate user (set to Inactive)
        [HttpPut("deactivate/{userId}")]
        public async Task<IActionResult> Deactivate(string userId)
        {
            var user = await _db.Users.SingleOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return NotFound();

            user.Status = UserStatus.Inactive;
            user.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { message = "User deactivated" });
        }
    }
}
```

## After Adding the Endpoint

1. **Restart your ASP.NET Core API**
2. **Test the endpoint**:
   ```
   GET https://localhost:7021/api/admin/all-users
   Authorization: Bearer <your-admin-token>
   ```
3. **Expected Response**:
   ```json
   [
     {
       "userId": "admin",
       "name": "System Admin",
       "email": "admin@example.com",
       "branch": "HQ",
       "role": "Admin",
       "status": "Active"
     }
   ]
   ```

## What Changed in Angular

✅ `ngOnInit()` now calls `loadExistingUsersFromApi()` instead of `refreshFromAuth()`
✅ Existing users table loads from API endpoint `/api/admin/all-users`
✅ No local storage data shown in existing users table
✅ After approve/reject, both tables refresh from API

The existing users table now shows ONLY data from your database via the API!
