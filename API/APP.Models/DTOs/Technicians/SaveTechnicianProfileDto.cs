using System.ComponentModel.DataAnnotations;

namespace APP.Models.DTOs.Technicians
{
    public class SaveTechnicianProfileDto
    {
        [Required(ErrorMessage = "Full name is required.")]
        [StringLength(100, MinimumLength = 2,
            ErrorMessage = "Full name must be between 2 and 100 characters.")]
        public string FullName { get; set; } = string.Empty;

        [StringLength(20, ErrorMessage = "Phone number cannot be more than 20 characters.")]
        [RegularExpression(@"^[0-9+()\-\s]*$",
            ErrorMessage = "Phone number can contain digits, spaces, +, - and brackets only.")]
        public string? Phone { get; set; }

        [Required(ErrorMessage = "Select at least one specialization.")]
        [MinLength(1, ErrorMessage = "Select at least one specialization.")]
        [MaxLength(20, ErrorMessage = "Too many specializations selected.")]
        public List<int> SpecializationIds { get; set; } = new();
    }
}