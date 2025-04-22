"use client";

import React from 'react';
// Import the helper function to parse IDs and get metadata
import { getNodeMetadata } from '@/utils/dataService';

/**
 * Displays structured metadata (Book, Chapter, Verse) for a given node ID.
 * Prioritizes the selected node ID over the hovered node ID.
 */
function MetadataPanel({ selectedNodeId, hoveredNodeId }) {
    // Determine which ID to display info for: selected takes precedence
    const displayId = selectedNodeId || hoveredNodeId; // Prioritize selection
    const metadata = displayId ? getNodeMetadata(displayId) : null;

    // Determine the title based on interaction type
    let title = "Node Information";
    if (selectedNodeId) {
        title = "Selected Node";
    } else if (hoveredNodeId) {
        title = "Hovered Node";
    }

    return (
        // Added 'reference-metadata' class for optional CSS targeting
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-gray-100 dark:bg-gray-800 shadow-inner reference-metadata">
            {/* Sticky Header */}
            <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-gray-100 dark:bg-gray-800 z-10 flex-shrink-0">
                {title}
            </h2>
             {/* Scrollable Content Area (though metadata is short) */}
             <div className="overflow-y-auto flex-grow">
                {metadata && metadata.book ? (
                    // Display structured metadata if parsing was successful
                    <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 p-1">
                        <div><strong>Book:</strong> {metadata.book}</div>
                        <div><strong>Chapter:</strong> {metadata.chapter}</div>
                        {/* Only display verse if it's not null */}
                        {metadata.verse !== null && metadata.verse !== undefined && (
                             <div><strong>Verse:</strong> {metadata.verse}</div>
                        )}
                    </div>
                ) : metadata && metadata.rawId ? (
                     // Display raw ID if parsing failed
                     <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 p-1">
                         <div><strong>ID:</strong> {metadata.rawId}</div>
                         <div className="text-xs text-red-500 italic">(Could not parse ID)</div>
                     </div>
                ): (
                     // Default message when nothing is selected or hovered
                    <p className="text-sm text-gray-500 dark:text-gray-400 p-1 italic">
                        Hover over or click a node on the diagram to see its details.
                    </p>
                )}
            </div>
        </div>
    );
}

export default MetadataPanel;