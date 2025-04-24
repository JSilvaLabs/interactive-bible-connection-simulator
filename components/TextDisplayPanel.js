// components/TextDisplayPanel.js (MRP v1.1 - Reverted to fix syntax errors)
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getTextForReference, getNodeMetadata } from '@/utils/dataService';

function TextDisplayPanel({
    selectedNodeId,    // Node ID from click event (ONLY prop needed for display ID now)
    // REMOVED: hoveredNodeId,
    bibleData,
    isLoadingBibleData // Boolean for initial Bible data load (Prop name)
}) {
  const [textContent, setTextContent] = useState('');
  const [panelTitle, setPanelTitle] = useState('Instructions');
  const [isLoadingText, setIsLoadingText] = useState(false);

  // Display ID is now simply the selectedNodeId
  const displayId = selectedNodeId;

  // Effect to update Panel Title
  useEffect(() => {
    let title = "Instructions";
    if (isLoadingBibleData) {
        title = "Loading Data...";
    } else if (displayId) {
         const metadata = getNodeMetadata(displayId);
         if (metadata?.book && metadata.book !== 'Unknown') {
             let baseTitle = metadata.verse !== null
                 ? `${metadata.book} ${metadata.chapter}:${metadata.verse}`
                 : `${metadata.book} ${metadata.chapter}`;
             title = `${baseTitle}`; // Simplified title
         } else {
             title = `${displayId}`; // Fallback for unparsed
         }
    }
    setPanelTitle(title);
  }, [displayId, isLoadingBibleData]); // Dependencies simplified

  // Effect to fetch and update Text Content
  useEffect(() => {
    let isMounted = true;
    if (isLoadingBibleData) {
        setTextContent("Loading Bible data...");
        setIsLoadingText(false);
        return;
    }
    if (!bibleData) {
        setTextContent("Bible data is unavailable. Please check loading status or reload.");
        setIsLoadingText(false);
        return;
    }

    if (displayId) {
        setIsLoadingText(true);
        try {
            const textResult = getTextForReference(bibleData, displayId);
            if (isMounted) setTextContent(textResult || `Text not found for ${displayId}.`);
        } catch (error) {
            console.error(`[TextDisplayPanel] Error getting text for ${displayId}:`, error);
            if (isMounted) setTextContent(`Error retrieving text for ${displayId}.`);
        } finally { if (isMounted) setIsLoadingText(false); }
    } else {
        setTextContent("Select a Book and Chapter using the dropdowns above.\n\nThe diagram shows connections for the selected scope (Chapter or Verse).\n\nClick a node on the diagram axis to view its text here and see its specific outgoing connections in the list below.");
        setIsLoadingText(false);
    }

    return () => { isMounted = false };
  }, [displayId, bibleData, isLoadingBibleData]);

  // --- Render ---
  return (
    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-white dark:bg-gray-800 shadow-inner text-display-panel">
        {/* Sticky Header */}
        <h2
            className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-white dark:bg-gray-800 z-10 flex-shrink-0 truncate px-1"
            title={panelTitle} // Full title on hover
        >
            {panelTitle} {/* Display the formatted title */}
        </h2>
        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-grow custom-scrollbar px-1 pb-1">
            {isLoadingText ? (
                // Loading state specific to text lookup
                <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400 animate-pulse p-4 text-center text-sm">
                    Loading text...
                </div>
            ) : (
                // Display formatted text or instructions
                <pre className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                    {textContent}
                </pre>
            )}
        </div>
    </div>
  );
}

export default TextDisplayPanel;