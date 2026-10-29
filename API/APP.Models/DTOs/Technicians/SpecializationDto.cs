namespace APP.Models.DTOs.Technicians
{
    public class SpecializationDto
    {
        public int SpecializationId { get; set; }
        public string Name { get; set; } = string.Empty;

        // The request type this specialization covers (for example "Network")
        public string RequestType { get; set; } = string.Empty;

        // true when the logged-in technician has chosen it
        public bool IsSelected { get; set; }
    }
}