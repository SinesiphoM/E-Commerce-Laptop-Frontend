import React from 'react';

export default function WelcomeSplash({ onShop, visible }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-center items-center bg-gradient-to-br from-orange-100 to-white">
      {/* Background image */}
      <div className="absolute inset-0 -z-10" style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.25
      }} />


      <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-800 px-10 py-12 rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col items-center relative">
        <div className="text-3xl font-extrabold mb-6 text-center">Welcome to Laptop Store!</div>
        <div className="text-lg font-semibold mb-8 text-center">Discover, compare, and shop the best laptops for your needs. Enjoy secure shopping, exclusive deals, and fast delivery. Start exploring now!</div>
        <button
          className="bg-orange-500 text-white font-bold px-8 py-4 rounded-2xl shadow hover:bg-orange-600 transition text-xl"
          onClick={onShop}
        >
          Shop Now
        </button>
      </div>
    </div>
  );
}