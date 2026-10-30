namespace APP.Models.DTOs.Technicians
{
    public class TechnicianRecommendationDto
    {
        // false when nobody can take the request (for example everyone is at the limit)
        public bool HasRecommendation { get; set; }

        public int? TechnicianId { get; set; }
        public string TechnicianName { get; set; } = string.Empty;

        // The recommended technician's workload and the limit
        public int ActiveRequests { get; set; }
        public int MaxActiveRequests { get; set; }

        // true when the technician has a specialization for this request type
        public bool MatchesSpecialization { get; set; }

        // A short plain-language explanation shown to the admin
        public string Reason { get; set; } = string.Empty;
    }
}