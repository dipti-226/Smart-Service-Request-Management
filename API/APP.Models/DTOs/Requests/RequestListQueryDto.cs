using System.ComponentModel.DataAnnotations;
using APP.Models.DTOs.Common;

namespace APP.Models.DTOs.Requests
{
    public class RequestListQueryDto : PagedQueryDto
    {
        [RegularExpression(
            "^(Open|In Progress|On Hold|Resolved|Closed|Cancelled)$",
            ErrorMessage = "Invalid status filter.")]
        public string? Status { get; set; }

        [RegularExpression(
            "^(Low|Medium|High|Critical)$",
            ErrorMessage = "Invalid priority filter.")]
        public string? Priority { get; set; }
    }
}