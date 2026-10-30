using APP.Business.Ai;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Text.RegularExpressions;

namespace APP.Business.Services
{
    // The shared AI plumbing: on/off switch, provider choice, daily caps, text redaction.
    // Features (like the technician suggestion) use this and never talk to a provider directly.
    public class AiService
    {
        private static readonly Regex EmailPattern =
            new(@"[\w.+\-]+@[\w\-]+(\.[\w\-]+)+", RegexOptions.Compiled);

        private static readonly Regex NumberPattern =
            new(@"\+?\d[\d\s().\-]{6,}\d", RegexOptions.Compiled);

        private static readonly Regex WhitespacePattern =
            new(@"\s+", RegexOptions.Compiled);

        private readonly IConfiguration _configuration;
        private readonly GroqAiClient _groq;
        private readonly GeminiAiClient _gemini;
        private readonly string _connectionString;
        private readonly int _dailyLimitPerUser;
        private readonly int _dailyLimitTotal;

        public AiService(
            IConfiguration configuration,
            GroqAiClient groq,
            GeminiAiClient gemini)
        {
            _configuration = configuration;
            _groq = groq;
            _gemini = gemini;

            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection is not configured.");

            _dailyLimitPerUser = ReadPositiveInt("Ai:DailyLimitPerUser", 15);
            _dailyLimitTotal = ReadPositiveInt("Ai:DailyLimitTotal", 150);
        }

        private string ProviderName =>
            string.Equals(_configuration["Ai:Provider"], "Gemini", StringComparison.OrdinalIgnoreCase)
                ? "Gemini"
                : "Groq";

        private IAiClient Client => ProviderName == "Gemini" ? _gemini : _groq;

        // true only when AI is switched on AND the chosen provider has a key
        public bool IsEnabled
        {
            get
            {
                if (!bool.TryParse(_configuration["Ai:Enabled"], out bool enabled) || !enabled)
                {
                    return false;
                }

                return !string.IsNullOrWhiteSpace(_configuration[$"Ai:{ProviderName}:ApiKey"]);
            }
        }

        // Asks the AI and returns its JSON text, or null when the call fails
        public Task<string?> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            CancellationToken cancellationToken)
        {
            return Client.GetJsonAsync(systemPrompt, userPrompt, cancellationToken);
        }

        // Counts one AI call. false = the user's or the daily total limit is used up.
        public async Task<bool> TryConsumeAsync(int userId)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_AiUsage_TryConsume", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@UserId", SqlDbType.Int).Value = userId;
            command.Parameters.Add("@DailyLimitPerUser", SqlDbType.Int).Value = _dailyLimitPerUser;
            command.Parameters.Add("@DailyLimitTotal", SqlDbType.Int).Value = _dailyLimitTotal;

            await connection.OpenAsync();

            object? result = await command.ExecuteScalarAsync();

            return result is not null && Convert.ToBoolean(result);
        }

        // Removes emails and phone-like numbers, collapses spaces and shortens the text,
        // so free-text from users is safer to send to an outside service.
        public static string Redact(string? text, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return string.Empty;
            }

            string result = EmailPattern.Replace(text, "[email]");
            result = NumberPattern.Replace(result, "[number]");
            result = WhitespacePattern.Replace(result, " ").Trim();

            return result.Length > maxLength ? result[..maxLength] : result;
        }

        private int ReadPositiveInt(string key, int defaultValue)
        {
            return int.TryParse(_configuration[key], out int value) && value > 0
                ? value
                : defaultValue;
        }
    }
}