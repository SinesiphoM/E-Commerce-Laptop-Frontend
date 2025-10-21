import axios from 'axios';

class AuthService {
    constructor() {
        this.baseURL = 'http://localhost:8080';
        this.cleanupStorage(); // Clean up any corrupted data first
        this.setupAxiosInterceptors();
    }

    setupAxiosInterceptors() {
        // BULLETPROOF interceptor - forces removal of auth headers
        axios.interceptors.request.use(
            (config) => {
                const authEndpoints = ['/auth/login', '/auth/register'];
                const isAuthEndpoint = authEndpoints.some(endpoint => config.url.includes(endpoint));
                
                console.log(' URL:', config.url);
                console.log(' Is auth endpoint:', isAuthEndpoint);
                console.log(' Headers before:', config.headers.Authorization);
                
                if (isAuthEndpoint) {
                    // AGGRESSIVELY remove ALL possible auth headers
                    delete config.headers.Authorization;
                    delete config.headers.authorization;
                    delete config.headers['Authorization'];
                    delete config.headers['authorization'];
                    
                    // Also remove from common headers
                    if (config.headers.common) {
                        delete config.headers.common.Authorization;
                        delete config.headers.common.authorization;
                    }
                    
                    console.log(' Headers after cleanup:', config.headers.Authorization);
                    console.log(' AUTH ENDPOINT - All Authorization headers removed');
                } else {
                    // Use arrow function to maintain 'this' context
                    const token = localStorage.getItem('authToken');
                    if (token && token.length > 0) {
                        // Simple token validation
                        try {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            const isExpired = payload.exp * 1000 < Date.now();
                            
                            console.log(' JWT Token Analysis:');
                            console.log(' - Subject (sub):', payload.sub);
                            console.log(' - Authorities:', payload.authorities);
                            console.log(' - Roles:', payload.roles);
                            console.log(' - Role:', payload.role);
                            console.log(' - All claims:', payload);
                            console.log(' - Expires:', new Date(payload.exp * 1000));
                            console.log(' - Is expired:', isExpired);
                            
                            if (!isExpired) {
                                config.headers.Authorization = `Bearer ${token}`;
                                console.log(' Added Bearer token to request');
                            } else {
                                console.log(' Token expired, not adding');
                            }
                        } catch (e) {
                            console.log(' Invalid token format, not adding:', e);
                        }
                    } else {
                        console.log(' No token available');
                    }
                }
                
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    console.log(' 401 Unauthorized received - analyzing error:');
                    console.log(' Error response:', error.response.data);
                    console.log(' Request URL:', error.config?.url);
                    console.log(' Request headers:', error.config?.headers);

                    const token = localStorage.getItem('authToken');
                    let expired = true;
                    if (token) {
                        try {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            expired = payload.exp * 1000 < Date.now();
                            console.log(' Current JWT payload:', payload);
                            console.log(' JWT expires at:', new Date(payload.exp * 1000));
                            console.log(' Current time:', new Date());
                            console.log(' Token expired?:', expired);
                        } catch (e) {
                            console.log(' Could not decode JWT token');
                        }
                    } else {
                        console.log(' No token in localStorage at time of 401');
                    }

                    // Only force logout if token is missing or expired. Otherwise, propagate error for UI to handle.
                    if (!token || expired) {
                        console.log(' Clearing tokens and redirecting to home');
                        this.logout();
                        window.location.href = '/';
                    } else {
                        console.log(' 401 received but token not expired; not logging out automatically');
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    async login(email, password) {
        try {
            console.log('Attempting login for:', email);
            
            // Clear any existing tokens before login to avoid conflicts
            this.logout();
            
            // IMPORTANT: NO Authorization header for login as per API guide
            const response = await axios.post(`${this.baseURL}/auth/login`, {
                email,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                    //  DON'T ADD: 'Authorization': 'Bearer ...'
                }
            });

            console.log('🔍 Login response received:', response.data);

            const { token, ...userInfo } = response.data;
            
            // Debug: Show what we're storing
            console.log(' Token to store:', token ? 'Token present' : 'No token');
            console.log(' UserInfo to store:', userInfo);
            
            // Validate token format before storing
            if (!this.isValidTokenFormat(token)) {
                throw new Error('Invalid token format received from server');
            }
            
            // Store token and user info
            localStorage.setItem('authToken', token);
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            
            console.log(' Login successful, data stored in localStorage');
            return response.data;
        } catch (error) {
            console.error('Login error:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }

    async register(userData) {
        try {
            console.log('Attempting registration for:', userData.email);
            
            // Clear any existing tokens before registration to avoid conflicts
            this.logout();
            
            // IMPORTANT: NO Authorization header for registration as per API guide
            const response = await axios.post(`${this.baseURL}/auth/register`, userData, {
                headers: {
                    'Content-Type': 'application/json'
                    //  DON'T ADD: 'Authorization': 'Bearer ...'
                }
            });
            
            console.log('Registration response received:', response.data);
            // Do NOT auto-login on registration. Some backends may return a token here,
            // but we will require explicit login for clarity and security.
            // Simply return the response so the UI can prompt the user to log in.
            return response.data;
        } catch (error) {
            console.error('Registration error:', error.response?.data);
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }

    logout() {
        console.log(' Logging out - clearing all auth data');
        
        // Remove our current auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        
        // Also remove any legacy auth data that might cause conflicts
        const legacyKeys = ['token', 'jwt_token', 'user', 'userData', 'currentUser', 'access_token'];
        legacyKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                console.log(` Also removing legacy ${key}`);
                localStorage.removeItem(key);
            }
        });
    }

    getToken() {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            console.log('No token found in localStorage');
            return null;
        }
        
        // Validate token format
        if (!this.isValidTokenFormat(token)) {
            console.log('Removing invalid token format:', token.substring(0, 20) + '...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
            return null;
        }
        
        // Check if token is expired
        if (this.isTokenExpired(token)) {
            console.log('Token is expired, removing from storage');
            localStorage.removeItem('authToken');
            localStorage.removeItem('userInfo');
            return null;
        }
        
        console.log('Valid token found');
        return token;
    }

    isValidTokenFormat(token) {
        if (!token || typeof token !== 'string') return false;
        const parts = token.split('.');
        return parts.length === 3;
    }

    getUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    }

    isAuthenticated() {
        const token = this.getToken();
        return token && !this.isTokenExpired(token);
    }

    isAdmin() {
        const userInfo = this.getUserInfo();
        const token = this.getToken();
        
        // Debug: Log current user info and token payload
        console.log(' Checking admin status:');
        console.log(' UserInfo from localStorage:', userInfo);
        
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log(' JWT Token payload:', payload);
                console.log(' JWT authorities/roles:', payload.authorities || payload.roles || payload.role);
            } catch (e) {
                console.log(' Could not decode JWT payload');
            }
        }
        
        const isAdmin = userInfo?.role === 'ADMIN';
        console.log(' IsAdmin result:', isAdmin);
        return isAdmin;
    }

    isCustomer() {
        const userInfo = this.getUserInfo();
        return userInfo?.role === 'CUSTOMER';
    }

    isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        } catch (error) {
            return true;
        }
    }

    async getProfile() {
        try {
            const response = await axios.get(`${this.baseURL}/users/me`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch profile');
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await axios.put(`${this.baseURL}/users/me`, profileData);
            // Update stored user info
            const updatedUserInfo = { ...this.getUserInfo(), ...response.data };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    }

    // Delete current user
    async deleteMe() {
        try {
            const response = await axios.delete(`${this.baseURL}/users/me`);
            // Clear local storage upon self-delete
            this.logout();
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete account');
        }
    }

    // Clean up any corrupted tokens or invalid data
    cleanupStorage() {
        console.log(' Cleaning up localStorage...');
        
        // List of all possible token/user keys from different implementations
        const tokenKeys = ['authToken', 'token', 'jwt_token', 'access_token', 'bearer_token'];
        const userKeys = ['userInfo', 'user', 'userData', 'currentUser'];
        
        // Check current localStorage contents
        console.log(' Current localStorage keys:', Object.keys(localStorage));
        
        // Remove any corrupted or conflicting tokens
        tokenKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                if (value === 'undefined' || value === 'null' || value.length < 10) {
                    console.log(` Removing corrupted ${key}:`, value);
                    localStorage.removeItem(key);
                } else if (key !== 'authToken') {
                    // Remove old token formats, keep only our current 'authToken'
                    console.log(` Removing old token format ${key}`);
                    localStorage.removeItem(key);
                }
            }
        });
        
        // Remove any corrupted or conflicting user data
        userKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    JSON.parse(value);
                    if (key !== 'userInfo') {
                        // Remove old user data formats, keep only our current 'userInfo'
                        console.log(` Removing old user data format ${key}`);
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    console.log(` Removing corrupted ${key}`);
                    localStorage.removeItem(key);
                }
            }
        });
        
        // Also clean up any other common localStorage pollution
        const otherKeys = ['cart', 'checkout_redirect', 'campusEats_cart'];
        otherKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                console.log(` Found other app data: ${key} - leaving intact`);
            }
        });
        
        console.log(' Cleanup complete. Current auth keys:', {
            authToken: localStorage.getItem('authToken') ? 'Present' : 'Not found',
            userInfo: localStorage.getItem('userInfo') ? 'Present' : 'Not found'
        });
    }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;