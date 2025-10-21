import React from 'react';

export default function PaymentModal({ visible, paymentForm, setPaymentForm, onClose, onSubmit }) {
  if (!visible) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl px-8 py-8 text-center max-w-md w-full relative transform transition-all duration-200 scale-100 animate-in slide-in-from-bottom-4">
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors duration-200 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center" 
          onClick={onClose}
          aria-label="Close payment"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-orange-700">Payment</h2>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex justify-center gap-4 mb-4">
            {['Cash on Delivery', 'EFT'].map(method => (
              <button
                type="button"
                key={method}
                className={`px-4 py-2 rounded-xl font-bold border-2 transition shadow text-orange-700 bg-orange-100 hover:bg-orange-200 border-orange-300 ${paymentForm.method === method ? 'bg-orange-500 text-white border-orange-500' : ''}`}
                onClick={() => setPaymentForm(f => ({ ...f, method }))}
              >
                {method}
              </button>
            ))}
          </div>
          {paymentForm.method === 'Cash on Delivery' && (
            <div className="text-orange-700 font-semibold text-lg py-4">You will pay cash when your order is delivered.</div>
          )}
          {paymentForm.method === 'EFT' && (
            <div className="text-orange-700 font-semibold text-lg py-4">Bank details will be sent to your email for EFT payment.</div>
          )}
          <button type="submit" className="bg-orange-500 text-white font-bold px-8 py-3 rounded-xl shadow hover:bg-orange-600 transition text-xl mt-4">
            Place Order
          </button>
        </form>
      </div>
    </div>
  );
}
