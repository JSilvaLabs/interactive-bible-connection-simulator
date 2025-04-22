"use client";

import React from 'react';
import ArcDiagram from './ArcDiagram'; // Import the new D3 component

/**
 * Wrapper component for the ArcDiagram.
 * Sets up the SVG container with margins and handles loading/placeholder states.
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
    // Define margins for axis, labels, and giving arcs space
    const margin = { top: 20, right: 30, bottom: 120, left: 30 }; // Increased bottom margin for labels

    // Calculate inner dimensions for the diagram itself
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    let content;

    // Check if dimensions are valid *after* applying margins
    if (innerWidth <= 0 || innerHeight <= 0) {
         content = (
            <text x={width / 2} y={height / 2} textAnchor="middle" className="text-sm text-red-500">
                Container is too small to render diagram.
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
            <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 text-sm">
                { !data ? "Select Book/Chapter." : "No connections found." }
            </text>
        );
    } else {
        // Data is valid and dimensions are sufficient, render the ArcDiagram within a translated group
        content = (
            <g transform={`translate(${margin.left},${margin.top})`}>
                <ArcDiagram
                    data={data} // Pass the sorted nodes and filtered links
                    width={innerWidth}
                    height={innerHeight} // Pass the calculated inner dimensions
                    onNodeSelect={onNodeSelect}
                    onNodeHoverStart={onNodeHoverStart}
                    onNodeHoverEnd={onNodeHoverEnd}
                />
            </g>
        );
    }

    return (
        // The main SVG container takes the full passed width/height
        <svg width={width} height={height} className="arc-diagram-svg max-w-full max-h-full block">
            {content}
        </svg>
    );
}

export default ArcDiagramContainer;