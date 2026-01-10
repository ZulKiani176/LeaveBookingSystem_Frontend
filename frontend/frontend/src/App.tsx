import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/login";
import DashboardRouter from "./pages/dashboardrouter";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/roleRoute";
import AdminDashboard from "./pages/admindashboard";
import ManagerDashboard from "./pages/managerdashboard";
import EmployeeDashboard from "./pages/employeedashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      {/* Optional: direct role routes (guarded) */}
      <Route
        path="/employee"
        element={
          <RoleRoute allow={["employee"]}>
            <EmployeeDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <RoleRoute allow={["manager"]}>
            <ManagerDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <RoleRoute allow={["admin"]}>
            <AdminDashboard />
          </RoleRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
