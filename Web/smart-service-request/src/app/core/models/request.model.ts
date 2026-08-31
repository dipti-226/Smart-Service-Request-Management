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
 * Used by Day-08 Advanced Angular Components
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