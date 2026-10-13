
namespace APP.Models.DTOs.Requests
{
    public class DashboardDto
    {
        public int TotalRequests { get; set; }
        public int OpenRequests { get; set; }
        public int InProgressRequests { get; set; }
        public int ResolvedRequests { get; set; }
        public int OnHoldRequests { get; set; }
        public int ClosedRequests { get; set; }
        public int CancelledRequests { get; set; }
    }
}
