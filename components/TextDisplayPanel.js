"use client";

import React, { useState, useEffect } from 'react';
import { getTextForReference } from '@/utils/dataService'; // Import the utility

function TextDisplayPanel({
    selectedNodeId,    // Node ID from click event
    hoveredNodeId,     // Node ID from hover event
    bibleData,         // The loaded Bible data object
    isLoadingBibleData // Boolean for initial Bible data load
}) {
  const [displayText, setDisplayText] = useState("Loading...");
  const [displayTitle, setDisplayTitle] = useState("Bible Text");
  const [isLoadingText, setIsLoadingText] = useState(false); // Local loading state for text lookup

  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component
    const idToFetch = selectedNodeId || hoveredNodeId; // Prioritize selected, fallback to hovered
    const isHover = !selectedNodeId && hoveredNodeId; // Flag if we're showing hover info

    if (isLoadingBibleData) {
        setDisplayTitle("Loading...");
        setDisplayText("Loading Bible data...");
        return; // Wait for Bible data to load
    }

    if (idToFetch && bibleData) {
        setIsLoadingText(true); // Indicate text lookup potentially starting
        setDisplayTitle(isHover ? `Hover: ${idToFetch}` : `Selected: ${idToFetch}`);

        // Simulate async lookup or allow UI to update before potential slow lookup
        requestAnimationFrame(() => {
            if (!isMounted) return;
            try {
                const text = getTextForReference(bibleData, idToFetch);
                setDisplayText(text || `Text not found for ${idToFetch}.`); // Handle case where lookup returns nothing
            } catch (error) {
                console.error(`Error getting text for ${idToFetch}:`, error);
                setDisplayText(`Error retrieving text for ${idToFetch}.`);
            } finally {
                setIsLoadingText(false);
            }
        });

    } else if (bibleData) {
        // Bible data loaded, but no node selected or hovered
        setDisplayTitle("Instructions");
        setDisplayText("Select Book/Chapter, then hover over or click a node on the diagram to view text.");
        setIsLoadingText(false);
    } else {
         // Bible data itself failed to load (handled by isLoadingBibleData generally)
         setDisplayTitle("Error");
         setDisplayText("Bible data is unavailable.");
         setIsLoadingText(false);
    }

     return () => { isMounted = false }; // Cleanup on unmount

  }, [selectedNodeId, hoveredNodeId, bibleData, isLoadingBibleData]); // Dependencies


  return (
    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-gray-100 dark:bg-gray-800 shadow-inner">
        {/* Sticky Header */}
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-gray-100 dark:bg-gray-800 z-10 flex-shrink-0">
            {displayTitle}
        </h2>
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-grow custom-scrollbar">
            {isLoadingText || isLoadingBibleData ? (
                // Show loading indicator specifically for text retrieval or initial load
                <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400 animate-pulse">
                    {isLoadingBibleData ? "Loading Bible data..." : "Loading text..."}
                </div>
            ) : (
                // Use pre for formatting, whitespace-pre-wrap for wrapping long lines
                <pre className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans leading-relaxed p-1">
                    {displayText}
                </pre>
            )}
        </div>
    </div>
  );
}

export default TextDisplayPanel;