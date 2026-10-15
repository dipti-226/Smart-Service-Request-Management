using System.ComponentModel.DataAnnotations;

namespace APP.Models.DTOs.Requests
{
    // Employee edit of an own request. Status is not part of it.
    public class UpdateOwnRequestDto
    {
        [Required]
        [StringLength(100)]
        public string RequestType { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string RequestDescription { get; set; } = string.Empty;

        [Required]
        [RegularExpression(
            "^(Low|Medium|High|Critical)$",
            ErrorMessage = "Priority must be Low, Medium, High or Critical.")]
        public string Priority { get; set; } = string.Empty;
    }
}