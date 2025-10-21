import React from 'react';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-700">About Us</h1>
          <a href="/" className="text-orange-600 hover:text-orange-700 font-semibold">Back to Store</a>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Who we are</h2>
          <p className="text-gray-700 leading-relaxed">
            Laptop Store is your trusted retailer for new and refurbished laptops. We focus on quality,
            fair pricing, and a great shopping experience. Whether you study, work, or create â€” weâ€™ll help you
            find the right device.
          </p>
        </section>
        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Quality First</h3>
            <p className="text-gray-700">Each device is inspected and verified to ensure reliable performance.</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Secure Checkout</h3>
            <p className="text-gray-700">Encrypted payments and safe order handling for peace of mind.</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Fast Delivery</h3>
            <p className="text-gray-700">Swift dispatch and tracking so you get your laptop quickly.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
