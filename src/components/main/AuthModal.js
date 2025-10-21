import React from 'react';
import LoginComponent from '../LoginComponent';
import RegisterComponent from '../RegisterComponent';

export default function AuthModal({ visible, activeTab, onClose, onSwitch, onLoginSuccess, onRegisterSuccess }) {
  if (!visible) return null;
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
          aria-label="Close modal"
        >
          ×
        </button>
        {activeTab === 'login' && (
          <LoginComponent onLoginSuccess={onLoginSuccess} onSwitchToRegister={() => onSwitch('register')} />
        )}
        {activeTab === 'register' && (
          <RegisterComponent onRegisterSuccess={onRegisterSuccess} onSwitchToLogin={() => onSwitch('login')} />
        )}
      </div>
    </div>
  );
}
