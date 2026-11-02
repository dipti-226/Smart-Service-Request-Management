namespace APP.Models.DTOs.Ai
{
    public class AiDescriptionHelpDto
    {
        // false = no help (AI off, limit reached, unusable answer...). See Note.
        public bool AiUsed { get; set; }

        // Why there is no help, or a short remark about it (for example why no rewrite is offered)
        public string Note { get; set; } = string.Empty;

        // Up to 3 short questions about details that are still missing (may be empty)
        public List<string> MissingDetails { get; set; } = new();

        // A clearer version of the user's own text. Empty = nothing to offer.
        public string ImprovedDescription { get; set; } = string.Empty;
    }
}