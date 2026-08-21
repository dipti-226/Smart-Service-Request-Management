using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace APP.Models.DTOs.Requests
{
    public class UpdateRequestDto
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

        [Required]
        [RegularExpression(
            "^(Open|In Progress|Resolved)$",
            ErrorMessage = "Status must be Open, In Progress or Resolved.")]
        public string Status { get; set; } = string.Empty;
    }
}
