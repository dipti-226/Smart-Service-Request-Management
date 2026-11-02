namespace APP.Models.DTOs.Ai
{
    public class AiReplyDraftDto
    {
        // false = no draft (AI off, limit reached, unusable answer...). See Note.
        public bool AiUsed { get; set; }

        // Why there is no draft (empty when there is one)
        public string Note { get; set; } = string.Empty;

        // The draft comment (plain text, may have line breaks). The person edits it before posting.
        public string Draft { get; set; } = string.Empty;
    }
}