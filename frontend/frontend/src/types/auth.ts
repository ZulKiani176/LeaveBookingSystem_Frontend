export type Role = {
  roleId: number;
  name: "employee" | "manager" | "admin" | string;
};

export type MeResponse = {
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
};

export type LoginResponse = {
  token: string;
};
