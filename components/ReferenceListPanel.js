"use client";

import React from 'react';
// Import helpers needed for sorting target IDs canonically
import { parseReferenceId, normalizeBookNameForId } from '@/utils/dataService';
import { getBookSortIndex } from '@/utils/canonicalOrder';

/**
 * Component to display a list of outgoing cross-references
 * for a selected node (chapter or verse), sorted canonically.
 */
function ReferenceListPanel({
    selectedNodeId,       // The ID of the node selected in the diagram
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

        // Filter links originating from the selected node
        references = connectionData.links
            .filter(link => link.source === selectedNodeId)
            .sort((a, b) => {
                // Canonical Sort Logic for Target References
                const parsedA = parseReferenceId(a.target);
                const parsedB = parseReferenceId(b.target);

                // Handle cases where parsing might fail
                if (!parsedA && !parsedB) return 0;
                if (!parsedA) return 1;  // Sort unparseable targets last
                if (!parsedB) return -1;

                // Normalize book names using the ID normalization scheme for comparison
                const bookA = normalizeBookNameForId(parsedA.book);
                const bookB = normalizeBookNameForId(parsedB.book);

                // Get canonical sort indices
                const indexA = getBookSortIndex(bookA);
                const indexB = getBookSortIndex(bookB);

                // Primary sort: Canonical Book Order
                if (indexA !== indexB) return indexA - indexB;

                // Secondary sort: Chapter Number
                if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter;

                // Tertiary sort: Verse Number (treat chapter-only refs as verse 0)
                 // Verse will be null if the target ID is chapter-level (e.g. from Chapter View mode)
                const verseA = parsedA.verse === null ? 0 : parsedA.verse;
                const verseB = parsedB.verse === null ? 0 : parsedB.verse;
                if (verseA !== verseB) return verseA - verseB;

                // Fallback sort (shouldn't be needed if IDs are unique targets for a given source)
                return a.target.localeCompare(b.target);
            })
            .map(link => ({ target: link.target, value: link.value })); // Extract target and value (value is likely 1)

        if (references.length === 0) {
            message = "No outgoing connections found for this node in the current filtered view.";
        }
    } else if (selectedNodeId) {
        // Selected node, but connection data might still be loading/null
        displayTitle = `Connections from ${selectedNodeId}`;
        message = "Connection data not available or still loading...";
    }


    return (
        // Added 'reference-list' class for optional CSS, plus layout classes
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-gray-100 dark:bg-gray-800 shadow-inner reference-list">
             {/* Sticky Header */}
            <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-gray-100 dark:bg-gray-800 z-10 flex-shrink-0">
                {displayTitle} {references.length > 0 ? `(${references.length})` : ''}
            </h2>
             {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-grow custom-scrollbar">
                {message ? (
                     <p className="text-sm text-gray-500 dark:text-gray-400 p-1 italic">{message}</p>
                ) : (
                    <ul className="list-none p-0 m-0 divide-y divide-gray-200 dark:divide-gray-700">
                        {references.map((ref, index) => (
                            <li key={`${ref.target}-${index}-${ref.value}`} className="text-sm py-1.5 px-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-100">
                                {/* Consider making this a link or interactive later */}
                                <span className="font-mono text-gray-800 dark:text-gray-200">→ {ref.target}</span>
                                {/* Display value (connection count = 1 in this MVP) */}
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