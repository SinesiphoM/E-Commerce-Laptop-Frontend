import React, { useState, useEffect } from 'react';
import ApiService from '../../services/apiService';

const AdminLaptopManagement = () => {
    const [laptops, setLaptops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLaptop, setSelectedLaptop] = useState(null);
    const [formData, setFormData] = useState({
        brand: '',
        model: '',
        specifications: '',
        price: '',
        laptopCondition: 'NEW'
    });
    const [imageFile, setImageFile] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    useEffect(() => {
        loadLaptops();
    }, []);

    const loadLaptops = async () => {
        try {
            setLoading(true);
            const data = await ApiService.getLaptops();
            setLaptops(data || []);
        } catch (error) {
            setError('Failed to load laptops: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const resetForm = () => {
        setFormData({
            brand: '',
            model: '',
            specifications: '',
            price: '',
            laptopCondition: 'NEW'
        });
        setImageFile(null);
        setSelectedLaptop(null);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError('');

        try {
            const laptopData = {
                ...formData,
                price: parseFloat(formData.price)
            };

            let result;
            if (imageFile) {
                result = await ApiService.createLaptopWithImage(laptopData, imageFile);
            } else {
                result = await ApiService.createLaptop(laptopData);
            }

            console.log('Created laptop:', result);
            await loadLaptops();
            setShowCreateModal(false);
            resetForm();
        } catch (error) {
            console.error('Create laptop error:', error);
            const token = localStorage.getItem('authToken');
            console.log('Token present at failure time?:', !!token);
            setError('Failed to create laptop: ' + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleEdit = (laptop) => {
        setSelectedLaptop(laptop);
        setFormData({
            brand: laptop.brand,
            model: laptop.model,
            specifications: laptop.specifications,
            price: laptop.price.toString(),
            laptopCondition: laptop.laptopCondition
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitLoading(true);
        setError('');

        try {
            const laptopData = {
                laptopID: selectedLaptop.laptopID,
                ...formData,
                price: parseFloat(formData.price)
            };

            await ApiService.updateLaptop(laptopData);
            
            // If there's a new image, upload it separately
            if (imageFile) {
                await ApiService.uploadLaptopImage(selectedLaptop.laptopID, imageFile);
            }

            await loadLaptops();
            setShowEditModal(false);
            resetForm();
        } catch (error) {
            setError('Failed to update laptop: ' + error.message);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (laptopId) => {
        if (window.confirm('Are you sure you want to delete this laptop?')) {
            try {
                await ApiService.deleteLaptop(laptopId);
                await loadLaptops();
            } catch (error) {
                setError('Failed to delete laptop: ' + error.message);
            }
        }
    };

    const formatImageSrc = (imageBytes) => {
        if (imageBytes) {
            return `data:image/jpeg;base64,${imageBytes}`;
        }
        return 'https://via.placeholder.com/150x100?text=No+Image';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Loading laptops...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Laptop Management</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                    Add New Laptop
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Laptops Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {laptops.map(laptop => (
                    <div key={laptop.laptopID} className="bg-white rounded-lg shadow-md p-4">
                        <img
                            src={formatImageSrc(laptop.image)}
                            alt={`${laptop.brand} ${laptop.model}`}
                            className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                        <h3 className="text-lg font-semibold mb-2">
                            {laptop.brand} {laptop.model}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">{laptop.specifications}</p>
                        <p className="text-green-600 font-bold text-lg mb-2">
                            R{laptop.price?.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Condition: {laptop.laptopCondition}
                        </p>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(laptop)}
                                className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 transition text-sm"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(laptop.laptopID)}
                                className="flex-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {laptops.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No laptops found</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                    >
                        Add First Laptop
                    </button>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Add New Laptop</h3>
                        <form onSubmit={handleCreate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Brand</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Specifications</label>
                                <textarea
                                    name="specifications"
                                    value={formData.specifications}
                                    onChange={handleInputChange}
                                    required
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Price (R)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Condition</label>
                                <select
                                    name="laptopCondition"
                                    value={formData.laptopCondition}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="NEW">New</option>
                                    <option value="REFURBISHED">Refurbished</option>
                                    <option value="USED">Used</option>
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                                >
                                    {submitLoading ? 'Creating...' : 'Create Laptop'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">Edit Laptop</h3>
                        <form onSubmit={handleUpdate}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Brand</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Model</label>
                                <input
                                    type="text"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Specifications</label>
                                <textarea
                                    name="specifications"
                                    value={formData.specifications}
                                    onChange={handleInputChange}
                                    required
                                    rows="3"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Price (R)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Condition</label>
                                <select
                                    name="laptopCondition"
                                    value={formData.laptopCondition}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                >
                                    <option value="NEW">New</option>
                                    <option value="REFURBISHED">Refurbished</option>
                                    <option value="USED">Used</option>
                                </select>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">New Image (optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitLoading}
                                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                                >
                                    {submitLoading ? 'Updating...' : 'Update Laptop'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLaptopManagement;