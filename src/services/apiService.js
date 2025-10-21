import axios from 'axios';
import AuthService from './authService';

class ApiService {
    async getPaymentStatuses() {
        try {
            const response = await axios.get(`${this.baseURL}/payments/statuses`, { headers: { ...this.getAuthHeaders() } });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch payment statuses');
        }
    }
    constructor() {
        this.baseURL = 'http://localhost:8080';
    }

    getAuthHeaders() {
        const token = AuthService.getToken?.() || localStorage.getItem('authToken');
        if (token) {
            return { Authorization: `Bearer ${token}` };
        }
        return {};
    }

    // Error handling utility as per API guide
    handleApiError(error) {
        if (error.response) {
            const { status, data } = error.response;
            
            switch (status) {
                case 400:
                    return `Validation Error: ${data.message || 'Invalid request'}`;
                case 401: {
                    const hasToken = !!(localStorage.getItem('authToken'));
                    return hasToken
                        ? 'Unauthorized. Your account may not have the required permissions.'
                        : 'Session expired. Please login again.';
                }
                case 403:
                    return 'Access denied. Insufficient privileges.';
                case 404:
                    return 'Resource not found.';
                case 500:
                    return 'Server error. Please try again later.';
                default:
                    return data.message || 'An unexpected error occurred.';
            }
        }
        return 'Network error. Please check your connection.';
    }

    // ========== LAPTOP API ==========
    
    async getLaptops() {
        try {
            const response = await axios.get(`${this.baseURL}/laptops/all`);
            return response.data;
        } catch (error) {
            throw new Error(this.handleApiError(error));
        }
    }

    async getLaptopById(id) {
        try {
            const response = await axios.get(`${this.baseURL}/laptops/read/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(this.handleApiError(error));
        }
    }

    async createLaptop(laptopData) {
        try {
            const response = await axios.post(
                `${this.baseURL}/laptops/save`,
                laptopData,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(this.handleApiError(error));
        }
    }

    async createLaptopWithImage(laptopData, imageFile) {
        try {
            const formData = new FormData();
            formData.append('brand', laptopData.brand);
            formData.append('model', laptopData.model);
            formData.append('specifications', laptopData.specifications);
            formData.append('price', laptopData.price);
            formData.append('laptopCondition', laptopData.laptopCondition);
            
            if (imageFile) {
                formData.append('image', imageFile);
            }

            // Let axios set the correct multipart boundary automatically
            const response = await axios.post(
                `${this.baseURL}/laptops/create-with-image`,
                formData,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            // Fallbacks when multipart fails: try JSON base64 endpoint, then (legacy) two-step create+upload
            try {
                const token = AuthService.getToken?.() || localStorage.getItem('authToken');
                if (!token) throw error;

                // Attempt JSON base64 path if we have a file
                if (imageFile) {
                    const base64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const res = reader.result;
                            const commaIdx = typeof res === 'string' ? res.indexOf(',') : -1;
                            resolve(commaIdx >= 0 ? res.substring(commaIdx + 1) : res);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(imageFile);
                    });

                    const jsonResp = await axios.post(
                        `${this.baseURL}/laptops/create`,
                        { ...laptopData, imageBase64: base64 },
                        { headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' } }
                    );
                    return jsonResp.data;
                }

                // As a last resort, create without image (legacy), then upload image
                const createResp = await axios.post(
                    `${this.baseURL}/laptops/save`,
                    laptopData,
                    { headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' } }
                );
                const created = createResp.data;
                return created;
            } catch (fallbackErr) {
                throw new Error(this.handleApiError(fallbackErr));
            }
        }
    }

    async updateLaptop(laptopData) {
        try {
            const response = await axios.put(
                `${this.baseURL}/laptops/update`,
                laptopData,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(this.handleApiError(error));
        }
    }

    async deleteLaptop(id) {
        try {
            const response = await axios.delete(
                `${this.baseURL}/laptops/delete/${id}`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(this.handleApiError(error));
        }
    }

    async uploadLaptopImage(laptopId, imageFile) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            // Let axios set the correct multipart boundary automatically
            const response = await axios.post(
                `${this.baseURL}/laptops/${laptopId}/upload-image`,
                formData,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(this.handleApiError(error));
        }
    }

    async getLaptopImage(laptopId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/laptops/${laptopId}/image`,
                { headers: { ...this.getAuthHeaders() }, responseType: 'blob' }
            );
            return response.data; // Blob
        } catch (error) {
            throw new Error(this.handleApiError(error));
        }
    }

    // ========== ORDER API ==========
    
    // Debug method to test endpoint connectivity
    async testOrderEndpoint() {
        try {
            // Try a simple GET to see if the orders endpoint is accessible
            const response = await axios.get(
                `${this.baseURL}/orders/my`,
                { headers: { ...this.getAuthHeaders() } }
            );
            console.log('Orders endpoint is accessible:', response.status);
            return { accessible: true, status: response.status };
        } catch (error) {
            console.log('Orders endpoint test failed:', error.response?.status || error.message);
            return { accessible: false, error: error.response?.status || error.message };
        }
    }
    
    async createOrder(orderData) {
        try {
            const response = await axios.post(
                `${this.baseURL}/orders/create`,
                orderData,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create order');
        }
    }

    async createOrderWithPayment(orderData) {
        try {
            // Step 1: Get current user ID from the authenticated user profile
            console.log('Fetching current user profile...');
            const currentUser = await this.getCurrentUser();
            console.log('Current user:', currentUser);

            if (!currentUser || !currentUser.userID) {
                throw new Error('Unable to get current user information');
            }

            // Step 2: Validate and extract laptop IDs
            const laptopIds = [];
            if (orderData.laptops && Array.isArray(orderData.laptops)) {
                for (const item of orderData.laptops) {
                    const laptopId = item.laptopId || item.laptopID || item.id;
                    if (!laptopId || isNaN(Number(laptopId))) {
                        throw new Error(`Invalid laptop ID: ${laptopId}`);
                    }
                    // Add laptop ID for each quantity (backend expects individual laptop IDs)
                    const quantity = Math.max(1, Number(item.quantity || 1));
                    for (let i = 0; i < quantity; i++) {
                        laptopIds.push(Number(laptopId));
                    }
                }
            }

            if (laptopIds.length === 0) {
                throw new Error('No valid laptop IDs found in order');
            }

            // Step 3: Prepare the correct request format based on backend expectations
            const requestData = {
                userId: currentUser.userID,
                laptopIds: laptopIds,
                paymentMethod: orderData.paymentMethod || 'CASH_ON_DELIVERY'
            };

            console.log('Sending order request:', requestData);

            const response = await axios.post(
                `${this.baseURL}/orders/create-with-payment`,
                requestData,
                { 
                    headers: { 
                        ...this.getAuthHeaders(), 
                        'Content-Type': 'application/json' 
                    } 
                }
            );

            console.log('Order created successfully:', response.data);
            return response.data;

        } catch (error) {
            console.error('Order creation failed:', error.response?.data || error.message);
            
            const status = error.response?.status;
            const data = error.response?.data;
            
            if (status === 400) {
                const validationMsg = data?.message || 'Invalid order data. Please check laptop IDs and payment method.';
                throw new Error(`Validation Error: ${validationMsg}`);
            }
            if (status === 401) {
                throw new Error('Please login to place an order');
            }
            if (status === 403) {
                throw new Error('Access denied. You may not have permission to place orders.');
            }
            if (status === 404) {
                throw new Error('One or more laptops in your order were not found');
            }
            
            throw new Error(data?.message || 'Failed to create order with payment');
        }
    }

    async getUserOrders(userId) {
        try {
            // If userId not provided, try to fetch from stored userInfo
            if (!userId) {
                try {
                    const userInfoStr = localStorage.getItem('userInfo');
                    if (userInfoStr) {
                        const userInfo = JSON.parse(userInfoStr);
                        userId = userInfo?.id || userInfo?.userId || userInfo?.userID;
                    }
                } catch (e) {
                    // ignore parsing error
                }
            }
            if (!userId) {
                throw new Error('Missing user id for fetching user orders');
            }
            const response = await axios.get(
                `${this.baseURL}/orders/user/${userId}`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch orders');
        }
    }

    async getMyOrders() {
        try {
            const response = await axios.get(
                `${this.baseURL}/orders/my`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw error; // Let caller decide fallback
        }
    }

    async getOrderById(orderId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/orders/read/${orderId}`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch order');
        }
    }

    async getOrderDetails(orderId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/orders/${orderId}/details`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            if (status === 404) throw new Error('Order not found');
            if (status === 403) throw new Error('Access denied to this order');
            throw new Error(error.response?.data?.message || 'Failed to fetch order details');
        }
    }

    async cancelOrder(orderId) {
        try {
            // Backend doesn't expose a dedicated cancel endpoint.
            // Consider implementing one, or use update/update-status endpoints accordingly.
            throw new Error('Cancel order endpoint is not available on the backend');
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to cancel order');
        }
    }

    // ========== USER API ==========
    
    async getCurrentUser() {
        try {
            const response = await axios.get(
                `${this.baseURL}/users/me`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to get current user information');
        }
    }

    // ========== ADMIN API ==========
    
    // Debug method to test admin endpoints
    async testAdminEndpoints() {
        console.log('=== Testing Admin Endpoints ===');
        
        try {
            // Test basic admin orders endpoint
            console.log('1. Testing /admin/orders...');
            const orders = await axios.get(`${this.baseURL}/admin/orders`, { headers: { ...this.getAuthHeaders() } });
            console.log(' /admin/orders response:', orders.data);
            
            if (orders.data && orders.data.length > 0) {
                const firstOrder = orders.data[0];
                console.log(' First order structure:', firstOrder);
                console.log(' Order keys:', Object.keys(firstOrder));
                
                // Test order details endpoint
                console.log(`2. Testing /orders/${firstOrder.orderID}/details...`);
                try {
                    const details = await axios.get(`${this.baseURL}/orders/${firstOrder.orderID}/details`, { headers: { ...this.getAuthHeaders() } });
                    console.log(' Order details response:', details.data);
                } catch (detailsError) {
                    console.log(' Order details failed:', detailsError.response?.status, detailsError.response?.data);
                }
                
                // Test order by ID endpoint
                console.log(`3. Testing /orders/read/${firstOrder.orderID}...`);
                try {
                    const byId = await axios.get(`${this.baseURL}/orders/read/${firstOrder.orderID}`, { headers: { ...this.getAuthHeaders() } });
                    console.log(' Order by ID response:', byId.data);
                } catch (byIdError) {
                    console.log(' Order by ID failed:', byIdError.response?.status, byIdError.response?.data);
                }
            }
            
        } catch (error) {
            console.log(' Admin endpoints test failed:', error.response?.status, error.response?.data);
        }
        
        console.log('=== End Admin Endpoints Test ===');
    }
    
    async getAllUsers() {
        try {
            const response = await axios.get(
                `${this.baseURL}/admin/users`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch users');
        }
    }

    async getAllOrders() {
        try {
            const response = await axios.get(
                `${this.baseURL}/admin/orders`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch orders');
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const response = await axios.put(
                `${this.baseURL}/admin/orders/${orderId}/status`,
                { status },
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update order status');
        }
    }

    // Alternate: use query param /api/admin/orders/{id}/status?status=PROCESSING
    async updateOrderStatusQuery(orderId, status) {
        try {
            const response = await axios.put(
                `${this.baseURL}/admin/orders/${orderId}/status`,
                null,
                { headers: { ...this.getAuthHeaders() }, params: { status } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update order status');
        }
    }

    // Alternate: use path variable /api/admin/orders/{id}/status/{status}
    async updateOrderStatusPath(orderId, status) {
        try {
            const response = await axios.put(
                `${this.baseURL}/admin/orders/${orderId}/status/${status}`,
                null,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update order status');
        }
    }



    async updatePaymentStatus(paymentId, paymentStatus) {
        try {
            // Backend expects @RequestParam PaymentStatus status, so pass as query param
            const response = await axios.put(
                `${this.baseURL}/admin/payments/${paymentId}/status`,
                null,
                { headers: { ...this.getAuthHeaders() }, params: { status: paymentStatus } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update payment status');
        }
    }

    async getOrderStatuses() {
        try {
            const response = await axios.get(
                `${this.baseURL}/admin/orders/statuses`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data; // Array of enum values
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch order statuses');
        }
    }

    async deleteUser(userId) {
        try {
            const response = await axios.delete(
                `${this.baseURL}/admin/users/${userId}`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete user');
        }
    }

    // ========== REVIEW API ==========
    
    // NEW: Create review for specific order (allows multiple reviews of same laptop across different orders)
    async createReviewForOrder(orderId, laptopId, rating, comment) {
        try {
            // Validate input data before sending
            const parsedOrderId = Number(orderId);
            const parsedLaptopId = Number(laptopId);
            const parsedRating = Number(rating);
            
            if (!parsedOrderId || parsedOrderId <= 0) {
                throw new Error('Invalid order ID. Must be a positive integer.');
            }
            
            if (!parsedLaptopId || parsedLaptopId <= 0) {
                throw new Error('Invalid laptop ID. Must be a positive integer.');
            }
            
            if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
                throw new Error('Rating must be between 1 and 5.');
            }
            
            if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
                throw new Error('Comment must be at least 5 characters long.');
            }

            // Prepare the exact format expected by backend for order-specific reviews
            const reviewData = {
                laptopId: parsedLaptopId,     // Integer - REQUIRED, must be > 0
                rating: parsedRating,         // Integer - REQUIRED, must be 1-5
                comment: comment.trim()       // String - REQUIRED, minimum 5 characters
            };

            console.log('Creating order-specific review with data:', reviewData, 'for order:', parsedOrderId);

            const response = await axios.post(
                `${this.baseURL}/reviews/order/${parsedOrderId}`,
                reviewData,
                { headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' } }
            );
            
            console.log('Order-specific review created successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Order-specific review creation failed:', error.response?.data || error.message);
            
            const status = error.response?.status;
            const data = error.response?.data;
            
            if (status === 400) {
                const validationMsg = data?.message || 'Validation error: Check order ID, laptop ID, rating (1-5), and comment (min 5 chars).';
                throw new Error(`Validation Error: ${validationMsg}`);
            }
            if (status === 401) throw new Error('Please login to write a review.');
            if (status === 403) throw new Error('You can only review laptops from your delivered orders.');
            if (status === 404) throw new Error('Order or laptop not found.');
            if (status === 409) throw new Error("You've already reviewed this laptop for this order.");
            
            throw new Error(data?.message || 'Failed to create review for this order');
        }
    }
    
    async createReview(laptopId, rating, comment) {
        try {
            // Validate input data before sending
            const parsedLaptopId = Number(laptopId);
            const parsedRating = Number(rating);
            
            if (!parsedLaptopId || parsedLaptopId <= 0) {
                throw new Error('Invalid laptop ID. Must be a positive integer.');
            }
            
            if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
                throw new Error('Rating must be between 1 and 5.');
            }
            
            if (!comment || typeof comment !== 'string' || comment.trim().length < 5) {
                throw new Error('Comment must be at least 5 characters long.');
            }

            // Prepare the exact format expected by backend
            const reviewData = {
                laptopId: parsedLaptopId,     // Integer - REQUIRED, must be > 0
                rating: parsedRating,         // Integer - REQUIRED, must be 1-5
                comment: comment.trim()       // String - REQUIRED, minimum 5 characters
            };

            console.log('Creating review with data:', reviewData);

            const response = await axios.post(
                `${this.baseURL}/reviews`,
                reviewData,
                { headers: { ...this.getAuthHeaders(), 'Content-Type': 'application/json' } }
            );
            
            console.log('Review created successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Review creation failed:', error.response?.data || error.message);
            
            const status = error.response?.status;
            const data = error.response?.data;
            
            if (status === 400) {
                const validationMsg = data?.message || 'Validation error: Check laptop ID, rating (1-5), and comment (min 5 chars).';
                throw new Error(`Validation Error: ${validationMsg}`);
            }
            if (status === 401) throw new Error('Please login to write a review.');
            if (status === 403) throw new Error('You can only review laptops after delivery.');
            if (status === 404) throw new Error('Laptop not found.');
            if (status === 409) throw new Error("You've already reviewed this product.");
            
            throw new Error(data?.message || 'Failed to create review');
        }
    }

    async getLaptopReviews(laptopId) {
        try {
            // Preferred endpoint if available
            const response = await axios.get(`${this.baseURL}/reviews/laptop/${laptopId}`);
            return response.data;
        } catch (error) {
            // Fallback: fetch all and filter client-side if specific endpoint not available
            try {
                const all = await axios.get(`${this.baseURL}/reviews`);
                const list = Array.isArray(all.data) ? all.data : [];
                return list.filter(r => r?.laptop?.laptopID === Number(laptopId));
            } catch (e2) {
                throw new Error(error.response?.data?.message || 'Failed to fetch reviews');
            }
        }
    }

    async updateReview({ reviewID, rating, comment }) {
        try {
            const body = { reviewID };
            if (typeof rating !== 'undefined') body.rating = Number(rating);
            if (typeof comment !== 'undefined') body.comment = comment;
            const response = await axios.put(
                `${this.baseURL}/reviews`,
                body,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            if (status === 401) throw new Error('Please login to edit your review.');
            if (status === 403) throw new Error('You can only edit your own review.');
            if (status === 404) throw new Error('Review not found.');
            if (status === 400) throw new Error(error.response?.data?.message || 'Validation error: rating 1-5 and comment min 10 characters.');
            throw new Error('Failed to update review');
        }
    }

    async deleteReview(reviewId) {
        try {
            const response = await axios.delete(
                `${this.baseURL}/reviews/${reviewId}`,
                { headers: { ...this.getAuthHeaders() } }
            );
            return response.data;
        } catch (error) {
            const status = error.response?.status;
            if (status === 401) throw new Error('Please login to delete your review.');
            if (status === 403) throw new Error('You can only delete your own review.');
            if (status === 404) throw new Error('Review not found.');
            throw new Error('Failed to delete review');
        }
    }

    async getUserReviews(userId) {
        // Try a resilient sequence of endpoints based on what's available in backend
        const headers = { headers: { ...this.getAuthHeaders() } };
        // 1) Try /reviews/my (principal-based)
        try {
            const r1 = await axios.get(`${this.baseURL}/reviews/my`, headers);
            return r1.data;
        } catch (e1) {
            // 2) Try /reviews/my-reviews (legacy naming)
            try {
                const r2 = await axios.get(`${this.baseURL}/reviews/my-reviews`, headers);
                return r2.data;
            } catch (e2) {
                // 3) Try /reviews/user/{userId}
                try {
                    if (!userId) {
                        const userInfoStr = localStorage.getItem('userInfo');
                        if (userInfoStr) {
                            const userInfo = JSON.parse(userInfoStr);
                            userId = userInfo?.id || userInfo?.userId || userInfo?.userID;
                        }
                    }
                    if (!userId) throw e2;
                    const r3 = await axios.get(`${this.baseURL}/reviews/user/${userId}`, headers);
                    return r3.data;
                } catch (e3) {
                    // Return empty to avoid blocking other data
                    return [];
                }
            }
        }
    }

    // NEW: Check if user can review a laptop for a specific order
    async canUserReviewForOrder(orderId, laptopId) {
        try {
            // Validate input
            const parsedOrderId = Number(orderId);
            const parsedLaptopId = Number(laptopId);
            
            if (!parsedOrderId || parsedOrderId <= 0) {
                console.warn('Invalid order ID for review eligibility check:', orderId);
                return { canReview: false, reason: 'Invalid order ID' };
            }
            
            if (!parsedLaptopId || parsedLaptopId <= 0) {
                console.warn('Invalid laptop ID for review eligibility check:', laptopId);
                return { canReview: false, reason: 'Invalid laptop ID' };
            }

            // Backend gets user from JWT token, checks specific order and laptop
            const response = await axios.get(
                `${this.baseURL}/reviews/can-review/order/${parsedOrderId}/laptop/${parsedLaptopId}`,
                { headers: { ...this.getAuthHeaders() } }
            );
            
            // Backend returns CanReviewResponse { canReview: boolean, reason: string }
            return response.data;
        } catch (error) {
            console.warn('Order-specific review eligibility check failed:', error.response?.data || error.message);
            return { canReview: false, reason: 'Unable to check review eligibility for this order' };
        }
    }

    async canUserReview(laptopId) {
        try {
            // Validate laptop ID
            const parsedLaptopId = Number(laptopId);
            if (!parsedLaptopId || parsedLaptopId <= 0) {
                console.warn('Invalid laptop ID for review eligibility check:', laptopId);
                return { canReview: false, reason: 'Invalid laptop ID' };
            }

            // Backend gets user from JWT token, so we only need to pass laptopId
            const response = await axios.get(
                `${this.baseURL}/reviews/can-review/${parsedLaptopId}`,
                { headers: { ...this.getAuthHeaders() } }
            );
            
            // Backend returns CanReviewResponse { canReview: boolean, reason: string }
            return response.data;
        } catch (error) {
            console.warn('Review eligibility check failed:', error.response?.data || error.message);
            return { canReview: false, reason: 'Unable to check review eligibility' };
        }
    }
}
const apiServiceInstance = new ApiService();
export default apiServiceInstance;