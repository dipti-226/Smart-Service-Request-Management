using System.ComponentModel.DataAnnotations;

namespace APP.Models.DTOs.Users
{
    public class SetUserActiveDto
    {
        // Nullable + Required: a missing value is rejected (it must never default to "deactivate")
        [Required]
        public bool? IsActive { get; set; }
    }
}