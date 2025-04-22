"use client";

import React from 'react';

function ViewToggle({ currentView, onToggle, disabled = false }) { // Added disabled prop
  const buttonText = currentView === 'chapter' ? 'Switch to Verse View' : 'Switch to Chapter View';

  return (
    <button
      onClick={onToggle}
      disabled={disabled} // Use the disabled prop
      className={`
        px-4 py-2 bg-blue-600 text-white rounded
        hover:bg-blue-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
        transition duration-150 ease-in-out
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} // Add disabled styles
      `}
      aria-label={`Switch to ${currentView === 'chapter' ? 'verse' : 'chapter'} view`}
      aria-disabled={disabled} // Add aria-disabled attribute
    >
      {buttonText}
    </button>
  );
}

export default ViewToggle;