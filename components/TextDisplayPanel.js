// components/TextDisplayPanel.js (MRP v1.5 - Restore Title Style & Logic)
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getTextForReference, getNodeMetadata } from '@/utils/dataService';

function TextDisplayPanel({
    selectedNodeId,    // Node ID from click event
    bibleData,         // The loaded Bible data object
    isLoadingBibleData,// Boolean for initial Bible data load
    viewMode           // Prop indicating 'chapter' or 'verse' view
}) {
  const [textContent, setTextContent] = useState('');
  const [panelTitle, setPanelTitle] = useState('Instructions'); // Default title
  const [isLoadingText, setIsLoadingText] = useState(false);

  const displayId = selectedNodeId;

  // Effect to update Panel Title (Restored Logic from Step 11f)
  useEffect(() => {
    let title = "Instructions"; // Default title
    if (isLoadingBibleData) {
        title = "Loading Data...";
    } else if (displayId) {
         const metadata = getNodeMetadata(displayId);
         if (metadata?.book && metadata.book !== 'Unknown') {
             // Use viewMode for title
             if (metadata.verse !== null) {
                 // Always show specific reference if a verse node is selected
                 title = `${metadata.book} ${metadata.chapter}:${metadata.verse}`;
             } else if (viewMode === 'verse') {
                // Chapter node selected, but in Verse view mode (implies showing full chapter text)
                 title = `Chapter ${metadata.chapter} Text`; // Indicate it's the chapter text
             } else { // viewMode === 'chapter'
                // Chapter node selected in Chapter view mode
                 title = `Chapter ${metadata.chapter}`;
             }
         } else {
             // Fallback for unparsed IDs or initial load before node selection
             title = viewMode === 'verse' ? 'Verse View' : 'Chapter View'; // Generic title based on mode
             if(displayId) title += `: ${displayId}`; // Append raw ID if available
         }
    } else {
        // No node selected, title depends on viewMode
        title = viewMode === 'verse' ? 'Select Verse' : 'Select Chapter';
    }
    setPanelTitle(title);
  }, [displayId, isLoadingBibleData, viewMode]); // Keep viewMode dependency

  // Effect to fetch and update Text Content (Keep working version from Step 11h)
  useEffect(() => {
    let isMounted = true;
    // console.log(`[TextPanel Effect TEXT] Running...`); // Keep logs minimal now

    if (isLoadingBibleData) {
        if (isMounted) { setTextContent("Loading Bible data..."); setIsLoadingText(false); }
        return;
    }
    if (!bibleData) {
         if (isMounted) { setTextContent("Bible data is unavailable."); setIsLoadingText(false); }
        return;
    }

    if (displayId) {
        // console.log(`[TextPanel Effect TEXT] Fetching text for ${displayId}...`);
        if (isMounted) setIsLoadingText(true);
        try {
            const textResult = getTextForReference(bibleData, displayId);
            // console.log(`[TextPanel Effect TEXT] Result:`, textResult);
            if (isMounted) {
                const newContent = textResult || `Text not found for ${displayId}.`;
                setTextContent(newContent);
                // console.log(`[TextPanel Effect TEXT] Set textContent.`);
                setIsLoadingText(false);
            }
        } catch (error) {
            console.error(`[TextPanel Effect TEXT] Error getting text for ${displayId}:`, error);
            if (isMounted) {
                 setTextContent(`Error retrieving text for ${displayId}.`);
                 setIsLoadingText(false);
            }
        }

    } else {
        // console.log("[TextPanel Effect TEXT] No displayId, showing instructions.");
        const instructions = "Select a Book and Chapter using the dropdowns above.\n\nThe diagram shows connections for the selected scope (Chapter or Verse).\n\nClick a node on the diagram axis to view its text here and see its specific outgoing connections in the list below.";
        if (isMounted) {
            setTextContent(instructions);
            setIsLoadingText(false);
        }
    }

    return () => { isMounted = false };
  }, [displayId, bibleData, isLoadingBibleData]);

  // --- Render ---
  return (
    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-white dark:bg-gray-800 shadow-inner text-display-panel">
        {/* Sticky Header */}
        {/* >> RESTORED Title Styling << */}
        <h2
            className="text-2xl font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-white dark:bg-gray-800 z-10 flex-shrink-0 truncate px-1" // Restored text-2xl and border-b
            title={panelTitle}
        >
            {panelTitle}
        </h2>
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-grow custom-scrollbar px-1 pb-1">
            {isLoadingText ? (
                <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400 animate-pulse p-4 text-center text-lg"> Loading text... </div>
            ) : (
                // Keep text-lg for content
                <pre className="text-lg whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                    {textContent}
                </pre>
            )}
        </div>
    </div>
  );
}

export default TextDisplayPanel;