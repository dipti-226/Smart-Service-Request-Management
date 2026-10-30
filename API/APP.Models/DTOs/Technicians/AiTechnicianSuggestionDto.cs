namespace APP.Models.DTOs.Technicians
{
    public class AiTechnicianSuggestionDto
    {
        // true when the AI really produced this order. false = the standard rule order
        public bool AiUsed { get; set; }

        // Why the AI was not used (shown to the admin), empty when it was used
        public string Note { get; set; } = string.Empty;

        // The AI's short reason (empty when the AI was not used)
        public string Reason { get; set; } = string.Empty;

        public int? RecommendedTechnicianId { get; set; }

        // true when the AI's first choice differs from the standard rule's first choice
        public bool AiChangedTopChoice { get; set; }

        // Only technicians the server already considers eligible, in the suggested order
        public List<EligibleTechnicianDto> Technicians { get; set; } = new();
    }
}