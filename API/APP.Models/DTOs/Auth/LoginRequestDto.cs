using System.ComponentModel.DataAnnotations;
using APP.Models.Validation;

namespace APP.Models.DTOs.Auth
{
    public class LoginRequestDto
    {
        [Required(ErrorMessage = ValidationRules.UsernameRequired)]
        [MaxLength(ValidationRules.UsernameMax, ErrorMessage = ValidationRules.UsernameTooLong)]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = ValidationRules.PasswordRequired)]
        [MaxLength(ValidationRules.PasswordMax, ErrorMessage = ValidationRules.PasswordTooLong)]
        public string Password { get; set; } = string.Empty;
    }
}