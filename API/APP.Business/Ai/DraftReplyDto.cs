using System.ComponentModel.DataAnnotations;

namespace APP.Models.DTOs.Ai
{
    public class DraftReplyDto
    {
        // What the reply is for: progress, info or resolved
        [Required(ErrorMessage = "Choose what kind of reply to draft.")]
        [RegularExpression("^(progress|info|resolved)$", ErrorMessage = "Unknown reply type.")]
        public string Intent { get; set; } = string.Empty;
    }
}