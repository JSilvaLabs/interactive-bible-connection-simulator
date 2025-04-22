"use client";

import React from 'react';
import ArcDiagram from './ArcDiagram'; // Import the ArcDiagram component

/**
 * Wrapper component for the ArcDiagram.
 * Sets up the SVG container with adaptive margins suitable for vertical layout
 * (potentially wider left margin for labels) and handles loading/placeholder states.
 */
function ArcDiagramContainer({
    data,                 // { nodes: [canonically sorted], links: [] }
    width,                // Total width available for SVG
    height,               // Total height available for SVG
    onNodeSelect,
    onNodeHoverStart,
    onNodeHoverEnd,
    isLoading             // Boolean indicating data is being filtered/loaded
}) {

    // --- MVP v6.1: Adjusted Margins ---
    // Provide ample space on the left for node labels next to the vertical axis.
    // Adjust right/top/bottom for visual balance.
    const isSmallScreenWidth = width < 500; // Threshold for smaller side margins
    const margin = {
        top: 30,                            // Space above the diagram
        right: isSmallScreenWidth ? 20 : 40,  // Space for arcs extending right
        bottom: 40,                         // Space below the diagram axis
        left: isSmallScreenWidth ? 60 : 200 // << Increased left margin for labels (adjust as needed)
    };
    // --- End Margin Adjustment ---

    // Calculate inner dimensions for the diagram, ensuring they are non-negative
    const innerWidth = Math.max(1, width - margin.left - margin.right);
    const innerHeight = Math.max(1, height - margin.top - margin.bottom);

    let content;

    // Check if inner dimensions are sufficient to render anything meaningful
    if (innerWidth <= 10 || innerHeight <= 50) {
         content = (
            <text x={width / 2} y={height / 2} textAnchor="middle" className="text-sm text-red-500">
                Container too small.
            </text>
         );
    } else if (isLoading) {
        // Display loading indicator
        content = (
            <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 animate-pulse">
                Loading Connections...
            </text>
        );
    } else if (!data || !data.nodes || data.nodes.length === 0) {
        // Display placeholder if no data or selection results in no nodes
        content = (
            <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 text-sm px-2 text-center">
                { !data ? "Select Book/Chapter above." : "No connections found for this selection." }
            </text>
        );
    } else {
        // Render the ArcDiagram within a translated group using calculated inner dimensions
        content = (
            // Apply margins via transform to the <g> element
            <g transform={`translate(${margin.left},${margin.top})`}>
                <ArcDiagram
                    data={data} // Pass the sorted nodes and filtered links
                    width={innerWidth} // Pass calculated inner width
                    height={innerHeight} // Pass calculated inner height
                    onNodeSelect={onNodeSelect}
                    onNodeHoverStart={onNodeHoverStart}
                    onNodeHoverEnd={onNodeHoverEnd}
                />
            </g>
        );
    }

    return (
        // The main SVG container takes the full passed width/height
        <svg width={width} height={height} className="arc-diagram-svg max-w-full max-h-full block bg-white dark:bg-gray-900" aria-label="Arc Diagram Visualization">
            {/* Optional: Debug rectangle showing inner drawing area */}
            {/* <rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} fill="none" stroke="rgba(255,0,0,0.3)" strokeDasharray="2,2" /> */}
            {content}
        </svg>
    );
}

export default ArcDiagramContainer;