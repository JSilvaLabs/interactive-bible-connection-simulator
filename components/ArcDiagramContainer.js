// components/ArcDiagramContainer.js (MRP v1.1 - Pass viewMode)
"use client";

import React, { useRef } from 'react';
import ArcDiagram from './ArcDiagram';

function ArcDiagramContainer({
    data,
    width,
    height,
    onNodeSelect,
    // Removed hover handlers
    isLoading,
    resetZoomTrigger,
    selectedNodeId,
    viewMode // <<< Added prop
}) {
    const svgRef = useRef(); // Ref for the SVG element itself

    // Margins defined for vertical layout (adjust as needed)
    const isSmallScreenWidth = width < 500;
    const margin = {
        top: 30,
        right: isSmallScreenWidth ? 20 : 40,
        bottom: 40,
        left: isSmallScreenWidth ? 80 : 250 // Use wider left margin for labels
    };

    // Calculate inner dimensions, ensuring they are non-negative
    const innerWidth = Math.max(1, width - margin.left - margin.right);
    const innerHeight = Math.max(1, height - margin.top - margin.bottom);

    let content;

    // Check if inner dimensions are sufficient
    if (innerWidth <= 10 || innerHeight <= 50) {
         content = ( <text x={width / 2} y={height / 2} textAnchor="middle" className="text-sm text-red-500">Container too small.</text> );
    } else if (isLoading) {
        // Display loading message if isLoading is true (passed from page)
        content = ( <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 animate-pulse">Loading Connections...</text> );
    } else if (!data || !data.nodes || data.nodes.length === 0) {
         // Display message if no data or no nodes after loading completes
        content = ( <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 text-sm px-2 text-center">{ !data ? "Select Book/Chapter." : "No connections found." }</text> );
    } else {
        // Render the ArcDiagram within a translated group if data is valid
        content = (
            <g transform={`translate(${margin.left},${margin.top})`}>
                <ArcDiagram
                    svgRef={svgRef} // Pass parent SVG ref down
                    data={data}
                    width={innerWidth}
                    height={innerHeight}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={onNodeSelect}
                    resetZoomTrigger={resetZoomTrigger}
                    viewMode={viewMode} // <<< Pass viewMode down
                />
            </g>
        );
    }

    return (
        // Attach ref to the SVG element
        <svg ref={svgRef} width={width} height={height} className="arc-diagram-svg max-w-full max-h-full block bg-white dark:bg-gray-900" aria-label="Arc Diagram Visualization">
            {content}
        </svg>
    );
}

export default ArcDiagramContainer;