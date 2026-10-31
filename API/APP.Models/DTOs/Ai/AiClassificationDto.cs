namespace APP.Models.DTOs.Ai
{
    public class AiClassificationDto
    {
        // false = no suggestion (AI off, limit reached, unusable answer...). See Note.
        public bool AiUsed { get; set; }

        // Why there is no suggestion (empty when there is one)
        public string Note { get; set; } = string.Empty;

        // Always one of the form's own request types (empty when AiUsed is false)
        public string RequestType { get; set; } = string.Empty;

        // Always Low, Medium, High or Critical (empty when AiUsed is false)
        public string Priority { get; set; } = string.Empty;

        // One short sentence explaining the suggestion
        public string Reason { get; set; } = string.Empty;
    }
}