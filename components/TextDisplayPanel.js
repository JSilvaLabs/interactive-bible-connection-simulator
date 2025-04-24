// components/TextDisplayPanel.js (MRP v1.0.1 - Fixed ReferenceError)
"use client";

import React, { useState, useEffect, useMemo } from 'react';
// Import helpers from dataService
import { getTextForReference, getNodeMetadata } from '@/utils/dataService';

function TextDisplayPanel({
    selectedNodeId,    // Node ID from click event
    hoveredNodeId,     // Node ID from hover event
    bibleData,         // The loaded Bible data object
    isLoadingBibleData // Boolean for initial Bible data load (Prop name)
}) {
  // State specifically for the text content being displayed
  const [textContent, setTextContent] = useState('');
  // State specifically for the title of the panel
  const [panelTitle, setPanelTitle] = useState('Instructions');
  // State to track if the text content itself is being looked up
  const [isLoadingText, setIsLoadingText] = useState(false);

  // Determine the ID to display (prioritize selection, fallback to hover)
  const displayId = useMemo(() => selectedNodeId || hoveredNodeId, [selectedNodeId, hoveredNodeId]);
  const isHoverDisplay = useMemo(() => !selectedNodeId && !!hoveredNodeId, [selectedNodeId, hoveredNodeId]);

  // Effect to update Panel Title
  useEffect(() => {
    let title = "Instructions"; // Default title
    // Use the destructured prop 'isLoadingBibleData' here
    if (isLoadingBibleData) { // Use the prop name
        title = "Loading Data...";
    } else if (displayId) {
         const metadata = getNodeMetadata(displayId); // Get parsed info
         if (metadata?.book && metadata.book !== 'Unknown') {
             // Format: Book C:V or Book C
             let baseTitle = metadata.verse !== null
                 ? `${metadata.book} ${metadata.chapter}:${metadata.verse}`
                 : `${metadata.book} ${metadata.chapter}`;

             title = isHoverDisplay ? `Hover: ${baseTitle}` : `Selected: ${baseTitle}`;
         } else {
             // Fallback for unparsed or unknown IDs
             title = isHoverDisplay ? `Hover: ${displayId}` : `Selected: ${displayId}`;
         }
    }
    setPanelTitle(title);
    // Correct dependency array to use the prop name
  }, [displayId, isHoverDisplay, isLoadingBibleData]); // <-- CORRECTED: Use prop name here

  // Effect to fetch and update Text Content
  useEffect(() => {
    let isMounted = true;

    // Use the destructured prop 'isLoadingBibleData' here as well
    if (isLoadingBibleData) { // Use the prop name
        setTextContent("Loading Bible data...");
        setIsLoadingText(false); // Not loading specific text yet
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
            // Directly use the optimized function
            const textResult = getTextForReference(bibleData, displayId);
            if (isMounted) {
                setTextContent(textResult || `Text not found for ${displayId}.`);
            }
        } catch (error) {
            console.error(`[TextDisplayPanel] Error getting text for ${displayId}:`, error);
            if (isMounted) {
                 setTextContent(`Error retrieving text for ${displayId}.`);
            }
        } finally {
             if (isMounted) setIsLoadingText(false);
        }

    } else {
        // Default instructional text when no node is selected/hovered
        setTextContent("Select a Book and Chapter using the dropdowns above.\n\nThe diagram shows connections for the selected scope (Chapter or Verse).\n\nClick a node on the diagram axis to view its text here and see its specific outgoing connections in the list below.");
        setIsLoadingText(false);
    }

    // Cleanup function
    return () => { isMounted = false };

    // Also ensure the prop is used in this dependency array
  }, [displayId, bibleData, isLoadingBibleData]); // <-- CORRECTED: Use prop name here


  // --- Render ---
  return (
    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-white dark:bg-gray-800 shadow-inner text-display-panel">
        {/* --- Sticky Header --- */}
        <h2
            className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-white dark:bg-gray-800 z-10 flex-shrink-0 truncate px-1"
            title={panelTitle} // Full title on hover
        >
            {panelTitle} {/* Display the formatted title */}
        </h2>

        {/* --- Scrollable Content Area --- */}
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