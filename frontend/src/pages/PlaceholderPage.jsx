import React from 'react';
import { useLocation } from 'react-router-dom';

const PlaceholderPage = () => {
  const location = useLocation();
  const pageName = location.pathname.replace('/', '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Home';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center pt-20 px-4 text-center">
      <div className="bg-white p-10 rounded-3xl shadow-lg border border-gray-100 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-brand-navy mb-4">{pageName} Page</h1>
        <p className="text-gray-500 mb-8">This page is currently under construction. Please check back later for updates.</p>
        <div className="w-16 h-1 bg-brand-emerald mx-auto rounded-full"></div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
