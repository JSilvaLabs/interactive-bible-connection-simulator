// components/ArcDiagramContainer.js (MRP v1.8 - Responsive Vertical Margins)
"use client";

import React, { useRef } from 'react';
import ArcDiagram from './ArcDiagram';

function ArcDiagramContainer({
    data, width, height, onNodeSelect, isLoading,
    resetZoomTrigger, selectedNodeId, viewMode
}) {
    const svgRef = useRef();

    // Determine responsive horizontal margins
    const isSmallScreenWidth = width < 640; // sm breakpoint
    const horizontalMargin = isSmallScreenWidth ? 20 : 40;

    // Define different vertical margins
    const mobileVerticalMargin = 10; // Smaller margin for mobile
    const desktopVerticalMargin = 20;// Keep slightly larger for desktop
    const verticalMargin = isSmallScreenWidth ? mobileVerticalMargin : desktopVerticalMargin;

    // Adjust left margin based on screen width
    const leftMargin = isSmallScreenWidth ? 50 : 150; // Reduced mobile left margin slightly

    const margin = {
        top: verticalMargin,
        right: horizontalMargin,
        bottom: verticalMargin,
        left: leftMargin
    };

    // Calculate inner dimensions
    const innerWidth = Math.max(1, width - margin.left - margin.right);
    const innerHeight = Math.max(1, height - margin.top - margin.bottom);

    let content;

    if (innerWidth <= 10 || innerHeight <= 10) { // Adjusted min height check
         content = ( <text x={width / 2} y={height / 2} textAnchor="middle" className="text-xs text-red-500">Too small</text> ); // Smaller text
    } else if (isLoading) {
        content = ( <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 animate-pulse">Loading...</text> ); // Shorter text
    } else if (!data || !data.nodes || data.nodes.length === 0) {
        content = ( <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 text-sm px-2 text-center">{ !data ? "Select Book/Ch." : "No connections." }</text> ); // Shorter text
    } else {
        content = (
            <g transform={`translate(${margin.left},${margin.top})`}>
                <ArcDiagram
                    svgRef={svgRef} data={data} width={innerWidth} height={innerHeight}
                    selectedNodeId={selectedNodeId} onNodeSelect={onNodeSelect}
                    resetZoomTrigger={resetZoomTrigger} viewMode={viewMode}
                />
            </g>
        );
    }

    return (
        <svg ref={svgRef} width={width} height={height} className="arc-diagram-svg max-w-full max-h-full block bg-white dark:bg-gray-900" aria-label="Arc Diagram Visualization">
            {content}
        </svg>
    );
}

export default ArcDiagramContainer;