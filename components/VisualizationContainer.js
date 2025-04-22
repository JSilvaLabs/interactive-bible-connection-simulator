"use client";

import React from 'react';
import ChordDiagram from './ChordDiagram'; // Assuming ChordDiagram is in the same folder

function VisualizationContainer({ data, width, height }) {
  // This container primarily sets up the space and passes props
  // It ensures ChordDiagram has the data and dimensions it needs
  // Added a conditional render check for data
  return (
    <div className="w-full h-full flex items-center justify-center chord-diagram-container">
      {data && data.nodes && data.links && width > 0 && height > 0 ? (
        <ChordDiagram data={data} width={width} height={height} />
      ) : (
        <p>Loading data or calculating dimensions...</p> // Placeholder
      )}
    </div>
  );
}

export default VisualizationContainer;