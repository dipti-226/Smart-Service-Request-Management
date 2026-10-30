export interface TechnicianRecommendation {
  // false when nobody can take the request (for example everyone is at the limit)
  hasRecommendation: boolean;
  technicianId: number | null;
  technicianName: string;
  activeRequests: number;
  maxActiveRequests: number;
  // true when the technician has a specialization for this request type
  matchesSpecialization: boolean;
  // A short explanation shown to the admin
  reason: string;
}