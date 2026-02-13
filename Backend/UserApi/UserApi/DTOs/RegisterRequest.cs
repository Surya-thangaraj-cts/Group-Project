using System.ComponentModel.DataAnnotations;
using UserApprovalApi.Models;

public class RegisterRequest
{
    [Required(ErrorMessage = "ID is required.")]
    public string UserId { get; set; } = default!;

    [Required(ErrorMessage = "Name is required.")]
    public string Name { get; set; } = default!;


    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Invalid email address.")]
    public string Email { get; set; } = default!;

    [Required(ErrorMessage = "Branch is required.")]
    public string? Branch { get; set; }

    // Must be "Admin", "Manager", or "Officer"
    [Required(ErrorMessage = "Role is required.")]
    public UserRole Role { get; set; } = UserRole.Officer;



    [Required(ErrorMessage = "Password is required.")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters.")]
    // Pattern: at least one letter and one digit (same as your Angular)
    [RegularExpression(@"^(?=.*[A-Za-z])(?=.*\d).+$",
                ErrorMessage = "Password must contain at least one letter and one digit.")]

    public string Password { get; set; } = default!;
}