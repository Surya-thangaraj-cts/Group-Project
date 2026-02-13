using Microsoft.AspNetCore.Mvc;
using UserApprovalApi.DTOs;
using UserApprovalApi.Models;
using UserApprovalApi.Services;
using UserApprovalApi.Repositories;

namespace UserApprovalApi.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserRepository _users;
        private readonly JwtService _jwt;

        public AuthController(IUserRepository users, JwtService jwt)
        {
            _users = users;
            _jwt = jwt;
        }


        


        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
        {

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            // Check duplicates
            if (await _users.AnyByUserIdOrEmailAsync(req.UserId, req.Email, ct))
                return Conflict(new { message = "UserId or Email already exists" });

            // Hash password
            var (hash, salt) = PasswordService.HashPassword(req.Password);

            // Map to entity
            var user = new User
            {
                UserId = req.UserId,
                Name = req.Name,
                Email = req.Email,
                Branch = req.Branch,
                Role = req.Role,               // Assuming req.Role is already a UserRole (enum). If string, parse first.
                PasswordHash = hash,
                PasswordSalt = salt,
                Status = UserStatus.Pending
            };

            // Persist
            await _users.AddAsync(user, ct);
            await _users.SaveChangesAsync(ct);

            return Ok(new { message = "Registration submitted. Await admin approval." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken ct)
        {
            // Lookup
            var user = await _users.GetByUserIdAsync(req.UserId, ct);
            if (user == null)
                return Unauthorized(new { message = "Invalid credentials" });

            // Verify password
            if (!PasswordService.Verify(req.Password, user.PasswordHash, user.PasswordSalt))
                return Unauthorized(new { message = "Invalid credentials" });

            // Status check
            if (user.Status != UserStatus.Active)
                return Forbid("Account not approved or inactive");

            // Create JWT
            var token = _jwt.CreateToken(user);

            // Response
            return Ok(new
            {
                token,
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