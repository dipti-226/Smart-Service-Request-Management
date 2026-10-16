using System.ComponentModel.DataAnnotations;
using APP.Models.Validation;

namespace APP.Models.DTOs.Auth
{
    public class RegisterRequestDto
    {
        [Required(ErrorMessage = ValidationRules.UsernameRequired)]
        [MinLength(ValidationRules.UsernameMin, ErrorMessage = ValidationRules.UsernameTooShort)]
        [MaxLength(ValidationRules.UsernameMax, ErrorMessage = ValidationRules.UsernameTooLong)]
        [RegularExpression(ValidationRules.UsernamePattern, ErrorMessage = ValidationRules.UsernameInvalid)]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = ValidationRules.EmailRequired)]
        [MaxLength(ValidationRules.EmailMax, ErrorMessage = ValidationRules.EmailTooLong)]
        [RegularExpression(ValidationRules.EmailPattern, ErrorMessage = ValidationRules.EmailInvalid)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = ValidationRules.PasswordRequired)]
        [MinLength(ValidationRules.PasswordMin, ErrorMessage = ValidationRules.PasswordTooShort)]
        [MaxLength(ValidationRules.PasswordMax, ErrorMessage = ValidationRules.PasswordTooLong)]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = ValidationRules.ConfirmPasswordRequired)]
        [Compare(nameof(Password), ErrorMessage = ValidationRules.PasswordMismatch)]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}