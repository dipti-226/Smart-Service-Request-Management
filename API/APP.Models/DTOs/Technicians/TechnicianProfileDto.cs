namespace APP.Models.DTOs.Technicians
{
    public class TechnicianProfileDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int TechnicianId { get; set; }

        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

        // Full name filled in and at least one specialization chosen
        public bool IsProfileComplete { get; set; }

        // Every active specialization, with IsSelected for the ones this technician chose
        public List<SpecializationDto> Specializations { get; set; } = new();
    }
}