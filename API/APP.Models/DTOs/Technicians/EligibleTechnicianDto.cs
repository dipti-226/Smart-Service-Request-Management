namespace APP.Models.DTOs.Technicians
{
    public class EligibleTechnicianDto
    {
        public int TechnicianId { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public int ActiveRequests { get; set; }
        public int MaxActiveRequests { get; set; }
        public bool MatchesSpecialization { get; set; }
    }
}