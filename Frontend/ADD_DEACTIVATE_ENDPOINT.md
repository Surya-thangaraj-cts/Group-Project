# Add Deactivate User Endpoint

Your Angular app is now configured to allow status editing, but you need to add this endpoint to your ASP.NET Core `AdminController.cs`:

## Add This Method to AdminController.cs

```csharp
[HttpPut("deactivate/{userId}")]
public async Task<IActionResult> Deactivate(string userId)
{
    var user = await _db.Users.SingleOrDefaultAsync(u => u.UserId == userId);
    if (user == null) return NotFound(new { message = "User not found" });

    // Set status to Inactive
    user.Status = UserStatus.Inactive;
    user.UpdatedAtUtc = DateTime.UtcNow;
    await _db.SaveChangesAsync();
    
    return Ok(new { 
        message = "User deactivated successfully",
        from = "Active",
        to = user.Status.ToString()
    });
}
```

## Complete AdminController.cs Reference

Your controller should have these endpoints:

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

        // Get all approved users (Active status)
        [HttpGet("approved-users")]
        public async Task<IActionResult> ApprovedUsers()
        {
            var list = await _db.Users
                .Where(u => u.Status == UserStatus.Active)
                .Select(u => new {
                    u.UserId,
                    u.Name,
                    u.Email,
                    u.Branch,
                    Role = u.Role.ToString(),
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
                    Role = u.Role.ToString(),
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
            if (user == null) return NotFound(new { message = "User not found" });

            if (user.Status == UserStatus.Active)
                return BadRequest(new { message = "User already active" });

            var old = user.Status;
            user.Status = UserStatus.Active;
            user.UpdatedAtUtc = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(new { message = "User approved", from = old.ToString(), to = user.Status.ToString() });
        }

        // ✅ NEW: Deactivate user (set to Inactive)
        [HttpPut("deactivate/{userId}")]
        public async Task<IActionResult> Deactivate(string userId)
        {
            var user = await _db.Users.SingleOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return NotFound(new { message = "User not found" });

            user.Status = UserStatus.Inactive;
            user.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            
            return Ok(new { 
                message = "User deactivated successfully",
                from = "Active",
                to = user.Status.ToString()
            });
        }

        // Edit user details
        [HttpPut("edit/{userId}")]
        public async Task<IActionResult> EditUser(string userId, [FromBody] EditUserRequest req)
        {
            var user = await _db.Users.SingleOrDefaultAsync(u => u.UserId == userId);
            if (user == null) return NotFound(new { message = "User not found" });

            if (user.Status != UserStatus.Active)
                return BadRequest(new { message = "Only approved (active) users can be edited" });

            if (!string.IsNullOrWhiteSpace(req.Name))
                user.Name = req.Name;

            if (!string.IsNullOrWhiteSpace(req.Email))
            {
                var emailExists = await _db.Users.AnyAsync(u => u.Email == req.Email && u.UserId != userId);
                if (emailExists)
                    return Conflict(new { message = "Email already in use by another user" });
                user.Email = req.Email;
            }

            if (req.Branch != null)
                user.Branch = req.Branch;

            if (!string.IsNullOrWhiteSpace(req.Role))
            {
                if (!Enum.TryParse<UserRole>(req.Role, true, out var parsedRole))
                    return BadRequest(new { message = $"Invalid role: {req.Role}" });
                user.Role = parsedRole;
            }

            user.UpdatedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "User updated successfully",
                user = new UserResponse
                {
                    UserId = user.UserId,
                    Name = user.Name,
                    Email = user.Email,
                    Branch = user.Branch,
                    Role = user.Role.ToString(),
                    Status = user.Status.ToString()
                }
            });
        }
    }
}
```

## After Adding the Endpoint

1. **Restart your ASP.NET Core API**
2. **Test in your Angular app**:
   - Edit a user and change status from Active to Inactive
   - Should call `PUT /api/admin/deactivate/{userId}`
   - Change status from Inactive to Active
   - Should call `PUT /api/admin/approve/{userId}`

## How It Works

- **Status Change (Active → Inactive)**: Calls `/api/admin/deactivate/{userId}`
- **Status Change (Inactive → Active)**: Calls `/api/admin/approve/{userId}`
- **Field Changes (name, email, role, branch)**: Calls `/api/admin/edit/{userId}`
- Angular detects which field changed and calls the appropriate endpoint

Now you can edit user status directly from the existing users table!
