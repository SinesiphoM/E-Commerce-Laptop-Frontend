import React, { useEffect, useState } from 'react';
import { authFetch } from '../../utils/authFetch';

export default function AdminPanel() {
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerType, setRegisterType] = useState(""); // success or error
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [laptops, setLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    brand: '',
    model: '',
    price: '',
    specifications: '',
    laptopCondition: '',
    image: null,
  });

  // Fetch laptops 
  useEffect(() => {
    fetchLaptops();
  }, []);

  async function fetchLaptops() {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/laptops/all');
      if (res.ok) {
        setLaptops(await res.json());
      } else {
        setError('Failed to fetch laptops');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  //create laptop with image
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const body = new FormData();
      body.append('brand', form.brand);
      body.append('model', form.model);
      body.append('price', form.price);
      body.append('specifications', form.specifications);
      body.append('laptopCondition', form.laptopCondition);
      if (form.image) body.append('image', form.image);

      const res = await authFetch('/laptops/create-with-image', {
        method: 'POST',
        body,
      });

      if (res.ok) {
        fetchLaptops();
        setForm({ brand: '', model: '', price: '', specifications: '', laptopCondition: '', image: null });
      } else {
        setError('Save failed');
      }
    } catch {
      setError('Network error');
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      const res = await authFetch(`/laptops/delete/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLaptops();
      } else {
        setError('Delete failed');
      }
    } catch {
      setError('Network error');
    }
  }

  return (
    <div
      className="max-w-5xl mx-auto p-6 md:p-12 min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-60 pointer-events-none" style={{ zIndex: 0 }}></div>
      <div className="relative z-10">
        {/* Admin Info and Logout */}
        <div className="w-full flex justify-end items-center mb-8">
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-orange-700 bg-orange-100 px-4 py-2 rounded-xl shadow">
              {admin ? `Admin: ${admin.firstName} ${admin.lastName}` : 'Admin'}
            </span>
            <button
              className="bg-orange-500 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-orange-600 transition"
              onClick={() => {
                localStorage.removeItem('user');
                setAdmin(null);
                window.location.href = '/';
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Sidebar + Main */}
        <div className="flex">
          <aside className="w-64 min-h-[500px] bg-orange-50 rounded-xl shadow-lg p-6 flex flex-col gap-6 mr-8">
            <button
              className="bg-orange-500 text-white font-bold px-6 py-3 rounded-lg shadow hover:bg-orange-600 transition"
              onClick={() => setShowRegisterModal(true)}
            >
              Add Admin
            </button>
            <button
              className="bg-orange-500 text-white font-bold px-6 py-3 rounded-lg shadow hover:bg-orange-600 transition"
              onClick={() => window.location.reload()}
            >
              Manage Laptops
            </button>
          </aside>

          <div className="flex-1">
            {/* Registration Modal */}
            {showRegisterModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8 relative">
                  <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
                    type="button"
                    onClick={() => {
                      setShowRegisterModal(false);
                      setRegisterMessage("");
                    }}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <form
                    className="flex flex-col space-y-4"
                    onSubmit={async e => {
                      e.preventDefault();
                      setRegisterMessage("");
                      setRegisterType("");
                      try {
                        const res = await authFetch('/users', {
                          method: 'POST',
                          body: JSON.stringify({
                            firstName: e.target.firstName.value,
                            lastName: e.target.lastName.value,
                            password: e.target.password.value,
                            email: e.target.email.value,
                            phoneNumber: e.target.phoneNumber.value,
                            role: 'ADMIN',
                          }),
                          headers: { 'Content-Type': 'application/json' },
                        });
                        if (res.ok) {
                          setRegisterMessage("Admin added successfully!");
                          setRegisterType("success");
                          setTimeout(() => {
                            setShowRegisterModal(false);
                            setRegisterMessage("");
                          }, 1500);
                        } else {
                          setRegisterMessage("Registration failed. Please check details.");
                          setRegisterType("error");
                        }
                      } catch {
                        setRegisterMessage("Registration failed. Please try again.");
                        setRegisterType("error");
                      }
                    }}
                  >
                    <h2 className="text-2xl font-bold mb-4 text-center">Register Admin</h2>
                    <input name="firstName" type="text" placeholder="First Name" className="border rounded px-4 py-2" required />
                    <input name="lastName" type="text" placeholder="Last Name" className="border rounded px-4 py-2" required />
                    <input name="email" type="email" placeholder="Email" className="border rounded px-4 py-2" required />
                    <input name="password" type="password" placeholder="Password" className="border rounded px-4 py-2" required />
                    <input name="phoneNumber" type="text" placeholder="Phone Number" className="border rounded px-4 py-2" required />
                    <button type="submit" className="bg-orange-500 text-white font-semibold py-2 rounded hover:bg-orange-600 transition">
                      Register
                    </button>
                    {registerMessage && (
                      <div
                        className={`mt-4 text-center font-semibold ${
                          registerType === "success" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {registerMessage}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* Form to Add Laptop */}
            <h2 className="text-4xl font-extrabold mb-8 text-center text-blue-100 drop-shadow">Admin Panel - Manage Laptops</h2>
            <div className="bg-white rounded-xl shadow-lg p-8 mb-10">
              <h3 className="text-2xl font-bold mb-6 text-orange-300">Add Laptop</h3>

              <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Brand</label>
                  <input
                    type="text"
                    placeholder="Brand"
                    className="border rounded px-4 py-2 w-full"
                    required
                    value={form.brand}
                    onChange={e => setForm({ ...form, brand: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Model</label>
                  <input
                    type="text"
                    placeholder="Model"
                    className="border rounded px-4 py-2 w-full"
                    required
                    value={form.model}
                    onChange={e => setForm({ ...form, model: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Price (R)</label>
                  <input
                    type="number"
                    placeholder="Price in Rands"
                    className="border rounded px-4 py-2 w-full"
                    required
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Specifications</label>
                  <input
                    type="text"
                    placeholder="Specifications"
                    className="border rounded px-4 py-2 w-full"
                    value={form.specifications}
                    onChange={e => setForm({ ...form, specifications: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Condition</label>
                  <input
                    type="text"
                    placeholder="Laptop Condition"
                    className="border rounded px-4 py-2 w-full"
                    value={form.laptopCondition}
                    onChange={e => setForm({ ...form, laptopCondition: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-gray-700">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="border rounded px-4 py-2 w-full"
                    onChange={e => setForm({ ...form, image: e.target.files[0] })}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end items-center mt-4">
                  <button
                    type="submit"
                    className="bg-orange-500 text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-orange-600 transition"
                  >
                    Add Laptop
                  </button>
                </div>
              </form>
              {error && <div className="text-red-600 text-sm mt-4 text-center">{error}</div>}
            </div>

            {/* Laptop Inventory */}
            <h3 className="text-2xl font-bold mb-6 text-blue-100">Laptop Inventory</h3>
            {loading ? (
              <div className="text-lg text-gray-600">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full bg-white bg-opacity-80 rounded-xl shadow-lg">
                  <thead>
                    <tr className="bg-orange-600 bg-opacity-80 text-white">
                      <th className="p-3 text-left">Image</th>
                      <th className="p-3 text-left">Brand</th>
                      <th className="p-3 text-left">Model</th>
                      <th className="p-3 text-left">Price (R)</th>
                      <th className="p-3 text-left">Specifications</th>
                      <th className="p-3 text-left">Condition</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laptops.map(laptop => (
                      <tr key={laptop.laptopID || laptop.id} className="border-b border-gray-200 hover:bg-orange-50">
                        <td className="p-3">
                          {laptop.image ? (
                            <img
                              src={`data:image/jpeg;base64,${
                                Array.isArray(laptop.image) ? btoa(String.fromCharCode(...laptop.image)) : laptop.image
                              }`}
                              alt="Laptop"
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          ) : (
                            <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-lg border text-gray-400">
                              No Image
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-bold text-orange-700">{laptop.brand}</td>
                        <td className="p-3 font-bold text-orange-700">{laptop.model}</td>
                        <td className="p-3 text-gray-800 font-semibold">R{laptop.price}</td>
                        <td className="p-3 text-gray-700">{laptop.specifications}</td>
                        <td className="p-3 text-gray-700">{laptop.laptopCondition}</td>
                        <td className="p-3">
                          <button
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-semibold shadow"
                            onClick={() => handleDelete(laptop.laptopID || laptop.id)}
                          >

                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
