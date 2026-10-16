using System.ComponentModel.DataAnnotations;
using APP.Models.Validation;

namespace APP.Models.DTOs.Comments
{
    public class AddCommentDto
    {
        [Required(ErrorMessage = ValidationRules.CommentRequired)]
        [MaxLength(ValidationRules.CommentMax, ErrorMessage = ValidationRules.CommentTooLong)]
        public string CommentText { get; set; } = string.Empty;
    }
}