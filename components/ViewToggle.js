"use client";

import React from 'react';

function ViewToggle({ currentView, onToggle }) {
  const buttonText = currentView === 'chapter' ? 'Switch to Verse View' : 'Switch to Chapter View';

  return (
    <button
      onClick={onToggle}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
      aria-label={`Switch to ${currentView === 'chapter' ? 'verse' : 'chapter'} view`}
    >
      {buttonText}
    </button>
  );
}

export default ViewToggle;