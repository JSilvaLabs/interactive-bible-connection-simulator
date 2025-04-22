"use client";

import React from 'react';
import ChordDiagram from './ChordDiagram';

function VisualizationContainer({ data, width, height, onNodeSelect, isLoading }) { // Added isLoading prop

  let content;

  if (isLoading) {
    // Displaying a loading indicator while filtering is in progress
    content = <div className="text-gray-500 dark:text-gray-400 animate-pulse">Loading Connections...</div>;
  } else if (data && data.nodes && data.nodes.length > 0 && data.links && width > 0 && height > 0) {
    // If not loading and data is valid (has nodes), render the diagram
    content = (
      <ChordDiagram
         data={data}
         width={width}
         height={height}
         onNodeSelect={onNodeSelect}
      />
    );
  } else if (data && data.nodes && data.nodes.length === 0) {
      // If not loading, data is present but filtering resulted in no connections
      content = <div className="text-gray-500 dark:text-gray-400 p-4 text-center">No connections found for this selection.</div>;
  }
   else {
    // Default placeholder if no selection made yet or data is null
    content = <div className="text-gray-500 dark:text-gray-400 p-4 text-center">Please select a Book and Chapter to view connections.</div>;
  }

  return (
    // Ensure container allows content to fill it for centering/display
    <div className="w-full h-full flex items-center justify-center chord-diagram-container bg-white dark:bg-gray-900 overflow-hidden">
      {content}
    </div>
  );
}

export default VisualizationContainer;