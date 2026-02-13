using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UserApprovalApi.DTOs;
using UserApprovalApi.Models;
using UserApprovalApi.Repositories;

namespace UserApprovalApi.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IUserRepository _users;

        public AdminController(IUserRepository users)
        {
            _users = users;
        }

        [HttpGet("pending-users")]
        public async Task<IActionResult> PendingUsers(CancellationToken ct)
        {
            var list = (await _users.GetPendingUsersAsync(ct))
                .Select(u => new
                {
                    u.UserId,
                    u.Name,
                    u.Email,
                    u.Branch,
                    u.Role,
                    Status = u.Status.ToString()
                })
                .ToList();

            return Ok(list);
        }

        [HttpPut("deactivate/{userId}")]
        public async Task<IActionResult> Deactivate(string userId, CancellationToken ct)
        {
            var user = await _users.GetByIdAsync(userId, ct);
            if (user == null) return NotFound(new { message = "User not found" });

            user.Status = UserStatus.Inactive;
            user.UpdatedAtUtc = DateTime.UtcNow;

            await _users.UpdateAsync(user, ct);
            await _users.SaveChangesAsync(ct);

            return Ok(new { message = "User deactivated successfully" });
        }

        [HttpGet("approved-users")]
        public async Task<IActionResult> ApprovedUsers(CancellationToken ct)
        {
            var list = (await _users.GetApprovedUsersAsync(ct))
                .Select(u => new
                {
                    u.UserId,
                    u.Name,
                    u.Email,
                    u.Branch,
                    u.Role,
                    Status = u.Status.ToString()
                })
                .ToList();

            return Ok(list);
        }

        [HttpPut("approve/{userId}")]
        public async Task<IActionResult> Approve(string userId, CancellationToken ct)
        {
            var user = await _users.GetByIdAsync(userId, ct);
            if (user == null) return NotFound();

            if (user.Status == UserStatus.Active)
                return BadRequest(new { message = "User already active" });

            var old = user.Status;
            user.Status = UserStatus.Active;
            user.UpdatedAtUtc = DateTime.UtcNow;

            await _users.UpdateAsync(user, ct);
            await _users.SaveChangesAsync(ct);

            return Ok(new { message = "User approved", from = old.ToString(), to = user.Status.ToString() });
        }

        [HttpPut("edit/{userId}")]
        public async Task<IActionResult> EditUser(string userId, [FromBody] EditUserRequest req, CancellationToken ct)
        {
            var user = await _users.GetByIdAsync(userId, ct);
            if (user == null) return NotFound(new { message = "User not found" });

            if (!string.IsNullOrWhiteSpace(req.Name))
                user.Name = req.Name;

            if (!string.IsNullOrWhiteSpace(req.Email))
            {
                var emailExists = await _users.EmailExistsAsync(req.Email, userId, ct);
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

            if (!string.IsNullOrWhiteSpace(req.Status))
            {
                if (!Enum.TryParse<UserStatus>(req.Status, true, out var parsedStatus))
                    return BadRequest(new { message = $"Invalid status: {req.Status}" });
                user.Status = parsedStatus;
            }

            user.UpdatedAtUtc = DateTime.UtcNow;

            await _users.UpdateAsync(user, ct);
            await _users.SaveChangesAsync(ct);

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