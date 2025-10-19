import React from 'react';
export default function Background() {
  return (
    <div
      className="absolute inset-0 -z-10"
      style={{
        backgroundImage:
          'url(https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.25,
      }}
    />
  );
}