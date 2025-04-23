import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => { // props are being destructured as children with added type definition
	const { user } = useAuth();
	return user ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;