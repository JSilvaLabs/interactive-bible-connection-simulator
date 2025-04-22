"use client";

import React from 'react';
// Assuming dataService provides the text retrieval function
import { getTextForReference } from '@/utils/dataService';

function TextDisplayPanel({ selectedNodeId, bibleData, isLoadingBibleData }) { // Added isLoadingBibleData prop
  let displayText = "";
  let displayTitle = "Selected Text";
  let isLoading = false;

  if (isLoadingBibleData) {
    // If the underlying Bible data is still loading
    displayText = "Loading Bible data...";
    displayTitle = "Loading...";
    isLoading = true;
  } else if (selectedNodeId && bibleData) {
    // If Bible data is loaded and a node is selected, attempt to get text
    try {
        displayText = getTextForReference(bibleData, selectedNodeId);
        displayTitle = `Selected: ${selectedNodeId}`;
         if(displayText.startsWith('Book not found') || displayText.startsWith('Chapter not found') || displayText.startsWith('Verse not found')) {
            console.warn(`Text lookup warning: ${displayText}`);
            // Keep the warning message as displayText
        }
    } catch (error) {
        console.error(`Error getting text for ${selectedNodeId}:`, error);
        displayText = `Error retrieving text for ${selectedNodeId}.`;
        displayTitle = `Error`;
    }
  } else if (bibleData) {
     // If Bible data is loaded but nothing is selected
     displayText = "Select a Book/Chapter above, then click a node (chapter/verse) on the diagram to view its text or connections.";
     displayTitle = "Instructions";
  }
   else {
     // Fallback if bibleData somehow isn't loaded (should be covered by isLoadingBibleData)
      displayText = "Bible data unavailable.";
      displayTitle = "Error";
   }


  return (
    // Added fixed height and scrolling to the outer container
    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-hidden flex flex-col bg-gray-100 dark:bg-gray-800 shadow-inner">
      <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-gray-100 dark:bg-gray-800 z-10 flex-shrink-0">
        {displayTitle}
      </h2>
      {/* Make the content area scrollable */}
      <div className="overflow-y-auto flex-grow">
          {isLoading ? (
                <div className="flex justify-center items-center h-full text-gray-500 dark:text-gray-400 animate-pulse">
                    {displayText}
                </div>
          ) : (
            <pre className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans leading-relaxed p-1">
                 {/* Render the retrieved text or instructions */}
                 {displayText}
            </pre>
          )}
      </div>
    </div>
  );
}

export default TextDisplayPanel;