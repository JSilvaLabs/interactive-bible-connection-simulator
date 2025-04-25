// components/ReferenceListPanel.js (MRP v1.3 - Larger Fonts & New Title Format)
"use client";

import React from 'react';
import { parseReferenceId, normalizeBookNameForId, normalizeBookNameForText, getNodeMetadata } from '@/utils/dataService';
import { getBookSortIndex } from '@/utils/canonicalOrder';

/**
 * Component to display a list of outgoing cross-references.
 * MRP v1.3: Updates list item format, increases font sizes significantly, and changes title format.
 */
function ReferenceListPanel({
    selectedNodeId,       // ID of the selected node
    connectionData,       // Filtered connection data { nodes:[], links:[] }
    isLoadingConnections  // Loading state
 }) {

    let references = [];
    let displayTitle = "Connections List"; // Default title
    let message = null;
    let connectionCount = 0;
    let listContent = null;

    // --- Determine Panel State and Content ---
    if (isLoadingConnections) {
        displayTitle = "Loading Connections..."; // Simpler title while loading
        listContent = ( <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400 animate-pulse p-4 text-center text-lg"> {/* Use text-lg */} Loading connections... </div> ); // text-lg (~18px)
    } else if (!selectedNodeId) {
        displayTitle = "Connections List";
        message = "Select a node on the diagram axis (like 'Genesis 1' or 'Genesis 1:1') to see its outgoing connections listed here.";
        listContent = <p className="text-lg text-gray-500 dark:text-gray-400 p-2 italic">{message}</p>; // Use text-lg
    } else if (connectionData?.links) {
        const filteredLinks = connectionData.links.filter(link => link && link.source === selectedNodeId);
        connectionCount = filteredLinks.length;

        // >> CHANGE 1: New Title Format <<
        displayTitle = `${connectionCount} Connection${connectionCount !== 1 ? 's' : ''}`; // Format: "# Connections" (pluralized)

        if (connectionCount === 0) {
            message = "No outgoing connections found for this specific selection in the current view.";
            listContent = <p className="text-lg text-gray-500 dark:text-gray-400 p-2 italic">{message}</p>; // Use text-lg
        } else {
            references = filteredLinks
                .sort((a, b) => { /* ... Robust sort logic ... */
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
                .map(link => ({ target: link.target, value: link.value || 1 }));

             listContent = (
                 <ul className="list-none p-0 m-0 divide-y divide-gray-200 dark:divide-gray-700">
                    {references.map((ref, index) => {
                        const key = `${selectedNodeId}-to-${ref.target}-${index}`;
                        const targetMeta = getNodeMetadata(ref.target);
                        let targetLabel = ref.target;
                        if (targetMeta?.book && targetMeta.book !== 'Unknown' && targetMeta.chapter) {
                            targetLabel = targetMeta.verse !== null
                                ? `${targetMeta.book} ${targetMeta.chapter}:${targetMeta.verse}`
                                : `${targetMeta.book} ${targetMeta.chapter}`;
                        }

                        return (
                            // >> CHANGE 2: Increase list item font size significantly <<
                            <li key={key} className="py-2 px-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-100 text-lg" > {/* Use text-lg */}
                                <span className="font-mono text-gray-800 dark:text-gray-200 break-words" title={`Connection Target ID: ${ref.target}`}>
                                    → {targetLabel}
                                </span>
                            </li>
                        );
                    })}
                </ul>
             );
        }
    } else if (selectedNodeId) {
          displayTitle = `Connections Error`; // Simpler error title
          message = "Connection data is currently unavailable for this selection.";
          listContent = <p className="text-lg text-red-500 dark:text-red-400 p-2 italic">{message}</p>; // Use text-lg
    }

    // --- Render ---
    return (
        <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-white dark:bg-gray-800 shadow-inner reference-list-panel">
             {/* Sticky Header */}
             {/* >> CHANGE 3: Increase title font size significantly << */}
            <h2 className="text-2xl font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-white dark:bg-gray-800 z-10 flex-shrink-0 truncate px-1" title={displayTitle}> {/* Use text-2xl */}
                {displayTitle}
            </h2>
             {/* Scrollable Content Area */}
            <div className="overflow-y-auto flex-grow custom-scrollbar px-1 pb-1">
                {listContent}
            </div>
        </div>
    );
}

export default ReferenceListPanel;