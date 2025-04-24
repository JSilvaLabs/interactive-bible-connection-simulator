// components/ViewToggle.js (MRP v1.3 - Explicit Border States)
"use client";

import React from 'react';

/**
 * Button component to toggle between 'Chapter' and 'Verse' view modes.
 * MRP version includes polished styling and accessibility.
 * Alternative structure attempts to resolve IntelliSense CSS conflict warning by defining border properties explicitly per state.
 */
function ViewToggle({
    currentView, // Should be 'chapter' or 'verse'
    onToggle,    // Callback function when button is clicked
    disabled = false // Boolean to disable the button
}) {
  const nextView = currentView === 'chapter' ? 'Verse' : 'Chapter';
  const buttonText = `Switch to ${nextView} View`;
  const ariaLabel = `Current view is ${currentView}. ${buttonText}.`;

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        px-4 py-2 rounded text-sm sm:text-base font-medium transition-colors duration-150 ease-in-out
        /* Base 'border' and 'border-solid' removed */

        /* --- Enabled State Styles --- */
        /* Explicitly define border width, style, and color for enabled state */
        enabled:border enabled:border-solid /* Sets width=1px, style=solid */
        enabled:border-blue-600 enabled:dark:border-blue-500 /* Sets enabled color */
        enabled:bg-blue-600 enabled:dark:bg-blue-600
        enabled:text-white
        enabled:hover:bg-blue-700 enabled:dark:hover:bg-blue-700
        enabled:focus:outline-none enabled:focus:ring-2 enabled:focus:ring-offset-2 enabled:focus:ring-blue-500 enabled:dark:focus:ring-offset-gray-800

        /* --- Disabled State Styles --- */
        disabled:opacity-50 disabled:cursor-not-allowed
        /* Explicitly define border width, style, and color for disabled state */
        disabled:border disabled:border-solid /* Sets width=1px, style=solid */
        disabled:border-gray-400 disabled:dark:border-gray-500 /* Sets disabled color */
        disabled:bg-gray-300 disabled:dark:bg-gray-600
        disabled:text-gray-500 disabled:dark:text-gray-400
      `}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      title={buttonText}
    >
      {buttonText}
    </button>
  );
}

export default ViewToggle;