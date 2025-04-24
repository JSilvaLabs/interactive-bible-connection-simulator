// components/ReferenceListPanel.js (MRP v1.1 - Polished)
"use client";

import React from 'react';
// Import helpers needed
import { parseReferenceId, normalizeBookNameForId, normalizeBookNameForText, getNodeMetadata } from '@/utils/dataService';
import { getBookSortIndex } from '@/utils/canonicalOrder';

/**
 * Component to display a list of outgoing cross-references
 * for a selected node (chapter or verse), sorted canonically.
 * MRP version includes polished UI, states, and accessibility.
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
    let listContent = null; // To hold the list or message JSX

    // --- Determine Panel State and Content ---
    if (isLoadingConnections) {
        // State: Loading connections for a selected node
        const metadata = getNodeMetadata(selectedNodeId); // Get metadata even while loading
        let baseTitle = selectedNodeId || "..."; // Use ID or placeholder
         if (metadata?.book && metadata.book !== 'Unknown') {
             baseTitle = metadata.verse !== null
                 ? `${metadata.book} ${metadata.chapter}:${metadata.verse}`
                 : `${metadata.book} ${metadata.chapter}`;
         }
        displayTitle = `Connections from ${baseTitle} (...)`; // Indicate loading count
        listContent = (
            <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400 animate-pulse p-4 text-center text-sm">
                Loading connections...
            </div>
        );
    } else if (!selectedNodeId) {
        // State: No node selected
        displayTitle = "Connections List";
        message = "Select a node on the diagram axis (like 'Genesis 1' or 'Genesis 1:1') to see its outgoing connections listed here.";
        listContent = <p className="text-sm text-gray-500 dark:text-gray-400 p-2 italic">{message}</p>;
    } else if (connectionData?.links) {
        // State: Data available, filter and display
        const metadata = getNodeMetadata(selectedNodeId);
         let baseTitle = selectedNodeId;
         if (metadata?.book && metadata.book !== 'Unknown') {
             baseTitle = metadata.verse !== null
                 ? `${metadata.book} ${metadata.chapter}:${metadata.verse}`
                 : `${metadata.book} ${metadata.chapter}`;
         }
         displayTitle = `Connections from ${baseTitle}`;

        const filteredLinks = connectionData.links.filter(link => link && link.source === selectedNodeId);
        connectionCount = filteredLinks.length;
        displayTitle += ` (${connectionCount})`; // Add count

        if (connectionCount === 0) {
            message = "No outgoing connections found for this specific selection in the current view.";
            listContent = <p className="text-sm text-gray-500 dark:text-gray-400 p-2 italic">{message}</p>;
        } else {
            references = filteredLinks
                .sort((a, b) => { /* ... Robust sort logic from v1.0.1 ... */
                    const targetA = a?.target || ''; const targetB = b?.target || '';
                    const parsedA = parseReferenceId(targetA); const parsedB = parseReferenceId(targetB);
                    if (!parsedA && !parsedB) return targetA.localeCompare(targetB); if (!parsedA) return 1; if (!parsedB) return -1;
                    const bookA = normalizeBookNameForId(parsedA.book); const bookB = normalizeBookNameForId(parsedB.book);
                    const indexA = getBookSortIndex(bookA); const indexB = getBookSortIndex(bookB);
                    if (indexA !== indexB) return indexA - indexB;
                    const chapterA = typeof parsedA.chapter === 'number' ? parsedA.chapter : Infinity; const chapterB = typeof parsedB.chapter === 'number' ? parsedB.chapter : Infinity;
                    if (chapterA !== chapterB) return chapterA - chapterB;
                    const verseA = parsedA.verse === null ? 0 : parsedA.verse; const verseB = parsedB.verse === null ? 0 : parsedB.verse;
                    if (verseA !== verseB) return verseA - verseB;
                    return targetA.localeCompare(targetB);
                 })
                .map(link => ({ target: link.target, value: link.value || 1 })); // Use value if available

             listContent = (
                 <ul className="list-none p-0 m-0 divide-y divide-gray-200 dark:divide-gray-700">
                    {references.map((ref, index) => {
                        const key = `${selectedNodeId}-to-${ref.target}-${index}`;
                        const targetMeta = getNodeMetadata(ref.target);
                        // Prefer formatted label, fallback to raw ID
                        const targetLabel = (targetMeta?.book !== 'Unknown' && targetMeta?.label)
                            ? targetMeta.label
                            : ref.target;

                        return (
                            <li key={key} className="py-1.5 px-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-100 text-sm" >
                                <span className="font-mono text-gray-800 dark:text-gray-200 break-words" title={`Connection Target ID: ${ref.target}`}>
                                    → {targetLabel}
                                </span>
                                {/* Optionally display value for chapter view? */}
                                {/* {ref.value > 1 && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({ref.value} links)</span>} */}
                            </li>
                        );
                    })}
                </ul>
             );
        }
    } else if (selectedNodeId) {
         // State: Node selected, but connectionData is unexpectedly null/missing links
         const metadata = getNodeMetadata(selectedNodeId);
          let baseTitle = selectedNodeId;
          if (metadata?.book && metadata.book !== 'Unknown') { baseTitle = metadata.verse !== null ? `${metadata.book} ${metadata.chapter}:${metadata.verse}` : `${metadata.book} ${metadata.chapter}`; }
          displayTitle = `Connections from ${baseTitle} (?)`; // Indicate missing data
          message = "Connection data is currently unavailable for this selection.";
          listContent = <p className="text-sm text-red-500 dark:text-red-400 p-2 italic">{message}</p>; // Use error color
    }


    // --- Render ---
    return (
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-white dark:bg-gray-800 shadow-inner reference-list-panel">
             {/* Sticky Header */}
            <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-white dark:bg-gray-800 z-10 flex-shrink-0 truncate px-1" title={displayTitle}>
                {displayTitle}
            </h2>
             {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-grow custom-scrollbar px-1 pb-1">
                {listContent} {/* Render the determined list or message */}
            </div>
        </div>
    );
}

export default ReferenceListPanel;