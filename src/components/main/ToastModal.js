import React from 'react';

export default function ToastModal({ visible, type, message, onClose, actions = [] }) {
  if (!visible) return null;
  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`bg-white rounded-xl shadow-2xl px-8 py-6 text-center max-w-md w-full border-2 transform transition-all duration-200 scale-100 animate-in slide-in-from-bottom-4 ${type === 'success' ? 'border-green-400' : 'border-red-400'}`}>
        <div className={`text-4xl mb-4 ${type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
          {type === 'success' ? '✓' : '⚠'}
        </div>
        <div className={`text-xl font-bold mb-2 ${type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {type === 'success' ? 'Success!' : 'Error'}
        </div>
        <div className="text-gray-700 mb-6 leading-relaxed">{message}</div>
        {actions.length > 0 ? (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className={
                  `font-semibold px-6 py-3 rounded-lg shadow transition-all duration-200 ${
                    action.variant === 'secondary'
                      ? 'bg-white border border-orange-400 text-orange-700 hover:bg-orange-50'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`
                }
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : (
          <button 
            className="bg-orange-500 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:bg-orange-600 transition-all duration-200 hover:shadow-xl transform hover:scale-105" 
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
