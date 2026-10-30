
namespace APP.Models.DTOs.Technicians
{
    public class TechnicianDto
    {
        public int TechnicianId { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedDate { get; set; }

        // From the technician's profile (empty until they complete it)
        public string FullName { get; set; } = string.Empty;

        // Comma-separated, for example "Hardware Repair, Network Support"
        public string Specializations { get; set; } = string.Empty;

        // Open + In Progress + On Hold requests assigned to this technician
        public int ActiveRequests { get; set; }

        // The limit from appsettings (Workload:MaxActiveRequestsPerTechnician)
        public int MaxActiveRequests { get; set; }

        public bool IsAtCapacity { get; set; }
    }
}