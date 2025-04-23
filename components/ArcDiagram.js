// components/ArcDiagram.js (MVP v8.2 - Enhanced Checks for setupScales)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---
function setupScales(nodes, width, height, nodeRadius) {
    console.log(`[setupScales] Called with: nodes=${nodes?.length}, width=${width}, height=${height}, nodeRadius=${nodeRadius}`);
    if (!nodes || nodes.length === 0 || !width || width <= 0 || !height || height <= 0 || !nodeRadius || nodeRadius <= 0) {
        console.error("[setupScales] Invalid parameters received.");
        return { yScale: d3.scalePoint(), colorScale: d3.scaleOrdinal(), axisXPosition: 0 }; // Return default object
    }
    try { // Add try-catch within the helper too
        const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4))));
        const yScale = d3.scalePoint().domain(nodes.map(d => d.id)).range([0, height]).padding(padding);
        const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
        const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10).domain(bookNames);
        const axisXPosition = 0;
        // console.log("[setupScales] Scales calculated successfully.");
        return { yScale, colorScale, axisXPosition }; // Ensure object is returned
    } catch (error) {
        console.error("[setupScales] Error during scale calculation:", error);
        // Return default object on error
        return { yScale: d3.scalePoint(), colorScale: d3.scaleOrdinal(), axisXPosition: 0 };
    }
}
function calculateArcPath(d, yScale, axisXPosition) { /* ... (no changes) ... */ }
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) { /* ... (no changes) ... */ }
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId) { /* ... (no changes) ... */ }


// --- Main Component ---
function ArcDiagram({ svgRef, data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, resetZoomTrigger }) {
  const zoomGroupRef = useRef();
  const nodeMap = useRef(new Map()).current;
  const zoomBehaviorRef = useRef();

  useEffect(() => {
    // --- Guard Clauses & Basic Setup ---
    if (!svgRef?.current || !zoomGroupRef?.current) { console.log("ArcDiagram useEffect: Waiting for refs..."); return; }
    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    if (!data || !data.nodes || data.nodes.length === 0 || !width || width <= 10 || !height || height <= 50) {
        console.log("[ArcDiagram Hook] Invalid data or dimensions, clearing."); zoomGroup.selectAll("*").remove(); return;
    }
    // console.log(`[ArcDiagram Hook] Rendering: ${data.nodes.length} nodes, ${data.links.length} links. Dims: ${width}x${height}`);

    // --- Build Node Map & Params ---
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    // ... (adaptive parameter calculations: nodeRadius, showLabels, etc.) ...
     const nodeRadius = /*...*/ 8; const labelFontSize = /*...*/ '12px'; const labelXOffset = -(nodeRadius + 7); const showLabels = width > 90; const axisXPosition = 0;

    // --- Setup Scales ---
    console.log("[ArcDiagram Hook] Preparing to call setupScales...");
    if (!data.nodes || !width || !height || !nodeRadius) {
        console.error("[ArcDiagram Hook] FATAL: Missing valid parameters BEFORE calling setupScales.");
        return; // Exit if essential parameters are missing
    }
    const scales = setupScales(data.nodes, width, height, nodeRadius);
    console.log("[ArcDiagram Hook] Result from setupScales:", scales); // Log the direct result

    // --- CRITICAL CHECK - More Explicit ---
    if (typeof scales === 'undefined' || scales === null || typeof scales.yScale === 'undefined') {
        console.error("[ArcDiagram Hook] FATAL: setupScales returned undefined or invalid object. Scales:", scales);
        return; // Stop execution if scales is invalid
    }
    console.log("[ArcDiagram Hook] setupScales check passed. Destructuring...");
    // --- End Critical Check ---

    const { yScale, colorScale } = scales; // Destructure only after validation

    // --- Prepare Containers ---
    let arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    let nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
    const handlers = { /* ... handlers using valid scales, nodeRadius etc. ... */ };
     handlers.mouseover = (event, d) => { /*...*/ }; handlers.mouseout = (event, d) => { /*...*/ }; handlers.click = (event, d) => { /*...*/ };

    // --- Draw Elements ---
    try {
        console.log("[ArcDiagram Hook] Calling drawAndUpdateArcs/Nodes...");
        drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
        drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId);
        console.log("[ArcDiagram Hook] Drawing functions called successfully.");
    } catch (error) {
        console.error("[ArcDiagram Hook] Error during D3 drawing functions:", error);
    }


    // --- D3 Zoom Setup ---
    // ... (Zoom setup logic as before) ...
    const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); };
    if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom); }
    if (svgRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); } else { console.error("ArcDiagram: svgRef missing for zoom attach."); }

    // Cleanup
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Removed resetZoomTrigger dependency for now to simplify

  // --- Effect for Zoom Reset ---
   useEffect(() => {
     if (resetZoomTrigger > 0) {
         if (svgRef?.current && zoomBehaviorRef.current) {
             console.log("ArcDiagram: Resetting zoom via trigger", resetZoomTrigger);
             d3.select(svgRef.current).transition("resetZoom").duration(500)
               .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
         }
     }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [resetZoomTrigger, svgRef]); // Only depend on trigger and ref


  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;