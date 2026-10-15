using System.ComponentModel.DataAnnotations;

namespace APP.Models.DTOs.Comments
{
    public class AddCommentDto
    {
        [Required]
        [StringLength(1000)]
        public string CommentText { get; set; } = string.Empty;
    }
}