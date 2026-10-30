using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace APP.Business.Ai
{
    // Gemini uses its own "generateContent" format
    public class GeminiAiClient : IAiClient
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeminiAiClient> _logger;

        public GeminiAiClient(HttpClient httpClient,IConfiguration configuration,ILogger<GeminiAiClient> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string?> GetJsonAsync(string systemPrompt,string userPrompt,CancellationToken cancellationToken)
        {
            string apiKey = _configuration["Ai:Gemini:ApiKey"] ?? string.Empty;

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("Ai:Gemini:ApiKey is not configured.");
                return null;
            }

            string baseUrl = (_configuration["Ai:Gemini:BaseUrl"] ?? "https://generativelanguage.googleapis.com/v1beta").TrimEnd('/');
            string model = _configuration["Ai:Gemini:Model"] ?? "gemini-3.5-flash-lite";

            var body = new
            {
                systemInstruction = new
                {
                    parts = new[] { new { text = systemPrompt } }
                },
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[] { new { text = userPrompt } }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.2,
                    maxOutputTokens = 1000,
                    responseMimeType = "application/json"
                }
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/models/{model}:generateContent")
            {
                Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
            };

            // The key goes in a header, so it never appears in a URL or a log
            request.Headers.Add("x-goog-api-key", apiKey);

            try
            {
                using HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken);
                string payload = await response.Content.ReadAsStringAsync(cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning(
                        "Gemini returned {StatusCode}: {Body}",
                        (int)response.StatusCode,
                        payload.Length > 300 ? payload[..300] : payload);

                    return null;
                }

                using JsonDocument document = JsonDocument.Parse(payload);

                return document.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "The Gemini request failed.");
                return null;
            }
        }
    }
}