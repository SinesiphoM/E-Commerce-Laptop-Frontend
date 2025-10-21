import React from 'react';

export default function CartModal({ visible, cart, onClose, onInc, onDec, onRemove, onCheckout }) {
  if (!visible) return null;
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl px-8 py-6 text-center max-w-2xl w-full relative transform transition-all duration-200 scale-100 animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors duration-200 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center" 
          onClick={onClose}
          aria-label="Close cart"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-6 text-orange-700">Your Cart</h2>
        {cart.length === 0 ? (
          <div className="text-lg text-gray-600">Your cart is empty.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {cart.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-orange-50 rounded-lg p-4 shadow">
                {item.image ? (
                  <img src={`data:image/jpeg;base64,${Array.isArray(item.image) ? btoa(String.fromCharCode(...item.image)) : item.image}`} alt="Laptop" className="w-16 h-16 object-cover rounded border-2 border-orange-300" />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded border-2 border-orange-100 text-gray-400">No Image</div>
                )}
                <div className="flex-1 text-left">
                  <div className="font-bold text-orange-700">{item.brand} {item.model}</div>
                  <div className="text-gray-900">R{Number(item.price).toLocaleString('en-ZA', {minimumFractionDigits:2})}</div>
                  <div className="text-gray-700 text-sm">{item.specifications}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <button className="px-2 py-1 bg-orange-200 rounded text-orange-700 font-bold" onClick={() => onDec(idx)}>-</button>
                    <input type="number" min="1" value={item.quantity || 1} onChange={e => onInc(idx, Number(e.target.value), true)} className="w-12 text-center border rounded" />
                    <button className="px-2 py-1 bg-orange-200 rounded text-orange-700 font-bold" onClick={() => onInc(idx)}>+</button>
                    <button className="ml-4 px-2 py-1 bg-red-200 rounded text-red-700 font-bold" onClick={() => onRemove(idx)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {cart.length > 0 && (
          <div className="mt-8">
            <button className="bg-orange-500 text-white font-bold px-8 py-3 rounded-xl shadow hover:bg-orange-600 transition text-xl" onClick={onCheckout}>Proceed to Payment</button>
          </div>
        )}
      </div>
    </div>
  );
}
