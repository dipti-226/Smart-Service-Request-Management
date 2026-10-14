using System.ComponentModel.DataAnnotations;
using APP.Models.DTOs.Common;

namespace APP.Models.DTOs.Users
{
    public class UserListQueryDto : PagedQueryDto
    {
        [RegularExpression(
            "^(Admin|Employee|Technician)$",
            ErrorMessage = "Invalid role filter.")]
        public string? Role { get; set; }

        // null = all, true = active only, false = inactive only
        public bool? IsActive { get; set; }
    }
}