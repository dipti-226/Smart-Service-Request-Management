export interface UserListItem {
  userId: number;
  username: string;
  email: string;
  roleName: string;
  isActive: boolean;
  createdDate: string;
}

export interface CreateTechnician {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const USER_ROLES: string[] = ['Admin', 'Employee', 'Technician'];

export const USER_STATUSES: string[] = ['Active', 'Inactive'];