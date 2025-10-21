import React, { useState, useEffect } from 'react';
import ApiService from '../../services/apiService';
import AuthService from '../../services/authService';
import ProtectedRoute from '../ProtectedRoute';
import AdminLaptopManagement from './AdminLaptopManagement';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [laptops, setLaptops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // New laptop form state
    const [newLaptop, setNewLaptop] = useState({
        brand: '',
        model: '',
        price: '',
        description: '',
        imageUrl: '',
        stockQuantity: ''
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            const [usersData, ordersData, laptopsData] = await Promise.all([
                ApiService.getAllUsers(),
                ApiService.getAllOrders(),
                ApiService.getLaptops()
            ]);
            
            // Debug: Log the orders data structure to understand what's being returned
            console.log('Orders data from API:', ordersData);
            if (ordersData && ordersData.length > 0) {
                console.log('First order structure:', ordersData[0]);
                console.log('Does first order have user property?', !!ordersData[0].user);
                console.log('User property value:', ordersData[0].user);
            }
            
            // Fetch detailed order information to get customer and laptop details
            let ordersWithDetails = ordersData;
            if (ordersData && ordersData.length > 0) {
                console.log('Fetching detailed order information...');
                ordersWithDetails = await Promise.all(
                    ordersData.map(async (order) => {
                        try {
                            // Try multiple endpoints to get complete order info
                            let details = null;
                            
                            // First try the details endpoint
                            try {
                                details = await ApiService.getOrderDetails(order.orderID);
                                console.log(`Order ${order.orderID} details from /details:`, details);
                            } catch (detailsError) {
                                console.warn(`Failed to fetch from /details for order ${order.orderID}:`, detailsError);
                                
                                // Fallback: try the read endpoint
                                try {
                                    details = await ApiService.getOrderById(order.orderID);
                                    console.log(`Order ${order.orderID} details from /read:`, details);
                                } catch (readError) {
                                    console.warn(`Failed to fetch from /read for order ${order.orderID}:`, readError);
                                }
                            }
                            
                            if (details) {
                                return { ...order, ...details };
                            } else {
                                // If no detailed data available, try to enhance with user lookup
                                if (order.userID || order.userId) {
                                    try {
                                        const users = usersData;
                                        const user = users.find(u => u.userID === order.userID || u.userID === order.userId);
                                        if (user) {
                                            console.log(`Found user for order ${order.orderID}:`, user);
                                            return { ...order, user: user };
                                        }
                                    } catch (userError) {
                                        console.warn(`Failed to find user for order ${order.orderID}:`, userError);
                                    }
                                }
                                return order;
                            }
                        } catch (e) {
                            console.warn(`Failed to fetch details for order ${order.orderID}:`, e);
                            return order; // Return basic order if all attempts fail
                        }
                    })
                );
                console.log('Orders with enhanced details:', ordersWithDetails);
            }
            
            setUsers(usersData);
            setOrders(ordersWithDetails);
            setLaptops(laptopsData);
        } catch (error) {
            setError(ApiService.handleApiError(error));
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            // Use path variant to avoid any body parsing/security edge cases
            await ApiService.updateOrderStatusPath(orderId, newStatus);
            setSuccessMessage('Order status updated successfully!');
            loadDashboardData(); // Refresh data
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setError(ApiService.handleApiError(error));
        }
    };

    const updatePaymentStatus = async (paymentId, newStatus) => {
        if (!paymentId && paymentId !== 0) {
            setError('Cannot update payment: payment id is missing on this order.');
            return;
        }
        try {
            await ApiService.updatePaymentStatus(paymentId, newStatus);
            setSuccessMessage('Payment status updated successfully!');
            loadDashboardData(); // Refresh data
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setError(ApiService.handleApiError(error));
        }
    };

    const deleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await ApiService.deleteUser(userId);
                setSuccessMessage('User deleted successfully!');
                loadDashboardData(); // Refresh data
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (error) {
                setError(ApiService.handleApiError(error));
            }
        }
    };

    const createLaptop = async (e) => {
        e.preventDefault();
        try {
            await ApiService.createLaptop({
                ...newLaptop,
                price: parseFloat(newLaptop.price),
                stockQuantity: parseInt(newLaptop.stockQuantity)
            });
            setSuccessMessage('Laptop created successfully!');
            setNewLaptop({ brand: '', model: '', price: '', description: '', imageUrl: '', stockQuantity: '' });
            loadDashboardData(); // Refresh data
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            setError(ApiService.handleApiError(error));
        }
    };

    const deleteLaptop = async (laptopId) => {
        if (window.confirm('Are you sure you want to delete this laptop?')) {
            try {
                await ApiService.deleteLaptop(laptopId);
                setSuccessMessage('Laptop deleted successfully!');
                loadDashboardData(); // Refresh data
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (error) {
                setError(ApiService.handleApiError(error));
            }
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PROCESSING': return 'bg-blue-100 text-blue-800';
            case 'SHIPPED': return 'bg-purple-100 text-purple-800';
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            case 'REFUNDED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const userInfo = AuthService.getUserInfo();

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm border-b">
                    <div className="px-6 py-4">
                        <div className="flex justify-between items-center">
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-600">Welcome, {userInfo?.firstName}</span>
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
                    <div className="px-6 flex space-x-8 items-center">
                        {['overview', 'users', 'orders', 'laptops'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize transition ${
                                    activeTab === tab
                                        ? 'border-orange-500 text-orange-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
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
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-lg shadow">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Users</h3>
                                        <p className="text-3xl font-bold text-orange-600">{users.length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Orders</h3>
                                        <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Laptops</h3>
                                        <p className="text-3xl font-bold text-green-600">{laptops.length}</p>
                                    </div>
                                </div>
                            )}

                            {/* Users Tab */}
                            {activeTab === 'users' && (
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold text-gray-900">Users Management</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        User
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Email
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Role
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Phone
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {users.map(user => (
                                                    <tr key={user.userID}>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-10 w-10">
                                                                    <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                                                                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                                                    </div>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {user.firstName} {user.lastName}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {user.email ? user.email : 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                            }`}>
                                                                {user.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {user.phone ? user.phone : 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            {user.role !== 'ADMIN' && (
                                                                <button
                                                                    onClick={() => deleteUser(user.userID)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Orders Tab */}
                            {activeTab === 'orders' && (
                                <div className="bg-white rounded-lg shadow overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200">
                                        <h2 className="text-xl font-semibold text-gray-900">Orders Management</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Order ID
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Customer
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
                                                        Payment
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {orders.map(order => (
                                                    <tr key={order.orderID}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            #{order.orderID}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {(() => {
                                                                // Try multiple ways to get customer name
                                                                if (order.user?.firstName && order.user?.lastName) {
                                                                    return `${order.user.firstName} ${order.user.lastName}`;
                                                                }
                                                                if (order.customer?.firstName && order.customer?.lastName) {
                                                                    return `${order.customer.firstName} ${order.customer.lastName}`;
                                                                }
                                                                if (order.customerName) {
                                                                    return order.customerName;
                                                                }
                                                                if (order.user?.email) {
                                                                    return order.user.email || 'N/A';
                                                                }
                                                                if (order.customer?.email) {
                                                                    return order.customer.email || 'N/A';
                                                                }
                                                                // Show user ID if available for debugging
                                                                if (order.userID || order.userId) {
                                                                    return `User ID: ${order.userID || order.userId}`;
                                                                }
                                                                return 'Unknown Customer';
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {order.laptops && order.laptops.length > 0
                                                                ? order.laptops.map(laptop => `${laptop.brand} ${laptop.model}`).join(', ')
                                                                : order.laptop 
                                                                    ? `${order.laptop.brand} ${order.laptop.model}`
                                                                    : 'Unknown Laptop'
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {(() => {
                                                                // Try multiple ways to get total amount
                                                                const amount = order.totalAmount || order.amount || order.total || order.price;
                                                                if (amount !== null && amount !== undefined) {
                                                                    return `R${Number(amount).toLocaleString()}`;
                                                                }
                                                                // Try to calculate from laptops if available
                                                                if (order.laptops && order.laptops.length > 0) {
                                                                    const total = order.laptops.reduce((sum, laptop) => {
                                                                        const price = laptop.price || laptop.laptopPrice || 0;
                                                                        return sum + Number(price);
                                                                    }, 0);
                                                                    if (total > 0) {
                                                                        return `R${total.toLocaleString()}`;
                                                                    }
                                                                }
                                                                // Try single laptop price
                                                                if (order.laptop && order.laptop.price) {
                                                                    return `R${Number(order.laptop.price).toLocaleString()}`;
                                                                }
                                                                return 'Amount not available';
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <select
                                                                value={order.status}
                                                                onChange={(e) => updateOrderStatus(order.orderID, e.target.value)}
                                                                className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadgeColor(order.status)}`}
                                                            >
                                                                <option value="PENDING">Pending</option>
                                                                <option value="PROCESSING">Processing</option>
                                                                <option value="SHIPPED">Shipped</option>
                                                                <option value="DELIVERED">Delivered</option>
                                                                <option value="CANCELLED">Cancelled</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {(() => {
                                                                // Try multiple ways to get payment info
                                                                const payment = order.payment || order.payments?.[0];
                                                                const paymentId = payment?.paymentID || payment?.id || payment?.paymentId;
                                                                const paymentStatus = payment?.paymentStatus || payment?.status || order.paymentStatus;
                                                                const paymentMethod = payment?.paymentMethod || order.paymentMethod;
                                                                if (paymentId) {
                                                                    return (
                                                                        <select
                                                                            value={paymentStatus || 'PENDING'}
                                                                            onChange={(e) => updatePaymentStatus(paymentId, e.target.value)}
                                                                            className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadgeColor(paymentStatus)}`}
                                                                            title={`Payment ID: ${paymentId}${paymentMethod ? `, Method: ${paymentMethod}` : ''}`}
                                                                        >
                                                                            <option value="PENDING">Pending</option>
                                                                            <option value="COMPLETED">Completed</option>
                                                                            <option value="FAILED">Failed</option>
                                                                            <option value="CANCELLED">Cancelled</option>
                                                                        </select>
                                                                    );
                                                                } else if (paymentMethod || paymentStatus) {
                                                                    // Show payment info without ability to edit
                                                                    return (
                                                                        <span 
                                                                            className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadgeColor(paymentStatus)}`}
                                                                            title={`Payment Method: ${paymentMethod || 'Unknown'}${paymentStatus ? `, Status: ${paymentStatus}` : ''}`}
                                                                        >
                                                                            {paymentStatus || paymentMethod || 'Payment Info'}
                                                                        </span>
                                                                    );
                                                                } else {
                                                                    // No payment info found
                                                                    return (
                                                                        <span 
                                                                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full" 
                                                                            title={`No payment record found. Order ID: ${order.orderID}`}
                                                                        >
                                                                            No payment
                                                                        </span>
                                                                    );
                                                                }
                                                            })()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Laptops Tab */}
                            {activeTab === 'laptops' && (
                                <AdminLaptopManagement />
                            )}

                            {activeTab === 'laptops-old' && (
                                <div className="space-y-6">
                                    {/* Add New Laptop Form */}
                                    <div className="bg-white p-6 rounded-lg shadow">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Laptop</h3>
                                        <form onSubmit={createLaptop} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                placeholder="Brand"
                                                value={newLaptop.brand}
                                                onChange={(e) => setNewLaptop({...newLaptop, brand: e.target.value})}
                                                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Model"
                                                value={newLaptop.model}
                                                onChange={(e) => setNewLaptop({...newLaptop, model: e.target.value})}
                                                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                                                required
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="Price"
                                                value={newLaptop.price}
                                                onChange={(e) => setNewLaptop({...newLaptop, price: e.target.value})}
                                                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                                                required
                                            />
                                            <input
                                                type="number"
                                                placeholder="Stock Quantity"
                                                value={newLaptop.stockQuantity}
                                                onChange={(e) => setNewLaptop({...newLaptop, stockQuantity: e.target.value})}
                                                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                                                required
                                            />
                                            <input
                                                type="url"
                                                placeholder="Image URL"
                                                value={newLaptop.imageUrl}
                                                onChange={(e) => setNewLaptop({...newLaptop, imageUrl: e.target.value})}
                                                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                                            />
                                            <textarea
                                                placeholder="Description"
                                                value={newLaptop.description}
                                                onChange={(e) => setNewLaptop({...newLaptop, description: e.target.value})}
                                                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                                                rows="3"
                                                required
                                            />
                                            <div className="md:col-span-2">
                                                <button
                                                    type="submit"
                                                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
                                                >
                                                    Add Laptop
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Laptops List */}
                                    <div className="bg-white rounded-lg shadow overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-200">
                                            <h2 className="text-xl font-semibold text-gray-900">Laptops Inventory</h2>
                                        </div>
                                        <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
                                            {laptops.map(laptop => (
                                                <div key={laptop.laptopID} className="border rounded-lg p-4 hover:shadow-md transition">
                                                    {laptop.imageUrl && (
                                                        <img 
                                                            src={laptop.imageUrl} 
                                                            alt={`${laptop.brand} ${laptop.model}`}
                                                            className="w-full h-48 object-cover rounded-lg mb-4"
                                                        />
                                                    )}
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                        {laptop.brand} {laptop.model}
                                                    </h3>
                                                    <p className="text-gray-600 mb-2">{laptop.description}</p>
                                                    <div className="flex justify-between items-center mb-4">
                                                        <span className="text-xl font-bold text-orange-600">
                                                            R{laptop.price?.toLocaleString()}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            Stock: {laptop.stockQuantity}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteLaptop(laptop.laptopID)}
                                                        className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
};

export default AdminDashboard;