// LoginComponent.jsx
import React, { useState } from 'react';
import AuthService from '../services/authService';

const LoginComponent = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userData = await AuthService.login(credentials.email, credentials.password);
            
            // Call success callback
            if (onLoginSuccess) {
                onLoginSuccess(userData);
            } else {
                // If no callback provided, reload page to update UI
                window.location.reload();
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleLogin} className="space-y-4">
                <h2 className="text-2xl font-bold mb-4 text-center text-orange-700">Login</h2>
                
                <div>
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                        value={credentials.email}
                        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                        required
                        disabled={loading}
                    />
                </div>
                
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                        value={credentials.password}
                        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                        required
                        disabled={loading}
                    />
                </div>
                
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            
            <div className="mt-4 text-center text-sm">
                Don't have an account?{' '}
                <button 
                    type="button" 
                    className="text-orange-600 font-semibold hover:underline" 
                    onClick={onSwitchToRegister}
                    disabled={loading}
                >
                    Sign up now
                </button>
            </div>

    
        </div>
    );
};

export default LoginComponent;
