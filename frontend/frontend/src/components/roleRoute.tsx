import { Navigate } from "react-router-dom";
import { useAuth, type RoleName } from "../context/AuthContext";

type Props = {
  allow: RoleName[];
  children: React.ReactNode;
};

export default function RoleRoute({ allow, children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (!allow.includes(user.role.name)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
