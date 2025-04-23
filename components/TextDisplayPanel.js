// components/TextDisplayPanel.js (MVP v8.0 Update - Title Formatting & Default Text)
"use client";

import React, { useState, useEffect } from 'react';
// Import helpers from dataService
import { getTextForReference, getNodeMetadata } from '@/utils/dataService';

function TextDisplayPanel({
    selectedNodeId,    // Node ID from click event
    hoveredNodeId,     // Node ID from hover event
    bibleData,         // The loaded Bible data object
    isLoadingBibleData // Boolean for initial Bible data load
}) {
  const [displayText, setDisplayText] = useState("Loading...");
  const [displayTitle, setDisplayTitle] = useState("Bible Text");
  const [isLoadingText, setIsLoadingText] = useState(false);

  useEffect(() => {
    let isMounted = true;
    // Prioritize selected node, fallback to hovered node for display
    const displayId = selectedNodeId || hoveredNodeId;
    const isHover = !selectedNodeId && hoveredNodeId;

    // Determine Title based on ID and loading state
    let title = "Instructions"; // Default if nothing else applies
    if (isLoadingBibleData) {
        title = "Loading...";
    } else if (displayId) {
         const metadata = getNodeMetadata(displayId); // Get parsed info
         if (metadata && metadata.book) {
             if (metadata.verse !== null) { // Specific Verse
                 // MVP v8.0 Format: Book #:#
                 title = `${metadata.book} ${metadata.chapter}:${metadata.verse}`;
             } else { // Chapter level ID
                 // MVP v8.0 Format: Book #
                 title = `${metadata.book} ${metadata.chapter}`;
             }
             if (isHover) {
                 title = `Hover: ${title}`; // Prefix if showing hover info
             } else {
                 title = `Selected: ${title}`; // Prefix if showing selected info
             }
         } else {
             title = `Selected: ${displayId}`; // Fallback if metadata parsing fails
         }
    }
    setDisplayTitle(title); // Set the calculated title

    // Determine Display Text
    if (isLoadingBibleData) {
        setDisplayText("Loading Bible data...");
        setIsLoadingText(false);
        return;
    }

    if (displayId && bibleData) {
        setIsLoadingText(true);
        // Use rAF to allow title update before potentially slow text lookup
        requestAnimationFrame(() => {
            if (!isMounted) return;
            try {
                const text = getTextForReference(bibleData, displayId);
                setDisplayText(text || `Text not found for ${displayId}.`);
            } catch (error) {
                console.error(`Error getting text for ${displayId}:`, error);
                setDisplayText(`Error retrieving text for ${displayId}.`);
            } finally {
                 if (isMounted) setIsLoadingText(false);
            }
        });

    } else if (bibleData) {
        // MVP v8.0: Updated default instructions
        setDisplayText("Select a Book and Chapter using the dropdowns above. The diagram shows connections for the selected chapter. Click a node (chapter or verse) on the diagram to view its text here and see its specific outgoing connections in the list below.");
        setIsLoadingText(false);
    } else {
         setDisplayTitle("Error");
         setDisplayText("Bible data is unavailable.");
         setIsLoadingText(false);
    }

     return () => { isMounted = false };

  }, [selectedNodeId, hoveredNodeId, bibleData, isLoadingBibleData]);


  return (
    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-gray-100 dark:bg-gray-800 shadow-inner">
        {/* Sticky Header */}
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-gray-100 dark:bg-gray-800 z-10 flex-shrink-0 truncate" title={displayTitle}>
             {/* Display the formatted title */}
            {displayTitle}
        </h2>
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-grow custom-scrollbar">
            {isLoadingText || isLoadingBibleData ? (
                <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400 animate-pulse p-4 text-center">
                    {isLoadingBibleData ? "Loading Bible data..." : "Looking up text..."}
                </div>
            ) : (
                <pre className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans leading-relaxed p-1">
                    {displayText}
                </pre>
            )}
        </div>
    </div>
  );
}

export default TextDisplayPanel;