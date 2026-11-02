using System.Text.RegularExpressions;

namespace APP.Business.Ai
{
    // Small helpers for cleaning what an AI model sends back
    public static class AiText
    {
        private static readonly Regex FencePattern =
            new(@"^```(?:json)?\s*|\s*```$", RegexOptions.Compiled);

        private static readonly Regex ControlCharPattern =
            new(@"[\u0000-\u001F]+", RegexOptions.Compiled);

        private static readonly Regex WhitespacePattern =
            new(@"\s+", RegexOptions.Compiled);

        // Control characters except the line break
        private static readonly Regex NonNewlineControlPattern =
            new(@"[\u0000-\u0009\u000B-\u001F]+", RegexOptions.Compiled);

        private static readonly Regex TrailingSpacesPattern =
            new(@"[ \t]+\n", RegexOptions.Compiled);

        private static readonly Regex RepeatedSpacesPattern =
            new(@"[ \t]{2,}", RegexOptions.Compiled);

        private static readonly Regex ExtraBlankLinesPattern =
            new(@"\n{3,}", RegexOptions.Compiled);

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

        // Plain text that keeps its line breaks (at most one blank line in a row), with a length limit
        public static string CleanMultiline(string? text, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            string cleaned = text.Replace("\r\n", "\n").Replace('\r', '\n');
            cleaned = NonNewlineControlPattern.Replace(cleaned, " ");
            cleaned = TrailingSpacesPattern.Replace(cleaned, "\n");
            cleaned = RepeatedSpacesPattern.Replace(cleaned, " ");
            cleaned = ExtraBlankLinesPattern.Replace(cleaned, "\n\n").Trim();

            return cleaned.Length > maxLength
                ? cleaned[..maxLength].TrimEnd() + "..."
                : cleaned;
        }
    }
}