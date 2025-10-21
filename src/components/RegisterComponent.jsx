// RegisterComponent.jsx
import React, { useState } from 'react';
import AuthService from '../services/authService';

const RegisterComponent = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');

    const checkPasswordStrength = (password) => {
        if (password.length < 8) return 'Too short';
        if (!/(?=.*[a-z])/.test(password)) return 'Need lowercase';
        if (!/(?=.*[A-Z])/.test(password)) return 'Need uppercase';
        if (!/(?=.*\d)/.test(password)) return 'Need number';
        if (!/(?=.*[@$!%*?&])/.test(password)) return 'Need special char';
        return 'Strong';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'password') {
            setPasswordStrength(checkPasswordStrength(value));
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate password strength
        if (passwordStrength !== 'Strong') {
            setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
            setLoading(false);
            return;
        }

        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate phone number format
        if (!/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber)) {
            setError('Please enter a valid phone number (e.g., +27123456789)');
            setLoading(false);
            return;
        }

        try {
            const userData = await AuthService.register(formData);
            
            // Call success callback - let parent component handle UI updates
            if (onRegisterSuccess) {
                onRegisterSuccess(userData);
            } else {
                // If no callback provided, just refresh the page to update UI
                window.location.reload();
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 'Strong': return 'text-green-600';
            case 'Too short': return 'text-red-600';
            default: return 'text-yellow-600';
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={handleRegister} className="space-y-4">
                <h2 className="text-2xl font-bold mb-4 text-center text-orange-700">Register</h2>
                
                <div className="grid grid-cols-2 gap-4">
                    <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    />
                    <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    />
                </div>
                
                <div>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    />
                </div>
                
                <div>
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    />
                    {formData.password && (
                        <p className={`text-xs mt-1 ${getPasswordStrengthColor()}`}>
                            Password strength: {passwordStrength}
                        </p>
                    )}
                </div>
                
                <div>
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        className={`w-full border rounded-lg px-4 py-2 focus:outline-none ${
                            formData.confirmPassword && formData.password !== formData.confirmPassword
                                ? 'border-red-500 focus:border-red-500'
                                : formData.confirmPassword && formData.password === formData.confirmPassword
                                ? 'border-green-500 focus:border-green-500'
                                : 'border-gray-300 focus:border-orange-500'
                        }`}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                    />
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-xs mt-1 text-red-600">
                            Passwords do not match
                        </p>
                    )}
                    {formData.confirmPassword && formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 && (
                        <p className="text-xs mt-1 text-green-600">
                            Passwords match
                        </p>
                    )}
                </div>
                
                <div>
                    <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="Phone Number (e.g., +27123456789)"
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
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
                    disabled={loading || passwordStrength !== 'Strong' || formData.password !== formData.confirmPassword}
                    className="w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating Account...' : 'Register'}
                </button>
            </form>
            
            <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <button 
                    type="button" 
                    className="text-orange-600 font-semibold hover:underline" 
                    onClick={onSwitchToLogin}
                    disabled={loading}
                >
                    Login
                </button>
            </div>
        </div>
    );
};

export default RegisterComponent;
