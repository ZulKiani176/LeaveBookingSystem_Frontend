import { api } from "./api";
import type { LeaveRequest, CreateLeaveRequestBody } from "../types/leave";

export async function fetchMyLeaveRequests() {
  return api<{ message: string; data: LeaveRequest[] }>("/api/leave-requests/status", { auth: true });
}

export async function requestLeave(body: CreateLeaveRequestBody) {
  return api<{ message: string; data: any }>("/api/leave-requests", {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function cancelLeave(leaveRequestId: number) {
  return api<{ message: string; data: any }>("/api/leave-requests", {
    method: "DELETE",
    auth: true,
    body: JSON.stringify({ leaveRequestId }),
  });
}

export async function fetchRemainingLeave() {
  return api<{ message: string; data: { "days remaining": number } }>("/api/leave-requests/remaining", { auth: true });
}
