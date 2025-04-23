// components/ArcDiagramContainer.js (MVP v8.1 Update - Pass Reset Trigger)
"use client";

import React, { useRef } from 'react'; // Import useRef
import ArcDiagram from './ArcDiagram';

function ArcDiagramContainer({
    data,
    width,
    height,
    onNodeSelect,
    onNodeHoverStart,
    onNodeHoverEnd,
    isLoading,
    resetZoomTrigger // New prop for zoom reset
}) {
    const svgRef = useRef(); // Ref for the SVG element itself

    // Margins defined for vertical layout (adjust as needed)
    const isSmallScreenWidth = width < 500;
    const margin = {
        top: 30,
        right: isSmallScreenWidth ? 20 : 40,
        bottom: 40,
        left: isSmallScreenWidth ? 80 : 250 // Wider left margin
    };

    const innerWidth = Math.max(1, width - margin.left - margin.right);
    const innerHeight = Math.max(1, height - margin.top - margin.bottom);

    let content;

    if (innerWidth <= 10 || innerHeight <= 50) {
         content = ( <text x={width / 2} y={height / 2} /* ... */ >Container too small.</text> );
    } else if (isLoading) {
        content = ( <text x={width / 2} y={height / 2} /* ... */ >Loading Connections...</text> );
    } else if (!data || !data.nodes || data.nodes.length === 0) {
        content = ( <text x={width / 2} y={height / 2} /* ... */ >{ !data ? "Select Book/Chapter." : "No connections found." }</text> );
    } else {
        // Render the ArcDiagram within a translated group
        content = (
            <g transform={`translate(${margin.left},${margin.top})`}>
                <ArcDiagram
                    // Pass necessary props down
                    svgRef={svgRef} // Pass the SVG ref for zoom attachment
                    data={data}
                    width={innerWidth}
                    height={innerHeight}
                    onNodeSelect={onNodeSelect}
                    onNodeHoverStart={onNodeHoverStart}
                    onNodeHoverEnd={onNodeHoverEnd}
                    resetZoomTrigger={resetZoomTrigger} // Pass the reset trigger down
                />
            </g>
        );
    }

    return (
        // Attach ref to the SVG element
        <svg ref={svgRef} width={width} height={height} className="arc-diagram-svg max-w-full max-h-full block bg-white dark:bg-gray-900" aria-label="Arc Diagram Visualization">
            {/* Optional: Debug rectangle for inner drawing area */}
            {/* <rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} fill="none" stroke="rgba(0,255,0,0.3)" strokeDasharray="2,2" /> */}
            {content}
        </svg>
    );
}

export default ArcDiagramContainer;