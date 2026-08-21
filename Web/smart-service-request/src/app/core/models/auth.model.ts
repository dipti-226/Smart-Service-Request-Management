export interface LoginRequest {
  adminName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  adminName: string;
  expiresAt: string;
}