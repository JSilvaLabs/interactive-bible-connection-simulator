// components/ArcDiagram.js (MVP v8.2 - Add Checks for setupScales)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---

// Added parameter validation
function setupScales(nodes, width, height, nodeRadius) {
    console.log(`[setupScales] Called with: nodes=${nodes?.length}, width=${width}, height=${height}, nodeRadius=${nodeRadius}`); // Log inputs
    // Validate inputs before proceeding
    if (!nodes || nodes.length === 0 || !width || width <= 0 || !height || height <= 0 || !nodeRadius || nodeRadius <= 0) {
        console.error("[setupScales] Invalid parameters received.");
        // Return default/empty scales to prevent crash, though diagram won't render correctly
        return {
             yScale: d3.scalePoint(), // Empty scale
             colorScale: d3.scaleOrdinal(), // Empty scale
             axisXPosition: 0
        };
    }

    const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4))));
    const yScale = d3.scalePoint()
      .domain(nodes.map(d => d.id))
      .range([0, height])
      .padding(padding);

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);
    const axisXPosition = 0;
    console.log("[setupScales] Scales calculated successfully.");
    return { yScale, colorScale, axisXPosition };
}

function calculateArcPath(d, yScale, axisXPosition) { /* ... (no changes needed here) ... */ }
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) { /* ... (no changes needed here) ... */ }
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId) { /* ... (no changes needed here) ... */ }


// --- Main Component ---
function ArcDiagram({ svgRef, data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, resetZoomTrigger }) {
  const zoomGroupRef = useRef();
  const nodeMap = useRef(new Map()).current;
  const zoomBehaviorRef = useRef();

  useEffect(() => {
    // --- Guard Clauses ---
    if (!svgRef?.current || !zoomGroupRef?.current) { return; }
    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    if (!data || !data.nodes || data.nodes.length === 0 || !width || width <= 10 || !height || height <= 50) {
        console.log("[ArcDiagram Hook] Invalid data or dimensions, clearing.");
        zoomGroup.selectAll("*").remove(); return;
    }
    console.log(`[ArcDiagram Hook] Rendering: ${data.nodes.length} nodes, ${data.links.length} links. Dims: ${width}x${height}`);

    // --- Build Node Map ---
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));

    // --- Determine Adaptive Parameters ---
    const nodeCount = data.nodes.length; const minLabelWidthThreshold = 90; const maxNodesForLabels = 120; const nodeDensityThreshold = 0.25; const calculatedNodeDensity = nodeCount / height; const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold; const isDense = calculatedNodeDensity > 0.18; const nodeRadius = height < 350 ? 6 : (isDense ? 7 : 8); const hoverRadiusIncrease = 3; const labelFontSize = height < 350 ? '10px' : (isDense ? '11px' : '12px'); const labelXOffset = -(nodeRadius + 7);

    // --- Setup Scales ---
    // Add check BEFORE destructuring
    if (!data.nodes || !width || !height || !nodeRadius) {
        console.error("[ArcDiagram Hook] Missing valid parameters before calling setupScales.");
        return; // Prevent calling setupScales with undefined values
    }
    const scales = setupScales(data.nodes, width, height, nodeRadius);
    // Check if scales object is valid before destructuring
    if (!scales || !scales.yScale) {
        console.error("[ArcDiagram Hook] setupScales returned invalid result. Cannot proceed.");
        return;
    }
    const { yScale, colorScale, axisXPosition } = scales; // Destructure ONLY if scales is valid

    // --- Prepare Containers ---
    let arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    let nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
    const handlers = { /* ... handlers using nodeRadius, hoverRadiusIncrease, arcsContainer etc ... */
        mouseover: (event, d) => { if (onNodeHoverStart) onNodeHoverStart(d.id); const currentTarget = d3.select(event.currentTarget); currentTarget.select('circle').transition("hover").duration(100).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1); arcsContainer.selectAll('path.arc-path').transition("hover").duration(100).style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05).style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5); },
        mouseout: (event, d) => { if (onNodeHoverEnd) onNodeHoverEnd(); const currentTarget = d3.select(event.currentTarget); const isSelected = d.id === selectedNodeId; currentTarget.select('circle').transition("hoverEnd").duration(100).attr('r', nodeRadius).style('fill-opacity', isSelected ? 0.9 : 0.7).style('stroke-width', isSelected ? 2.0 : 0.5).style('stroke', isSelected ? 'black' : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)); currentTarget.select('text.node-label').style('font-weight', isSelected ? 'bold' : 'normal'); arcsContainer.selectAll('path.arc-path').transition("hoverEnd").duration(100).style('stroke-opacity', 0.6).style('stroke-width', 1); },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
    };

    // --- Draw Elements using Helpers ---
    // Pass selectedNodeId to drawAndUpdateNodes for styling
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId); // Pass selectedNodeId

    // --- D3 Zoom Setup ---
    const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); };
    if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom); }
    if (svgRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); }
    else { console.error("ArcDiagram: svgRef missing for zoom attach."); }

    // Cleanup zoom listener
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef, selectedNodeId]); // Include selectedNodeId dependency


  // --- Effect for Zoom Reset ---
   useEffect(() => {
     if (resetZoomTrigger > 0) {
         if (svgRef?.current && zoomBehaviorRef.current) {
             console.log("ArcDiagram: Resetting zoom via trigger", resetZoomTrigger);
             d3.select(svgRef.current).transition("resetZoom").duration(500)
               .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
         }
     }
   }, [resetZoomTrigger, svgRef]); // Dependencies


  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;