"use client";

import React from 'react';
import ArcDiagram from './ArcDiagram';

/**
 * Wrapper component for the ArcDiagram.
 * Sets up the SVG container with adaptive margins suitable for vertical layout
 * (potentially wider left margin for labels) and handles loading/placeholder states. (MVP v6.2: Margins potentially increased)
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

    // --- MVP v6.2: Further Adjusted Margins ---
    // Increase left margin more if needed to accommodate larger nodes/labels from ArcDiagram.js
    // Also ensure enough right margin for potentially wider arcs if diagram is narrow.
    const isSmallScreenWidth = width < 500; // Example threshold
    const margin = {
        top: 30,
        right: isSmallScreenWidth ? 20 : 50,   // More space on right for arcs
        bottom: 40,
        left: isSmallScreenWidth ? 80 : 250  // <<< Further Increased left margin example
    };
    // --- End Margin Adjustment ---

    // Calculate inner dimensions, ensuring non-negative
    const innerWidth = Math.max(1, width - margin.left - margin.right);
    const innerHeight = Math.max(1, height - margin.top - margin.bottom);

    let content;

    if (innerWidth <= 10 || innerHeight <= 50) { // Check inner dimensions
         content = ( <text x={width / 2} y={height / 2} /* ... */ >Container too small.</text> );
    } else if (isLoading) {
        content = ( <text x={width / 2} y={height / 2} /* ... */ >Loading Connections...</text> );
    } else if (!data || !data.nodes || data.nodes.length === 0) {
        content = ( <text x={width / 2} y={height / 2} /* ... */ >{ !data ? "Select Book/Chapter." : "No connections found." }</text> );
    } else {
        // Render ArcDiagram within a translated group
        content = (
            <g transform={`translate(${margin.left},${margin.top})`}>
                <ArcDiagram
                    data={data}
                    width={innerWidth} // Pass calculated inner dimensions
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
            {/* Optional: Debug rectangle for inner drawing area */}
            {/* <rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} fill="none" stroke="rgba(0,255,0,0.3)" strokeDasharray="2,2" /> */}
            {content}
        </svg>
    );
}

export default ArcDiagramContainer;