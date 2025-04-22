// components/ArcDiagramContainer.js (Add Logging)
"use client";

import React, { useRef } from 'react';
import ArcDiagram from './ArcDiagram';

function ArcDiagramContainer({ data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, isLoading }) {
    const svgRef = useRef();

    // Log input props
    // console.log(`[Container] Received Props: width=${width}, height=${height}, isLoading=${isLoading}, data nodes=${data?.nodes?.length}`);

    const margin = { top: 30, right: 40, bottom: 40, left: 250 }; // Use wide left margin from v6.2
    const innerWidth = Math.max(1, width - margin.left - margin.right);
    const innerHeight = Math.max(1, height - margin.top - margin.bottom);

    // Log calculated dimensions
    // console.log(`[Container] Calculated Dims: innerW=${innerWidth}, innerH=${innerHeight}`);

    let content;
    let renderArcDiagram = false; // Flag to check if ArcDiagram should be rendered

    if (width <= 0 || height <= 0) {
        content = <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="red">Container has zero dimensions.</text>;
        console.warn("[Container] Render blocked: Zero dimensions received.", { width, height });
    } else if (innerWidth <= 10 || innerHeight <= 50) {
         content = ( <text x={width / 2} y={height / 2} textAnchor="middle" className="text-sm text-red-500">Container too small after margins.</text> );
         console.warn("[Container] Render blocked: Inner dimensions too small.", { innerWidth, innerHeight });
    } else if (isLoading) {
        content = ( <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 animate-pulse">Loading Connections...</text> );
        // console.log("[Container] Rendering: Loading State");
    } else if (!data || !data.nodes || data.nodes.length === 0) {
        content = ( <text x={width / 2} y={height / 2} textAnchor="middle" className="text-gray-500 dark:text-gray-400 text-sm px-2 text-center">{ !data ? "Select Book/Chapter." : "No connections found." }</text> );
        // console.log("[Container] Rendering: No Data State");
    } else {
        // console.log("[Container] Rendering: ArcDiagram Component");
        renderArcDiagram = true; // Set flag
        content = (
            <g transform={`translate(${margin.left},${margin.top})`}>
                <ArcDiagram
                    svgRef={svgRef} // Pass the SVG ref down
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

    // Log final decision
     // console.log(`[Container] Final Render Decision: ${renderArcDiagram ? 'Render ArcDiagram' : 'Render Placeholder/Error'}`);

    return (
        <svg ref={svgRef} width={width} height={height} className="arc-diagram-svg max-w-full max-h-full block bg-white dark:bg-gray-900" aria-label="Arc Diagram Visualization">
            {/* Debug rectangle showing inner drawing area */}
            <rect x={margin.left} y={margin.top} width={innerWidth} height={innerHeight} fill="none" stroke="rgba(0,255,0,0.3)" strokeDasharray="2,2" />
            {content}
        </svg>
    );
}

export default ArcDiagramContainer;