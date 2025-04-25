// components/ArcDiagramContainer.js (MRP v1.5 - Adjust Margins)
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
    viewMode // Prop passed down
}) {
    const svgRef = useRef(); // Ref for the SVG element itself

    // Determine responsive horizontal margins
    const isSmallScreenWidth = width < 640; // Use sm breakpoint for margin change
    const horizontalMargin = isSmallScreenWidth ? 20 : 40;
    // Reduce vertical margins for better space utilization
    const verticalMargin = 20; // Reduced from 30/40

    const margin = {
        top: verticalMargin,
        right: horizontalMargin,
        bottom: verticalMargin, // Use reduced vertical margin
        // Keep potentially larger left margin for labels, adjusted slightly
        left: isSmallScreenWidth ? 60 : 150
    };

    // Calculate inner dimensions, ensuring they are non-negative
    const innerWidth = Math.max(1, width - margin.left - margin.right);
    const innerHeight = Math.max(1, height - margin.top - margin.bottom);

    let content;

    // Check if inner dimensions are sufficient
    if (innerWidth <= 10 || innerHeight <= 20) { // Adjusted min height check slightly
         content = ( <text x={width / 2} y={height / 2} textAnchor="middle" className="text-sm text-red-500">Container too small.</text> );
    } else if (isLoading) {
        // Display loading message if isLoading is true
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
                    viewMode={viewMode} // Pass viewMode down
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