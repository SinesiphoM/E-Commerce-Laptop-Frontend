ProfileModal.js import React from 'react';

export default function ProfileModal({ visible, profileData, setProfileData, loading, error, onClose, onUpdate, onDelete }) {
  if (!visible || !profileData) return null;
  // Ensure contact object exists to prevent runtime errors
  const contact = profileData.contact || {};
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative transform transition-all duration-200 scale-100 animate-in slide-in-from-bottom-4">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors duration-200 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
          onClick={onClose}
          aria-label="Close profile"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">User Profile</h2>
        <form className="flex flex-col space-y-4" onSubmit={onUpdate}>
          <input type="text" value={profileData.firstName} onChange={e => setProfileData({ ...profileData, firstName: e.target.value })} className="border rounded px-4 py-2" placeholder="First Name" required />
          <input type="text" value={profileData.lastName} onChange={e => setProfileData({ ...profileData, lastName: e.target.value })} className="border rounded px-4 py-2" placeholder="Last Name" required />
          <input type="email" value={contact.email || ''} onChange={e => setProfileData({ ...profileData, contact: { ...contact, email: e.target.value } })} className="border rounded px-4 py-2" placeholder="Email" required />
          <input type="text" value={contact.phoneNumber || ''} onChange={e => setProfileData({ ...profileData, contact: { ...contact, phoneNumber: e.target.value } })} className="border rounded px-4 py-2" placeholder="Phone Number" required />
          <button type="submit" className="bg-orange-500 text-white font-semibold py-2 rounded hover:bg-orange-600 transition" disabled={loading}>Update</button>
          <button type="button" className="bg-red-500 text-white font-semibold py-2 rounded hover:bg-red-600 transition" disabled={loading} onClick={onDelete}>Delete Account</button>
          {error && <div className="text-red-600 text-sm mt-2 text-center">{error}</div>}
        </form>
      </div>
    </div>
  );
}
