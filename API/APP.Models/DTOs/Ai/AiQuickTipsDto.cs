namespace APP.Models.DTOs.Ai
{
    public class AiQuickTipsDto
    {
        // true = the AI ran (the list may still be empty: nothing simple to try)
        public bool AiUsed { get; set; }

        // true = the description looks like a security matter, so no tips are given
        public bool SecurityConcern { get; set; }

        // A short remark: why there are no tips, or the security advice (empty otherwise)
        public string Note { get; set; } = string.Empty;

        // 2 to 4 short, safe steps (empty when there is nothing simple to try)
        public List<string> Tips { get; set; } = new();
    }
}