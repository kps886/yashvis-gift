import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Redirects to login if not authenticated
// Redirects to home if authenticated but wrong role
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isLoggedIn } = useAuth();
    const location = useLocation();

    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their appropriate dashboard
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
