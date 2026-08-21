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