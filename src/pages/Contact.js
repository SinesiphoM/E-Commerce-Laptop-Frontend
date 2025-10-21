import React, { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-orange-700">Contact Us</h1>
          <a href="/" className="text-orange-600 hover:text-orange-700 font-semibold">Back to Store</a>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-8">
        <section className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Send us a message</h2>
          {sent ? (
            <div className="text-green-700 bg-green-50 border border-green-200 p-4 rounded-lg">
              Thank you! We received your message and will reply soon.
            </div>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); setSent(true); }}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e)=>setForm(f=>({...f, name: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                required
              />
              <input
                type="email"
                placeholder="Your email"
                value={form.email}
                onChange={(e)=>setForm(f=>({...f, email: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                required
              />
              <textarea
                placeholder="How can we help?"
                rows="5"
                value={form.message}
                onChange={(e)=>setForm(f=>({...f, message: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-orange-500"
                required
              />
              <button
                type="submit"
                className="bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-orange-600"
              >
                Send Message
              </button>
            </form>
          )}
        </section>
        <aside className="bg-white rounded-2xl shadow p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Get in touch</h2>
          <p className="text-gray-700">Email: support@laptopstore.com</p>
          <p className="text-gray-700">Phone: +27 21 555 1234</p>
          <p className="text-gray-700">Hours: Monday Fri, 9:00 17:00</p>
        </aside>
      </main>
    </div>
  );
}
