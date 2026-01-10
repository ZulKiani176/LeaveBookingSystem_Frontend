export type RoleName = "employee" | "manager" | "admin" | string;

export interface Role {
  roleId: number;
  name: RoleName;
}

export interface MeResponse {
  message: string;
  data: {
    userId: number;
    firstname: string;
    surname: string;
    email: string;
    department: string;
    annualLeaveBalance: number;
    role: Role;
  };
}

export interface LoginResponse {
  token: string;
}
