using System.Text.RegularExpressions;

namespace APP.Business.Ai
{
    // Small helpers for cleaning what an AI model sends back
    public static class AiText
    {
        private static readonly Regex FencePattern = new(@"^```(?:json)?\s*|\s*```$", RegexOptions.Compiled);

        private static readonly Regex ControlCharPattern = new(@"[\u0000-\u001F]+", RegexOptions.Compiled);

        private static readonly Regex WhitespacePattern = new(@"\s+", RegexOptions.Compiled);

        // Some models wrap their JSON in a code fence
        public static string StripCodeFence(string text)
        {
            return FencePattern.Replace(text.Trim(), string.Empty).Trim();
        }

        // Plain text only, on one line, with a length limit
        public static string CleanText(string? text, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            string cleaned = ControlCharPattern.Replace(text, " ");
            cleaned = WhitespacePattern.Replace(cleaned, " ").Trim();

            return cleaned.Length > maxLength
                ? cleaned[..maxLength].TrimEnd() + "..."
                : cleaned;
        }
    }
}