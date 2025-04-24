// components/AboutModal.js (NEW FILE - MRP v1.0)
"use client";

import React from 'react';

/**
 * Simple modal component to display "About" information.
 */
function AboutModal({ onClose }) {

    // Prevent clicks inside the modal content from closing it
    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        // Backdrop - fixed position, covers screen, slight blur/dim effect
        <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 flex justify-center items-center z-50 transition-opacity duration-150 ease-in-out"
            onClick={onClose} // Click on backdrop closes the modal
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-modal-title"
        >
            {/* Modal Content Container */}
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 my-8 overflow-y-auto max-h-[85vh]"
                onClick={handleContentClick} // Stop propagation
            >
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b pb-3 border-gray-200 dark:border-gray-700">
                    <h2 id="about-modal-title" className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        About Bible Connections Explorer
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl font-bold leading-none"
                        aria-label="Close About Modal"
                    >
                        × {/* Multiplication sign for X */}
                    </button>
                </div>

                {/* Modal Body */}
                <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-3 leading-relaxed">
                    <p>
                        This tool helps visualize the interconnectedness of Scripture by displaying internal cross-references found within the Bible text itself.
                    </p>
                    <h3 className="text-md font-semibold mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">Data Sources</h3>
                    <p>
                        <strong>Bible Text:</strong> Berean Standard Bible (BSB) - Copyright © 2023 Bible Hub. Used by Permission. All Rights Reserved Worldwide. See <a href="https://berean.bible/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">berean.bible</a>.
                    </p>
                    <p>
                        <strong>Cross-References:</strong> The underlying cross-references are derived from data provided by <a href="https://openscriptures.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">OpenScriptures</a>, often based on the Treasury of Scripture Knowledge (TSK) and other sources, processed for this application.
                         {/* Note: Be specific here if you know the exact reference set used for references.json */}
                    </p>
                    <h3 className="text-md font-semibold mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">How It Works</h3>
                    <p>
                        Select a book and chapter (or verse) using the dropdowns. The Arc Diagram displays connections originating from your selection. Chapters or verses are positioned along the vertical axis, sorted canonically. Arcs connect the source selection to its targets. Hover over nodes or arcs for details. Click a node to make it the new focus.
                    </p>
                     <h3 className="text-md font-semibold mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">Development</h3>
                    <p>
                        Developed by <a href="https://github.com/JSilvaLabs" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">JSilvaLabs</a> for Global Minister Education.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Version: MRP 1.0
                    </p>
                </div>

                 {/* Modal Footer */}
                <div className="mt-6 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AboutModal;