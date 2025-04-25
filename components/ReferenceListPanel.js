// components/ReferenceListPanel.js (MRP v1.7 - Responsive Max Height)
"use client";

import React from 'react';
import { parseReferenceId, normalizeBookNameForId, normalizeBookNameForText, getNodeMetadata } from '@/utils/dataService';
import { getBookSortIndex } from '@/utils/canonicalOrder';

/**
 * Component to display a list of outgoing cross-references.
 * MRP v1.7: Applies different max-height for list content on desktop vs mobile.
 */
function ReferenceListPanel({
    selectedNodeId,       // ID of the selected node
    connectionData,       // Filtered connection data { nodes:[], links:[] }
    isLoadingConnections, // Loading state
    onNodeSelect          // Callback function to select a node
 }) {

    let references = [];
    let displayTitle = "Connections List"; // Default title
    let message = null;
    let connectionCount = 0;
    let listContent = null;

    // --- Determine Panel State and Content ---
    if (isLoadingConnections) {
        const metadata = getNodeMetadata(selectedNodeId);
        let baseTitle = selectedNodeId || "...";
         if (metadata?.book && metadata.book !== 'Unknown') { baseTitle = metadata.verse !== null ? `${metadata.book} ${metadata.chapter}:${metadata.verse}` : `${metadata.book} ${metadata.chapter}`; }
        displayTitle = `Connections from ${baseTitle} (...)`; // Indicate loading count
        listContent = ( <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400 animate-pulse p-4 text-center text-lg"> {/* Use text-lg */} Loading connections... </div> ); // text-lg (~18px)
    } else if (!selectedNodeId) {
        displayTitle = "Connections List";
        message = "Select a node on the diagram axis (like 'Genesis 1' or 'Genesis 1:1') to see its outgoing connections listed here.";
        listContent = <p className="text-lg text-gray-500 dark:text-gray-400 p-2 italic">{message}</p>; // Use text-lg
    } else if (connectionData?.links) {
        const filteredLinks = connectionData.links.filter(link => link && link.source === selectedNodeId);
        connectionCount = filteredLinks.length;

        // New Title Format
        displayTitle = `${connectionCount} Connection${connectionCount !== 1 ? 's' : ''}`; // Format: "# Connections" (pluralized)

        if (connectionCount === 0) {
            message = "No outgoing connections found for this specific selection in the current view.";
            listContent = <p className="text-lg text-gray-500 dark:text-gray-400 p-2 italic">{message}</p>; // Use text-lg
        } else {
            references = filteredLinks
                .sort((a, b) => { // Robust sort logic
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
                        // Format targetLabel as Book C:V or Book C
                        let targetLabel = ref.target;
                        if (targetMeta?.book && targetMeta.book !== 'Unknown' && targetMeta.chapter) {
                            targetLabel = targetMeta.verse !== null
                                ? `${targetMeta.book} ${targetMeta.chapter}:${targetMeta.verse}`
                                : `${targetMeta.book} ${targetMeta.chapter}`;
                        }

                        // Handle click on list item
                        const handleClick = () => {
                            if (onNodeSelect && ref.target) {
                                // console.log(`ReferenceListPanel: Clicked ${ref.target}`);
                                onNodeSelect(ref.target); // Call the handler passed from MainPage
                            }
                        };

                        return (
                            <li
                                key={key}
                                className="py-2 px-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-100 text-lg cursor-pointer group" // Use text-lg
                                onClick={handleClick} // Add onClick handler
                                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }} // Basic keyboard accessibility
                                tabIndex={0} // Make list item focusable
                                role="button" // Indicate interactive role
                                aria-label={`Select connection target: ${targetLabel}`}
                             >
                                <span className="font-mono text-gray-800 dark:text-gray-200 break-words group-hover:text-blue-700 dark:group-hover:text-blue-300" title={`Connection Target ID: ${ref.target}`}> {/* Optional text color change on hover */}
                                    → {targetLabel} {/* Display formatted label */}
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
            <h2 className="text-2xl font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-white dark:bg-gray-800 z-10 flex-shrink-0 truncate px-1" title={displayTitle}>
                {displayTitle}
            </h2>
             {/* Scrollable Content Area with Responsive Max Height */}
             {/* max-h-60 default (mobile), max-h-96 on large screens (approx 10 items) */}
            <div className="flex-grow custom-scrollbar px-1 pb-1 overflow-y-auto max-h-60 lg:max-h-96"> {/* Changed lg:max-h-none to lg:max-h-96 */}
                {listContent}
            </div>
        </div>
    );
}

export default ReferenceListPanel;