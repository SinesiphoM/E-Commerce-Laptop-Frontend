// UserDashboard.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/apiService';
import AuthService from '../services/authService';
import ProtectedRoute from './ProtectedRoute';

const UserDashboard = () => {
    const [activeTab, setActiveTab] = useState('orders');
    const [orders, setOrders] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Review form state
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [reviewForm, setReviewForm] = useState({
        orderId: '',
        laptopId: '',
        rating: 5,
        comment: ''
    });

    // Track which laptops can be reviewed to avoid repeated API calls
    const [reviewEligibility, setReviewEligibility] = useState({});

    // Function to check and cache review eligibility for multiple laptops
    // MOVED INSIDE loadUserData to avoid dependency issues
    const loadUserData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Fetch basic orders and reviews
            const [ordersData, reviewsData] = await Promise.all([
                ApiService.getMyOrders(),
                ApiService.getUserReviews()
            ]);
            
            // Fetch detailed information for each order to get laptop details
            const ordersWithDetails = await Promise.all(
                ordersData.map(async (order) => {
                    try {
                        const details = await ApiService.getOrderDetails(order.orderID);
                        return { ...order, ...details };
                    } catch (e) {
                        console.warn(`Failed to fetch details for order ${order.orderID}:`, e);
                        return order; // Return basic order if details fail
                    }
                })
            );
            
            setOrders(ordersWithDetails);
            setReviews(reviewsData);
            
          // Populate review eligibility inline
            const eligibilityResults = {};
            await Promise.all(
                ordersWithDetails.flatMap(order => 
                    order.status === 'DELIVERED' && order.laptops 
                        ? order.laptops.map(async (laptop) => {
                            const key = `${order.orderID}-${laptop.laptopID}`;
                            try {
                                const response = await ApiService.canUserReviewForOrder(order.orderID, laptop.laptopID);
                                eligibilityResults[key] = response.canReview ? 'eligible' : 'already_reviewed';
                            } catch (error) {
                                console.warn(`Failed to check review eligibility for order ${order.orderID}, laptop ${laptop.laptopID}:`, error);
                                eligibilityResults[key] = 'error';
                            }
                        })
                        : []
                )
            );
            
            setReviewEligibility(prev => ({ ...prev, ...eligibilityResults }));
        } catch (error) {
            setError(ApiService.handleApiError(error));
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array - no infinite loop!

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    const cancelOrder = async (orderId) => {
        if (window.confirm('Are you sure you want to cancel this order?')) {
            try {
                // Backend does not expose a cancel endpoint; provide a helpful message
                setError('Cancel order is not available at the moment.');
            } catch (error) {
                setError(ApiService.handleApiError(error));
            }
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        try {
            // Use order-specific review creation
            await ApiService.createReviewForOrder(
                reviewForm.orderId,       // orderId - integer
                reviewForm.laptopId,      // laptopId - integer
                reviewForm.rating,        // rating - integer 1-5
                reviewForm.comment        // comment - string
            );
            setSuccessMessage('Review submitted successfully!');
            setShowReviewForm(false);
            
            // Update eligibility cache immediately with order-specific key
            const orderSpecificKey = `${reviewForm.orderId}-${reviewForm.laptopId}`;
            setReviewEligibility(prev => ({
                ...prev,
                [orderSpecificKey]: 'already_reviewed'
            }));
            
            setReviewForm({ orderId: '', laptopId: '', rating: 5, comment: '' });
            loadUserData(); // Refresh data
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setError(ApiService.handleApiError(error));
        }
    };

    const openReviewForm = async (order, laptopToReview = null) => {
        // If laptopToReview is provided, use it; otherwise use the first laptop from the order
        const laptop = laptopToReview || (order.laptops && order.laptops[0]);
        
        if (!laptop || !laptop.laptopID) {
            setError('Could not determine the laptop for this order.');
            return;
        }

        // Check if user can review this laptop for this specific order
        try {
            const orderSpecificKey = `${order.orderID}-${laptop.laptopID}`;
            
            // Check cached eligibility first
            if (reviewEligibility[orderSpecificKey] === 'already_reviewed') {
                setError('You have already reviewed this laptop for this order.');
                return;
            }
            
            const eligibilityResponse = await ApiService.canUserReviewForOrder(order.orderID, laptop.laptopID);
            
            // Cache the result with order-specific key
            setReviewEligibility(prev => ({ 
                ...prev, 
                [orderSpecificKey]: eligibilityResponse.canReview ? 'eligible' : 'already_reviewed' 
            }));
            
            if (!eligibilityResponse.canReview) {
                // Use the specific reason provided by the backend
                setError(eligibilityResponse.reason || 'You cannot review this laptop for this order at this time.');
                return;
            }
        } catch (error) {
            setError('Unable to check review eligibility. Please try again.');
            return;
        }

        setSelectedOrder(order);
        setReviewForm({ 
            orderId: order.orderID,
            laptopId: laptop.laptopID, 
            rating: 5, 
            comment: '' 
        });
        setShowReviewForm(true);
    };

    // Helper function to check if user has already reviewed a laptop
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PROCESSING': return 'bg-blue-100 text-blue-800';
            case 'SHIPPED': return 'bg-purple-100 text-purple-800';
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const userInfo = AuthService.getUserInfo();

    return (
        <ProtectedRoute requiredRole="CUSTOMER">
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="px-6 py-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-600">Welcome, {userInfo?.firstName}</span>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                                >
                                    Back to Store
                                </button>
                                <button
                                    onClick={() => {
                                        AuthService.logout();
                                        window.location.href = '/';
                                    }}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <nav className="bg-white border-b">
                    <div className="px-6">
                        <div className="flex space-x-8">
                            {['orders', 'reviews'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition ${
                                        activeTab === tab
                                            ? 'border-orange-500 text-orange-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tab === 'orders' ? 'My Orders' : 'My Reviews'}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>

                {/* Content */}
                <main className="px-6 py-8">
                    {/* Success/Error Messages */}
                    {successMessage && (
                        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-xl text-gray-600">Loading...</div>
                        </div>
                    ) : (
                        <>
                            {/* Orders Tab */}
                            {activeTab === 'orders' && (
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold text-gray-900">My Orders</h2>
                                    </div>
                                    {orders.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-gray-500 text-lg">No orders found</div>
                                            <button
                                                onClick={() => window.location.href = '/'}
                                                className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
                                            >
                                                Start Shopping
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Order
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Laptop
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Amount
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Payment Method
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {orders.map(order => (
                                                        <tr key={order.orderID}>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    #{order.orderID}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {new Date(order.orderDate).toLocaleDateString()}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">
                                                            {order.laptops?.[0]?.brand} {order.laptops?.[0]?.model}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                            Quantity: {order.quantity}
                                                            </div>
                                                            </td>

                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                R{order.totalAmount?.toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                                                                    {order.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {order.payment?.method || order.payment?.paymentMethod || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                                {order.status === 'PENDING' && (
                                                                    <button
                                                                        onClick={() => cancelOrder(order.orderID)}
                                                                        className="text-red-600 hover:text-red-900"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                )}
                                                                {order.status === 'DELIVERED' && (
                                                                    <>
                                                                        {(() => {
                                                                            const laptop = order.laptops?.[0];
                                                                            const laptopId = laptop?.laptopID;
                                                                            const orderSpecificKey = `${order.orderID}-${laptopId}`;
                                                                            const eligibility = reviewEligibility[orderSpecificKey];
                                                                            
                                                                            if (eligibility === 'already_reviewed') {
                                                                                return (
                                                                                    <span className="text-green-600 text-sm">
                                                                                        ✓ Reviewed
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            
                                                                            if (eligibility === 'not_delivered') {
                                                                                return (
                                                                                    <span className="text-gray-500 text-sm">
                                                                                        Not delivered
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            
                                                                            if (eligibility === 'eligible' || eligibility === undefined) {
                                                                                return (
                                                                                    <button
                                                                                        onClick={() => openReviewForm(order, laptop)}
                                                                                        className="text-orange-600 hover:text-orange-900"
                                                                                    >
                                                                                        Write Review
                                                                                    </button>
                                                                                );
                                                                            }
                                                                            
                                                                            // Fallback for any other state
                                                                            return (
                                                                                <span className="text-gray-500 text-sm">
                                                                                    Checking...
                                                                                </span>
                                                                            );
                                                                        })()}
                                                                    </>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Reviews Tab */}
                            {activeTab === 'reviews' && (
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold text-gray-900">My Reviews</h2>
                                    </div>
                                    {(Array.isArray(reviews) ? reviews.length : 0) === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-gray-500 text-lg">No reviews yet</div>
                                            <p className="text-gray-400 mt-2">Purchase and receive a laptop to leave a review</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto p-6">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laptop</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {(Array.isArray(reviews) ? reviews : []).map(review => (
                                                        <tr key={review.reviewID}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {(() => {
                                                                    if (review.user?.firstName && review.user?.lastName) {
                                                                        return `${review.user.firstName} ${review.user.lastName}`;
                                                                    }
                                                                    const fallback = review.user?.username || review.user?.email || review.user?.userID || review.user?.id || review.userId || review.user_id || review.user_id_fk || review.user;
                                                                    if (fallback) return fallback;
                                                                    if (userInfo?.firstName && userInfo?.lastName) {
                                                                        return `${userInfo.firstName} ${userInfo.lastName}`;
                                                                    }
                                                                    return userInfo?.email || userInfo?.username || 'User';
                                                                })()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <div className="flex items-center">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <svg
                                                                            key={i}
                                                                            className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                            fill="currentColor"
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            {/* Date column removed */}
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                {review.comment}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                {review.laptop?.brand} {review.laptop?.model}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Review Form Modal */}
                {showReviewForm && selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 relative">
                            <button
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
                                onClick={() => setShowReviewForm(false)}
                                aria-label="Close"
                            >
                                &times;
                            </button>
                            <h2 className="text-2xl font-bold mb-4 text-center text-orange-700">Write a Review</h2>
                            <div className="mb-4 text-center">
                                <p className="text-gray-600">
                                    {selectedOrder.laptops?.find(l => l.laptopID === Number(reviewForm.laptopId))?.brand} {selectedOrder.laptops?.find(l => l.laptopID === Number(reviewForm.laptopId))?.model}
                                </p>
                            </div>
                            <form onSubmit={submitReview} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rating
                                    </label>
                                    <div className="flex items-center space-x-1">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() => setReviewForm({ ...reviewForm, rating })}
                                                className={`h-8 w-8 ${
                                                    rating <= reviewForm.rating
                                                        ? 'text-yellow-400'
                                                        : 'text-gray-300'
                                                } hover:text-yellow-400 transition`}
                                            >
                                                <svg fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Comment
                                    </label>
                                    <textarea
                                        value={reviewForm.comment}
                                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                                        rows="4"
                                        placeholder="Share your experience with this laptop..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-600 transition"
                                >
                                    Submit Review
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default UserDashboard;
