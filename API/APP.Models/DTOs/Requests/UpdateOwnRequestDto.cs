using System.ComponentModel.DataAnnotations;
using APP.Models.Validation;

namespace APP.Models.DTOs.Requests
{
    // Employee edit of an own request. Status is not part of it.
    public class UpdateOwnRequestDto
    {
        [Required(ErrorMessage = ValidationRules.RequestTypeRequired)]
        [MaxLength(ValidationRules.RequestTypeMax, ErrorMessage = ValidationRules.RequestTypeTooLong)]
        public string RequestType { get; set; } = string.Empty;

        [Required(ErrorMessage = ValidationRules.DescriptionRequired)]
        [MaxLength(ValidationRules.DescriptionMax, ErrorMessage = ValidationRules.DescriptionTooLong)]
        public string RequestDescription { get; set; } = string.Empty;

        [Required(ErrorMessage = ValidationRules.PriorityRequired)]
        [RegularExpression(ValidationRules.PriorityPattern, ErrorMessage = ValidationRules.PriorityInvalid)]
        public string Priority { get; set; } = string.Empty;
    }
}