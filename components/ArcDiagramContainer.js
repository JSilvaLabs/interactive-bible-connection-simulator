"use client";

import React from 'react';
import ArcDiagram from './ArcDiagram';

/**
 * Wrapper component for the ArcDiagram.
 * Sets up the SVG container with adaptive margins suitable for vertical layout
 * and handles loading/placeholder states. (MVP v6.1: Increased left margin)
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
    // Increase left margin substantially for labels next to vertical axis.
    // Adjust right/top/bottom for visual balance and arc clearance.
    const margin = {
        top: 30,
        right: 40,  // Provide some space for arcs extending right
        bottom: 40, // Space below axis
        left: 200   // <<< INCREASED significantly for labels
    };
    // --- End Margin Adjustment ---

    // Calculate inner dimensions, ensuring they are not negative
    const innerWidth = Math.max(1, width - margin.left - margin.right);
    const innerHeight = Math.max(1, height - margin.top - margin.bottom);

    let content;

    // Check if inner dimensions are valid *after* applying margins
    if (innerWidth <= 20 || innerHeight <= 50) {
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
                { !data ? "Select Book/Chapter." : "No connections found." }
            </text>
        );
    } else {
        // Render the ArcDiagram within a translated group using calculated inner dimensions
        content = (
            <g transform={`translate(${margin.left},${margin.top})`}>
                <ArcDiagram
                    data={data}
                    width={innerWidth} // Pass inner dimensions
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
            {content}
        </svg>
    );
}

export default ArcDiagramContainer;