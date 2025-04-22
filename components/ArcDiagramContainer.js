"use client";

import React from 'react';
import ArcDiagram from './ArcDiagram'; // Import the ArcDiagram component

/**
 * Wrapper component for the ArcDiagram.
 * Sets up the SVG container with adaptive margins suitable for vertical layout
 * and handles loading/placeholder states.
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

    // --- MVP v5.1: Adaptive Margins ---
    const isSmallScreenWidth = width < 500; // Example threshold for reducing left margin
    const margin = {
        top: 30,
        right: isSmallScreenWidth ? 10 : 30,   // Slightly less right margin on small screens
        bottom: isSmallScreenWidth ? 40 : 60, // Less bottom margin if labels are smaller/hidden
        left: isSmallScreenWidth ? 40 : 120 // Significantly less left margin on small screens
    };
    // --- End Adaptive Margins ---

    // Calculate inner dimensions, ensuring they are not negative
    const innerWidth = Math.max(1, width - margin.left - margin.right);
    const innerHeight = Math.max(1, height - margin.top - margin.bottom);

    let content;

    if (innerWidth <= 10 || innerHeight <= 50) { // Check if inner dimensions are too small
         content = (
            <text x={width / 2} y={height / 2} textAnchor="middle" className="text-sm text-red-500">
                Container too small.
            </text>
         );
    } else if (isLoading) {
        content = (
            <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 animate-pulse">
                Loading Connections...
            </text>
        );
    } else if (!data || !data.nodes || data.nodes.length === 0) {
        content = (
            <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 text-sm px-2 text-center">
                { !data ? "Select Book/Chapter above." : "No connections found for this selection." }
            </text>
        );
    } else {
        // Render the ArcDiagram within a translated group using calculated inner dimensions
        content = (
            <g transform={`translate(${margin.left},${margin.top})`}>
                <ArcDiagram
                    data={data}
                    width={innerWidth}
                    height={innerHeight}
                    onNodeSelect={onNodeSelect}
                    onNodeHoverStart={onNodeHoverStart}
                    onNodeHoverEnd={onNodeHoverEnd}
                />
            </g>
        );
    }

    return (
        <svg width={width} height={height} className="arc-diagram-svg max-w-full max-h-full block bg-white dark:bg-gray-900" aria-label="Arc Diagram Visualization">
             {/* Optional: Debug rectangle for inner dimensions */}
             {/* <rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} fill="none" stroke="red" strokeDasharray="2,2" /> */}
            {content}
        </svg>
    );
}

export default ArcDiagramContainer;