using System.ComponentModel.DataAnnotations;

namespace APP.Models.DTOs.Common
{
    // Shared query values for every paged list
    public class PagedQueryDto
    {
        [StringLength(100)]
        public string? Search { get; set; }

        public string? SortBy { get; set; }

        [RegularExpression(
            "^(ASC|DESC|asc|desc)$",
            ErrorMessage = "SortDir must be ASC or DESC.")]
        public string? SortDir { get; set; }

        [Range(1, int.MaxValue)]
        public int PageNumber { get; set; } = 1;

        [Range(1, 100)]
        public int PageSize { get; set; } = 10;
    }
}