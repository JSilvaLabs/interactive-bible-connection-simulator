// components/TextDisplayPanel.js (MRP v1.10 - Responsive Max Height)
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

  // Effect to update Panel Title
  useEffect(() => {
    let title = "Instructions"; // Default title
    if (isLoadingBibleData) {
        title = "Loading Data...";
    } else if (displayId) {
         const metadata = getNodeMetadata(displayId);
         if (metadata?.book && metadata.book !== 'Unknown') {
             // Always show "Book Chapter" or "Book C:V" format
             title = metadata.verse !== null
                 ? `${metadata.book} ${metadata.chapter}:${metadata.verse}` // Verse Selected
                 : `${metadata.book} ${metadata.chapter}`;              // Chapter Selected
         } else {
             title = displayId; // Fallback for unparsed IDs
         }
    } else {
        // Title when nothing selected (depends on viewMode)
        title = viewMode === 'verse' ? 'Select Verse' : 'Select Chapter';
    }
    setPanelTitle(title);
    // Keep viewMode dependency for the 'no selection' case
  }, [displayId, isLoadingBibleData, viewMode]);

  // Effect to fetch and update Text Content
  useEffect(() => {
    let isMounted = true;
    // console.log(`[TextPanel Effect TEXT] Running. DisplayID: ${displayId}, isLoadingBibleData: ${isLoadingBibleData}, bibleData loaded: ${!!bibleData}`);

    if (isLoadingBibleData) {
        // console.log("[TextPanel Effect TEXT] State: Loading core data.");
        if (isMounted) { setTextContent("Loading Bible data..."); setIsLoadingText(false); }
        return;
    }
    if (!bibleData) {
        // console.log("[TextPanel Effect TEXT] State: Bible data unavailable.");
         if (isMounted) { setTextContent("Bible data is unavailable."); setIsLoadingText(false); }
        return;
    }

    if (displayId) {
        // console.log(`[TextPanel Effect TEXT] State: Fetching text for ${displayId}...`);
        if (isMounted) setIsLoadingText(true); // Set loading before fetch
        try {
            const rawTextResult = getTextForReference(bibleData, displayId);
            // console.log(`[TextPanel Effect TEXT] getTextForReference result for ${displayId}:`, rawTextResult);
            if (isMounted) {
                let processedContent = `Text not found for ${displayId}.`; // Default if result is falsy
                if (rawTextResult) {
                    // Remove the first line (header)
                    const lines = rawTextResult.split('\n');
                    processedContent = lines.slice(1).join('\n').trim(); // Also trim leading/trailing whitespace

                     // If after slicing and trimming, content is empty, show a specific message
                     if (processedContent === '' && lines.length > 0 && lines[0].includes(displayId || '')) {
                         processedContent = `(No specific text content available for ${displayId})`;
                     } else if (processedContent === '') {
                         processedContent = `(No text content found for ${displayId})`;
                     }
                }
                setTextContent(processedContent);
                // console.log(`[TextPanel Effect TEXT] Set textContent to: "${processedContent.substring(0, 50)}..."`);
                setIsLoadingText(false); // Clear loading *after* setting text
            }
        } catch (error) {
            console.error(`[TextPanel Effect TEXT] Error getting text for ${displayId}:`, error);
            if (isMounted) {
                 setTextContent(`Error retrieving text for ${displayId}.`);
                 setIsLoadingText(false); // Clear loading on error
            }
        }

    } else {
        // console.log("[TextPanel Effect TEXT] State: No displayId, showing instructions.");
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
    // Panel container - Keep h-full for flexbox layout
    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-white dark:bg-gray-800 shadow-inner text-display-panel">
        {/* Sticky Header */}
        <h2
            className="text-2xl font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-white dark:bg-gray-800 z-10 flex-shrink-0 truncate px-1"
            title={panelTitle}
        >
            {panelTitle}
        </h2>
        {/* Scrollable Content Area with Responsive Max Height */}
        {/* Default max-h-72 (mobile, ~9 lines), lg:max-h-[30rem] for desktop (~12+ lines) */}
        <div className="flex-grow custom-scrollbar px-1 pb-1 overflow-y-auto max-h-72 lg:max-h-[30rem]"> {/* Responsive max-h */}
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