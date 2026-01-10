export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export type LeaveRequest = {
  id: number;
  start_date: string;
  end_date: string;
  status: LeaveStatus;
  reason: string | null;
};

export type CreateLeaveRequestBody = {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  leaveType?: "Annual Leave" | "Sick Leave";
};
