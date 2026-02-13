namespace UserApprovalApi.DTOs
{
    public class RegisterRequest
    {
        public string UserId { get; set; } = default!;
        public string Name { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? Branch { get; set; }
        public string Role { get; set; } = "User";
        public string Password { get; set; } = default!;
    }

    public class LoginRequest
    {
        public string UserId { get; set; } = default!;
        public string Password { get; set; } = default!;
    }

    public class UserResponse
    {
        public string UserId { get; set; } = default!;
        public string Name { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string? Branch { get; set; }
        public string Role { get; set; } = default!;
        public string Status { get; set; } = default!;
    }

    public class EditUserRequest
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Branch { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
    }
}