namespace APP.Models.DTOs.Ai
{
    public class AiRequestSummaryDto
    {
        // false = no summary (AI off, limit reached, unusable answer...). See Note.
        public bool AiUsed { get; set; }

        // Why there is no summary (empty when there is one)
        public string Note { get; set; } = string.Empty;

        // What the request is about and where it stands now
        public string Overview { get; set; } = string.Empty;

        // What is stopping progress ("None" when nothing is)
        public string Blockers { get; set; } = string.Empty;

        // The most useful next action
        public string NextStep { get; set; } = string.Empty;

        // true when this is a saved summary (nothing changed since it was made)
        public bool Cached { get; set; }

        public DateTime? GeneratedAtUtc { get; set; }
    }
}