"use client";

import React from 'react';
// Assuming dataService provides canonical ordering helpers if needed for sorting targets
// import { getBookSortIndex } from '@/utils/dataService'; // Or from canonicalOrder.js

/**
 * Component to display a list of outgoing cross-references
 * for a selected node (chapter or verse) based on the currently filtered connection data.
 */
function ReferenceListPanel({
    selectedNodeId,       // The ID of the node selected in the diagram (e.g., "Gen1", "Gen1v1")
    connectionData,       // The *currently displayed* filtered connection data { nodes:[], links:[] }
    isLoadingConnections  // Boolean indicating if connectionData is currently being filtered/loaded
 }) {

    let references = [];
    let displayTitle = "Connections List";
    let message = null;

    if (isLoadingConnections) {
        displayTitle = "Loading Connections...";
        message = "Filtering connections based on selection...";
    } else if (!selectedNodeId) {
        displayTitle = "Connections List";
        message = "Select a node (chapter/verse) on the diagram to see its outgoing connections in this view.";
    } else if (connectionData && connectionData.links) {
        displayTitle = `Connections from ${selectedNodeId}`;
        // Filter the *currently displayed links* to find those originating from the selected node
        references = connectionData.links
            .filter(link => link.source === selectedNodeId) // Find outgoing links
            .sort((a, b) => {
                // Attempt canonical sort for targets (basic implementation)
                // TODO: Replace with a robust parser and use getBookSortIndex from canonicalOrder.js
                const parseId = (id) => {
                     const match = id.match(/^([1-3]?\s?[A-Za-z\s]+?)(\d+)(?:[v:](\d+))?$/);
                     if (!match) return { book: 'zzz', bookSort: 999, chap: 0, verse: 0 }; // Sort unknown last
                     // Placeholder for actual canonical index lookup
                     const bookSort = 999; // Replace with getBookSortIndex(normalizeBookNameForId(match[1].trim()));
                     return {
                        book: match[1].trim(),
                        bookSort: bookSort,
                        chap: parseInt(match[2], 10),
                        verse: match[3] ? parseInt(match[3], 10) : 0 // Treat chapter-only refs as verse 0 for sorting
                     };
                };
                const parsedA = parseId(a.target);
                const parsedB = parseId(b.target);

                // Sort primarily by canonical book order (using placeholder index)
                if(parsedA.bookSort !== parsedB.bookSort) return parsedA.bookSort - parsedB.bookSort;
                // Then by chapter number
                if(parsedA.chap !== parsedB.chap) return parsedA.chap - parsedB.chap;
                // Finally by verse number
                return parsedA.verse - parsedB.verse;
            }) // Sort targets canonically
            .map(link => ({ target: link.target, value: link.value })); // Extract target and value

        if (references.length === 0) {
            message = "No outgoing connections found for this node in the current filtered view.";
        }
    } else if (selectedNodeId) {
        // We have a selection, but no connection data (e.g., after initial load before filtering completes)
        displayTitle = `Connections from ${selectedNodeId}`;
        message = "Connection data not available or filtering...";
    }


    return (
        // Added 'reference-list' class for optional CSS, plus layout classes
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-gray-100 dark:bg-gray-800 shadow-inner reference-list">
             {/* Sticky Header */}
            <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-gray-100 dark:bg-gray-800 z-10 flex-shrink-0">
                {displayTitle} {references.length > 0 ? `(${references.length})` : ''}
            </h2>
             {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-grow custom-scrollbar"> {/* Add custom-scrollbar class if needed */}
                {message ? (
                     <p className="text-sm text-gray-500 dark:text-gray-400 p-1 italic">{message}</p>
                ) : (
                    <ul className="list-none p-0 m-0 divide-y divide-gray-200 dark:divide-gray-700">
                        {references.map((ref, index) => (
                            <li key={`${ref.target}-${index}-${ref.value}`} className="text-sm py-1.5 px-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-100">
                                {/* Consider making this a link or interactive later */}
                                <span className="font-mono text-gray-800 dark:text-gray-200">→ {ref.target}</span>
                                {/* Display value (votes) */}
                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({ref.value})</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ReferenceListPanel;