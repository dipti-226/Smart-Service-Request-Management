using System.ComponentModel.DataAnnotations;

namespace APP.Models.DTOs.Auth
{
    public class LoginRequestDto
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
