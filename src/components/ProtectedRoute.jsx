import React from 'react';
import AuthService from '../services/authService';

const ProtectedRoute = ({ children, requiredRole = null, redirectTo = '/' }) => {
    if (!AuthService.isAuthenticated()) {
        // Since we use modal-based authentication, redirect to home page
        console.log('User not authenticated, redirecting to home page');
        window.location.href = redirectTo;
        return null;
    }

    if (requiredRole) {
        if (requiredRole === 'ADMIN' && !AuthService.isAdmin()) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50">
                    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                        <div className="text-red-600 text-6xl mb-4">🚫</div>
                        <h1 className="text-3xl font-bold text-red-600 mb-2">Access Denied</h1>
                        <p className="text-gray-600 mb-4">Admin privileges required to access this page.</p>
                        <button 
                            onClick={() => window.history.back()}
                            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            );
        }
        
        if (requiredRole === 'CUSTOMER' && !AuthService.isCustomer()) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-yellow-50">
                    <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                        <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
                        <h1 className="text-3xl font-bold text-yellow-600 mb-2">Access Restricted</h1>
                        <p className="text-gray-600 mb-4">Customer account required to access this page.</p>
                        <button 
                            onClick={() => window.history.back()}
                            className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600 transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            );
        }
    }

    return children;
};

export default ProtectedRoute;