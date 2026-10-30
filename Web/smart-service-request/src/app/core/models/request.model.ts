export interface Request {

  requestId: number;
  requestCode: string;
  requestType: string;
  requestDescription: string;
  priority: string;
  status: string;
  createdDate: string;
  updatedDate: string | null;
}

export interface CreateRequest {

  requestType: string;
  requestDescription: string;
  priority: string;
}

export interface UpdateRequest {
  requestType: string;
  requestDescription: string;
  priority: string;
  status: string;
}

/*
 * Advanced Request
 * Used by  Advanced Angular Components
 */

export interface AdvancedRequest {
  requestId: number;
  requestCode: string;
  requestType: string;
  requestDescription: string;
  priority: string;
  status: string;
  technicianId: number | null;
  technicianName: string | null;
  createdDate: string;
  updatedDate: string | null;
}


/*
 * Technician
 */

export interface Technician {
  technicianId: number;
  technicianName: string;
  isActive: boolean;
  createdDate: string;

  // From the technician profile (empty until they complete it)
  fullName: string;
  // Comma-separated, for example "Hardware Repair, Network Support"
  specializations: string;

  // Open + In Progress + On Hold requests, and the limit from the API settings
  activeRequests: number;
  maxActiveRequests: number;
  isAtCapacity: boolean;
}


/*
 * Update Request Status
 */

export interface UpdateRequestStatus {
  status: string;
}


/*
 * Assign Technician
 */

export interface AssignTechnician {
  technicianId: number;
}

// Same list as the Create Request form
export const REQUEST_TYPES: string[] = [
  'Computer', 'Network', 'Software', 'Hardware', 'Other'
];