"use client";

import React from 'react';
import ChordDiagram from './ChordDiagram';

function VisualizationContainer({ data, width, height, onNodeSelect }) { // Added onNodeSelect prop

  return (
    <div className="w-full h-full flex items-center justify-center chord-diagram-container bg-white dark:bg-gray-900">
      {data && data.nodes && data.links && width > 0 && height > 0 ? (
        // Pass the onNodeSelect callback down to ChordDiagram
        <ChordDiagram
           data={data}
           width={width}
           height={height}
           onNodeSelect={onNodeSelect}
        />
      ) : (
        <div className="text-gray-500 dark:text-gray-400">
            { data ? "Calculating dimensions..." : "Loading connection data..." }
        </div>
      )}
    </div>
  );
}

export default VisualizationContainer;