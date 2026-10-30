using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace APP.Business.Ai
{
    // Groq uses the OpenAI-style "chat completions" format
    public class GroqAiClient : IAiClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GroqAiClient> _logger;

        public GroqAiClient(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GroqAiClient> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string?> GetJsonAsync(
            string systemPrompt,
            string userPrompt,
            CancellationToken cancellationToken)
        {
            string apiKey = _configuration["Ai:Groq:ApiKey"] ?? string.Empty;

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("Ai:Groq:ApiKey is not configured.");
                return null;
            }

            string baseUrl = (_configuration["Ai:Groq:BaseUrl"] ?? "https://api.groq.com/openai/v1").TrimEnd('/');
            string model = _configuration["Ai:Groq:Model"] ?? "openai/gpt-oss-20b";

            var body = new Dictionary<string, object>
            {
                ["model"] = model,
                ["messages"] = new object[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                },
                ["temperature"] = 0.2,
                ["max_completion_tokens"] = 700,
                ["response_format"] = new { type = "json_object" }
            };

            // The gpt-oss models "think" before answering. Keep that short to save free-tier tokens.
            if (model.Contains("gpt-oss", StringComparison.OrdinalIgnoreCase))
            {
                body["reasoning_effort"] = "low";
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/chat/completions")
            {
                Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
            };

            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            try
            {
                using HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken);
                string payload = await response.Content.ReadAsStringAsync(cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning(
                        "Groq returned {StatusCode}: {Body}",
                        (int)response.StatusCode,
                        payload.Length > 300 ? payload[..300] : payload);

                    return null;
                }

                using JsonDocument document = JsonDocument.Parse(payload);

                return document.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "The Groq request failed.");
                return null;
            }
        }
    }
}