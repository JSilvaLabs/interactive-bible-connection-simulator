// components/ArcDiagram.js (MRP v1.14 - Add Dimension Logging)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getNodeMetadata } from '@/utils/dataService';

// Helper Functions (setupScales, calculateArcPath, getArcStyle, drawAndUpdateArcs, drawAndUpdateNodes)
// Assume setupScales uses minimal fixed padding (0.1 or 0.05) from Step 11u
function setupScales(nodes, width, height, nodeRadius) { /* ... Minimal Fixed Padding ... */ }
function calculateArcPath(d, yScale, axisXPosition) { /* ... */ }
function getArcStyle(link, selectedNodeId, hoveredNodeId) { /* ... */ }
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap, selectedNodeId) { /* ... */ }
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, labelFontSize, labelXOffset, handlers, selectedNodeId, styles) { /* ... */ }

// --- Main Component ---
function ArcDiagram({
    svgRef, data, width, height, selectedNodeId, onNodeSelect,
    resetZoomTrigger, viewMode
}) {
  const zoomGroupRef = useRef();
  const nodeMap = useRef(new Map()).current;
  const zoomBehaviorRef = useRef();
  const localHoveredNodeId = useRef(null);

  useEffect(() => {
    // >> ADD LOGGING for received width/height props <<
    console.log(`[ArcDiagram Effect] Received Props: Width=${width}, Height=${height}, Nodes=${data?.nodes?.length}`);

    if (!svgRef?.current || !zoomGroupRef?.current) return;
    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    zoomGroup.selectAll("g.dynamic-hover-info").remove();

    if (!data || !data.nodes || data.nodes.length === 0 || !width || width <= 10 || !height || height <= 50) {
        console.log('[ArcDiagram Effect] Aborting draw: Invalid data or dimensions.');
        zoomGroup.selectAll("*").remove(); return;
    }

    // Define Parameters & Styles
    const nodeRadius = 7; const labelFontSize = 17; const labelXOffset = -(nodeRadius + 10);
    const styles = { /* ... */ };

    // Build Node Map
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));

    // Calculate Scales - PASS THE RECEIVED PROPS
    const scales = setupScales(data.nodes, width, height, nodeRadius); // Use props directly

    // Validate Scales
    if (!scales || !scales.yScale || typeof scales.yScale !== 'function' || !scales.colorScale || typeof scales.colorScale !== 'function') { console.error("[ArcDiagram Effect] Invalid scale OBJECT. Aborting draw.", scales); return; }
    if (scales.yScale.domain().length === 0 && data.nodes.length > 0) { console.error("[ArcDiagram Effect] Scale domain empty. Aborting draw."); return; }
    const { yScale, colorScale, axisXPosition } = scales;
    console.log(`[ArcDiagram Effect] Using Scales for Inner Height: ${height}`); // Log height used for scale range

    // Prepare Containers
    const arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // Interaction Handlers
    const handleMouseOver = (event, d) => { /* ... */ };
    const handleMouseOut = (event, d) => { /* ... */ };
    const handleClick = (event, d) => { /* ... */ };

    // Draw Elements
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap, selectedNodeId, null);
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, labelFontSize, labelXOffset, { mouseover: handleMouseOver, mouseout: handleMouseOut, click: handleClick }, selectedNodeId, styles);

    // Explicitly Re-apply Arc Styles
    arcsContainer.selectAll('path.arc-path').each(function(d) { /* ... */ });

    // D3 Zoom Setup
    // ... (zoom setup remains the same) ...

    // Cleanup
    return () => { /* ... */ };

  }, [data, width, height, selectedNodeId, onNodeSelect, svgRef, viewMode]); // Dependencies

  // Zoom Reset Effect
  useEffect(() => { /* ... */ }, [resetZoomTrigger, svgRef]);

  return <g ref={zoomGroupRef} id="zoom-pan-group"></g>;
}

// --- Make sure helper functions are included below ---
// (Ensure setupScales uses the minimal padding version from Step 11u)

export default ArcDiagram;