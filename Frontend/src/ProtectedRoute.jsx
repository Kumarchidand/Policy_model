// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toLowerCase();

  // If no user, redirect to login
  if (!user) return <Navigate to="/" replace />;

  // If allowedRoles is set, only allow if role is present and matches
  if (allowedRoles) {
    if (!role) {
      // If role is missing, show nothing to avoid infinite redirect
      return null;
    }
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
