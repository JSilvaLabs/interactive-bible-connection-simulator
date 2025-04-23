// components/ReferenceListPanel.js (MVP v8.0 Update - Title Formatting)
"use client";

import React from 'react';
// Import helpers needed for sorting target IDs AND getting metadata for title
import { parseReferenceId, normalizeBookNameForId, getNodeMetadata } from '@/utils/dataService';
import { getBookSortIndex } from '@/utils/canonicalOrder';

/**
 * Component to display a list of outgoing cross-references
 * for a selected node (chapter or verse), sorted canonically,
 * with updated title formatting.
 */
function ReferenceListPanel({
    selectedNodeId,       // The ID of the node selected in the diagram
    connectionData,       // The *currently displayed* filtered connection data { nodes:[], links:[] }
    isLoadingConnections  // Boolean indicating if connectionData is currently being filtered/loaded
 }) {

    let references = [];
    let displayTitle = "Connections List"; // Default title
    let message = null;
    let connectionCount = 0;

    if (isLoadingConnections) {
        displayTitle = "Loading Connections...";
        message = "Filtering connections based on selection...";
    } else if (!selectedNodeId) {
        // Keep default title
        message = "Select a node on the diagram to see its outgoing connections.";
    } else if (connectionData && connectionData.links) {
         // Format title based on selectedNodeId type
         const metadata = getNodeMetadata(selectedNodeId);
         if (metadata && metadata.book) {
             if (metadata.verse !== null) { // Specific Verse
                 // MVP v8.0 Format: Connections from Book #:# (#)
                 displayTitle = `Connections from ${metadata.book} ${metadata.chapter}:${metadata.verse}`;
             } else { // Chapter level ID
                 // MVP v8.0 Format: Connections from Book # (#)
                 displayTitle = `Connections from ${metadata.book} ${metadata.chapter}`;
             }
         } else {
              displayTitle = `Connections from ${selectedNodeId}`; // Fallback
         }

        // Filter and sort references
        references = connectionData.links
            .filter(link => link.source === selectedNodeId)
            .sort((a, b) => { /* ... Canonical sort logic from v6.1 ... */
                const parsedA = parseReferenceId(a.target); const parsedB = parseReferenceId(b.target);
                if (!parsedA && !parsedB) return a.target.localeCompare(b.target); if (!parsedA) return 1; if (!parsedB) return -1;
                const bookA = normalizeBookNameForId(parsedA.book); const bookB = normalizeBookNameForId(parsedB.book);
                const indexA = getBookSortIndex(bookA); const indexB = getBookSortIndex(b.book);
                if (indexA !== indexB) return indexA - indexB;
                if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter;
                const verseA = parsedA.verse === null ? 0 : parsedA.verse; const verseB = parsedB.verse === null ? 0 : parsedB.verse;
                if (verseA !== verseB) return verseA - verseB; return a.target.localeCompare(b.target);
             })
            .map(link => ({ target: link.target, value: link.value }));

         connectionCount = references.length; // Get count after filtering
         displayTitle += ` (${connectionCount})`; // Add count to title

        if (connectionCount === 0) {
            message = "No outgoing connections found for this node in the current filtered view.";
        }
    } else if (selectedNodeId) {
        // Handle case where node is selected but connection data is null (e.g., during initial filtering)
        const metadata = getNodeMetadata(selectedNodeId);
         if (metadata && metadata.book) { // Format title even if data is loading
             displayTitle = `Connections from ${metadata.verse !== null ? `${metadata.book} ${metadata.chapter}:${metadata.verse}` : `${metadata.book} ${metadata.chapter}`}`;
         } else { displayTitle = `Connections from ${selectedNodeId}`; }
         displayTitle += ` (...)`; // Indicate count is pending
        message = "Connection data not available or still loading...";
    }

    return (
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-gray-100 dark:bg-gray-800 shadow-inner reference-list">
             {/* Sticky Header */}
            <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-gray-100 dark:bg-gray-800 z-10 flex-shrink-0 truncate" title={displayTitle}>
                {displayTitle}
                {/* Count is now part of the title */}
            </h2>
             {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-grow custom-scrollbar">
                {message ? (
                     <p className="text-sm text-gray-500 dark:text-gray-400 p-1 italic">{message}</p>
                ) : (
                    <ul className="list-none p-0 m-0 divide-y divide-gray-200 dark:divide-gray-700">
                        {references.map((ref, index) => (
                            <li key={`${ref.target}-${index}-${ref.value}`} className="text-sm py-1.5 px-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-100">
                                <span className="font-mono text-gray-800 dark:text-gray-200">→ {ref.target}</span>
                                {/* Value is likely 1 (connection count) */}
                                {/* <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({ref.value})</span> */}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default ReferenceListPanel;