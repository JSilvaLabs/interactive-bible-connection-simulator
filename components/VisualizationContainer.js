"use client";

import React from 'react';
import ChordDiagram from './ChordDiagram';

function VisualizationContainer({
    data,
    width,
    height,
    onNodeSelect,
    onNodeHoverStart, // Already includes hover props
    onNodeHoverEnd,   // Already includes hover props
    isLoading         // Already includes loading prop
 }) {

  let content;

  if (isLoading) {
    // Display a loading indicator while filtering or initial selection is pending
    content = <div className="text-gray-500 dark:text-gray-400 animate-pulse p-4 text-center">Loading Connections...</div>;
  } else if (data && data.nodes && data.nodes.length > 0 && data.links && width > 0 && height > 0) {
    // If not loading and data is valid (has nodes), render the diagram
    content = (
      <ChordDiagram
         data={data}
         width={width}
         height={height}
         onNodeSelect={onNodeSelect}
         onNodeHoverStart={onNodeHoverStart} // Pass down hover handlers
         onNodeHoverEnd={onNodeHoverEnd}
      />
    );
  } else if (data && data.nodes && data.nodes.length === 0) {
      // If not loading, data is present but filtering resulted in no connections
      content = <div className="text-gray-500 dark:text-gray-400 p-4 text-center">No connections found for this selection in the current view (Chapter/Verse).</div>;
  } else {
    // Default placeholder if no selection made yet or data is null
    content = <div className="text-gray-500 dark:text-gray-400 p-4 text-center">Please select a Book and Chapter above to view connections.</div>;
  }

  return (
    // Ensure container allows content to fill it for centering/display
    <div className="w-full h-full flex items-center justify-center chord-diagram-container bg-white dark:bg-gray-900 overflow-hidden">
      {content}
    </div>
  );
}

export default VisualizationContainer;