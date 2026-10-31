using APP.Models.Validation;
using System.ComponentModel.DataAnnotations;

namespace APP.Models.DTOs.Ai
{
    public class ClassifyRequestDto
    {
        [Required(ErrorMessage = ValidationRules.DescriptionRequired)]
        [StringLength(ValidationRules.DescriptionMax, ErrorMessage = ValidationRules.DescriptionTooLong)]
        public string Description { get; set; } = string.Empty;
    }
}