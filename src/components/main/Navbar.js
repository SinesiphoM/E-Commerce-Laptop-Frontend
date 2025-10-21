import React from 'react';

export default function Navbar({
  user,
  onHome,
  onShop,
  onOpenProfile,
  onLogout,
  cartCount,
  onOpenCart,
  onAbout,
  onContact
}) {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-6 bg-white border-b border-gray-200 fixed top-0 left-0 z-50">
      <div className="flex space-x-8">
        <button className="font-semibold hover:text-orange-500" onClick={onHome}>Home</button>
        <button className="font-semibold hover:text-orange-500" onClick={onShop}>Shop Laptops</button>
        {user && user.role === 'CUSTOMER' && (
          <button 
            className="font-semibold hover:text-orange-500" 
            onClick={() => window.location.href = '/dashboard'}
          >
            My Orders
          </button>
        )}
        <button className="font-semibold hover:text-orange-500" onClick={onAbout}>About Us</button>
        <button className="font-semibold hover:text-orange-500" onClick={onContact}>Contact Us</button>
      </div>
      <div className="flex items-center space-x-4">
        <button
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 focus:outline-none"
          onClick={onOpenProfile}
          aria-label="User Profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z" />
          </svg>
        </button>
        {user ? (
          <>
            <span className="font-semibold">
              {user.firstName ? `Hi, ${user.firstName}` : 'Account'}
            </span>
            <button
              className="px-4 py-2 font-semibold text-gray-700 border border-gray-300 rounded hover:bg-orange-100 transition"
              onClick={onLogout}
            >Logout</button>
          </>
        ) : (
          <>
            <button
              className="px-4 py-2 font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
              onClick={() => onOpenProfile('login')}
            >
               Login
            </button>
            <button
              className="px-4 py-2 font-semibold text-white bg-orange-500 border border-orange-500 rounded-lg hover:bg-orange-600 hover:border-orange-600 transition-all duration-200 shadow-sm hover:shadow-lg transform hover:scale-105"
              onClick={() => onOpenProfile('register')}
            >
               Sign Up
            </button>
          </>
        )}
        <button
          className="font-semibold ml-2 px-4 py-2 rounded bg-orange-100 hover:bg-orange-200 text-orange-700 transition"
          onClick={onOpenCart}
          aria-label="View Cart"
        >
          Cart ({cartCount})
        </button>
      </div>
    </nav>
  );
}
