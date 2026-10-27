namespace APP.Models.DTOs.AdvancedRequests
{
    // One step in the life of a request (one row of RequestStatusHistory)
    public class RequestStatusHistoryDto
    {
        public int HistoryId { get; set; }
        public int RequestId { get; set; }

        // null for the first step (the request was created)
        public string? OldStatus { get; set; }
        public string NewStatus { get; set; } = string.Empty;

        public int? ChangedByUserId { get; set; }
        public string? ChangedByUsername { get; set; }
        public string? ChangedByRole { get; set; }

        public string? Remarks { get; set; }
        public DateTime ChangedDate { get; set; }
    }
}