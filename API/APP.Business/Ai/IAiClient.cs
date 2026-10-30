namespace APP.Business.Ai
{
    // One AI provider. Both Groq and Gemini implement this, so the rest of the app
    // does not care which one is switched on.
    public interface IAiClient
    {
        // Sends the prompts and returns the model's JSON text, or null when the call fails
        Task<string?> GetJsonAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken);
    }
}