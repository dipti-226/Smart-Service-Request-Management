using APP.Models.Validation;
using System.ComponentModel.DataAnnotations;

namespace APP.Models.DTOs.Ai
{
    public class QuickTipsRequestDto
    {
        [Required(ErrorMessage = ValidationRules.DescriptionRequired)]
        [StringLength(ValidationRules.DescriptionMax, ErrorMessage = ValidationRules.DescriptionTooLong)]
        public string Description { get; set; } = string.Empty;

        // The request type chosen in the form so far (optional). Used to pick relevant tips.
        [StringLength(100)]
        public string? RequestType { get; set; }
    }
}