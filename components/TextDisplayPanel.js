"use client";

import React from 'react';
// Assuming dataService provides the text retrieval function
// If not, you might pass bibleData and implement retrieval logic here
import { getTextForReference } from '@/utils/dataService';

function TextDisplayPanel({ selectedNodeId, bibleData }) {
  let displayText = "Click a chapter/verse on the diagram to view text.";
  let displayTitle = "Selected Text";

  if (selectedNodeId && bibleData) {
    displayText = getTextForReference(bibleData, selectedNodeId);
    displayTitle = `Selected: ${selectedNodeId}`;
  } else if (selectedNodeId && !bibleData) {
      displayText = "Loading Bible data...";
      displayTitle = `Selected: ${selectedNodeId}`;
  }


  return (
    <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-lg h-full overflow-y-auto bg-gray-100 dark:bg-gray-800 shadow-inner">
      <h2 className="text-lg font-semibold mb-3 pb-2 border-b border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
        {displayTitle}
      </h2>
      {/* Using 'prose' classes from Tailwind Typography if installed, otherwise basic formatting */}
      <pre className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
        {displayText}
      </pre>
    </div>
  );
}

export default TextDisplayPanel;