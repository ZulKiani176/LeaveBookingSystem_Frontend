import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./admindashboard";
import ManagerDashboard from "./managerdashboard";
import EmployeeDashboard from "./employeedashboard";

export default function DashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role.name === "admin") return <AdminDashboard />;
  if (user.role.name === "manager") return <ManagerDashboard />;

  return <EmployeeDashboard />;
}
