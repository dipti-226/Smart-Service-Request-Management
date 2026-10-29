export interface Specialization {
  specializationId: number;
  name: string;
  // The request type this specialization covers, for example "Network"
  requestType: string;
  isSelected: boolean;
}

export interface TechnicianProfile {
  userId: number;
  username: string;
  email: string;
  technicianId: number;
  fullName: string;
  phone: string;
  isProfileComplete: boolean;
  specializations: Specialization[];
}

export interface SaveTechnicianProfileRequest {
  fullName: string;
  phone: string;
  specializationIds: number[];
}