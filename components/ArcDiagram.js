// components/ArcDiagram.js (MVP v8.2 - Debugging Visibility)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---
function setupScales(nodes, width, height, nodeRadius) {
    if (!nodes || nodes.length === 0 || !width || width <= 0 || !height || height <= 0 || !nodeRadius || nodeRadius <= 0) { return { yScale: d3.scalePoint(), colorScale: d3.scaleOrdinal(), axisXPosition: 0 }; }
    try {
        const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4))));
        const yScale = d3.scalePoint().domain(nodes.map(d => d.id)).range([0, height]).padding(padding);
        const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
        const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10).domain(bookNames);
        const axisXPosition = 0;
        return { yScale, colorScale, axisXPosition };
    } catch (error) { console.error("[setupScales] Error:", error); return { yScale: d3.scalePoint(), colorScale: d3.scaleOrdinal(), axisXPosition: 0 }; }
}

function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source); const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) { console.warn(`[calcArcPath] Skip: Undefined y for ${d.source} (${y1}) or ${d.target} (${y2})`); return null; }
    const radius = Math.abs(y2 - y1) / 2; if (radius <= 0) { /* console.warn(`[calcArcPath] Skip: Zero radius for ${d.source}->${d.target}`); */ return null; }
    const sweepFlag = y1 < y2 ? 1 : 0;
    const pathData = `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
    // if (Math.random() < 0.05) console.log(`[calcArcPath] ${d.source}->${d.target}: ${pathData}`); // Log sample paths
    return pathData;
}

// Draws/Updates the arcs using the .join() pattern - Added Debug Styling
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
    console.log(`[drawArcs] Attempting to draw ${links?.length ?? 0} links.`);
    const joinedArcs = selection
        .attr("fill", "none") // Crucial for arcs
        // --- DEBUG STYLING ---
        .attr("stroke-opacity", 1) // Make visible
        .attr("stroke-width", 1.5) // Make thicker
        // --- END DEBUG ---
        .selectAll("path.arc-path")
        .data(links, d => `${d.source}-${d.target}`)
        .join(
            enter => enter.append("path")
                         .attr("class", "arc-path")
                         .attr("stroke", "blue") // TEMPORARY DEBUG COLOR
                         .attr("d", d => calculateArcPath(d, yScale, axisXPosition)) // Calculate path
                         .call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)), // Tooltip
            update => update // Update existing arcs
                         .attr("stroke", "orange") // TEMPORARY DEBUG COLOR FOR UPDATES
                         .attr("d", d => calculateArcPath(d, yScale, axisXPosition)), // Recalculate path
            exit => exit.remove() // Remove old arcs directly for now
        );
     console.log(`[drawArcs] Joined arcs selection size: ${joinedArcs.size()}`);
}

// Draws/Updates the nodes using the .join() pattern - Added Debug Styling
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId) {
    console.log(`[drawNodes] Attempting to draw ${nodes?.length ?? 0} nodes.`);
    const joinedNodes = selection
        .selectAll("g.node-group")
        .data(nodes, d => d.id)
        .join(
            enter => { // Create new node groups
                const g = enter.append("g")
                    .attr("class", "node-group")
                    .attr("cursor", "pointer")
                    .attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);

                // Add circle - TEMPORARY DEBUG STYLING
                g.append("circle")
                    .attr("r", nodeRadius)
                    .attr("cx", 0).attr("cy", 0)
                    .attr("fill", "red") // DEBUG
                    .style("fill-opacity", 1) // DEBUG
                    .style("stroke", "black") // DEBUG
                    .style("stroke-width", 1) // DEBUG
                    .append("title").text(d => d.label);

                // Add text element (visibility controlled by display attribute)
                g.append("text")
                    .attr("class", "node-label") // Basic class
                    .attr("fill", "black") // DEBUG
                    .style("font-size", labelFontSize)
                    .attr("x", labelXOffset)
                    .attr("dy", "0.35em").attr("text-anchor", "end")
                    .style("pointer-events", "none")
                    .attr("display", showLabels ? null : "none")
                    .text(d => d.label);

                 g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                 return g;
            },
            update => { // Update existing node groups
                update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                update.select("circle") // Update circle
                      .transition("updateCircle").duration(150)
                      .attr("r", nodeRadius)
                      .attr("fill", "purple"); // TEMPORARY DEBUG UPDATE COLOR
                update.select("circle title").text(d => d.label);
                 // Update label
                 const labelUpdate = update.selectAll("text.node-label").data(d => showLabels ? [d] : []);
                 labelUpdate.enter().append("text").attr("class", "node-label ...").style("pointer-events", "none").attr("dy", "0.35em").attr("text-anchor", "end");
                 labelUpdate.merge(labelUpdate.enter()).attr("display", showLabels ? null : "none").style("font-size", labelFontSize).attr("x", labelXOffset).text(d => d.label);
                 labelUpdate.exit().remove();
                 return update;
            },
            exit => exit.remove() // Remove old nodes directly
        );
    console.log(`[drawNodes] Joined nodes selection size: ${joinedNodes.size()}`);
}

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
    console.log(`[ArcDiagram Hook] Rendering: ${data.nodes.length} nodes, ${data.links.length} links. Dims: ${width}x${height}`);

    // Clear previous content before drawing
    zoomGroup.selectAll("*").remove();

    // --- Build Node Map & Params ---
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    const nodeCount = data.nodes.length; const minLabelWidthThreshold = 90; const maxNodesForLabels = 120; const nodeDensityThreshold = 0.25; const calculatedNodeDensity = nodeCount / height; const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold; const isDense = calculatedNodeDensity > 0.18; const nodeRadius = height < 350 ? 6 : (isDense ? 7 : 8); const hoverRadiusIncrease = 3; const labelFontSize = height < 350 ? '10px' : (isDense ? '11px' : '12px'); const labelXOffset = -(nodeRadius + 7);

    // --- Setup Scales ---
    const scales = setupScales(data.nodes, width, height, nodeRadius);
    console.log("[ArcDiagram Hook] Result from setupScales:", scales);
    if (typeof scales === 'undefined' || scales === null || typeof scales.yScale === 'undefined') {
        console.error("[ArcDiagram Hook] FATAL: setupScales returned invalid result. Scales:", scales); return;
    }
    const { yScale, colorScale, axisXPosition } = scales;

    // --- Prepare Containers ---
    const arcsContainer = zoomGroup.append("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.append("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
     const handlers = { /* ... handlers using nodeRadius, hoverRadiusIncrease, arcsContainer etc ... */
          mouseover: (event, d) => { if (onNodeHoverStart) onNodeHoverStart(d.id); d3.select(event.currentTarget).select('circle').attr('r', nodeRadius + hoverRadiusIncrease); /* Simple hover */ },
          mouseout: (event, d) => { if (onNodeHoverEnd) onNodeHoverEnd(); d3.select(event.currentTarget).select('circle').attr('r', nodeRadius); /* Simple reset */ },
          click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
      };
     // --- Simplified handlers for initial debugging ---

    // --- Draw Elements using Helpers ---
    try {
        console.log("[ArcDiagram Hook] Calling drawAndUpdateArcs/Nodes...");
        drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
        drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId);
        console.log("[ArcDiagram Hook] Drawing functions potentially finished.");
    } catch (error) { console.error("[ArcDiagram Hook] Error during D3 drawing functions:", error); }

    // --- D3 Zoom Setup ---
    // ... (Keep zoom setup logic as before, ensure it's attached to svgRef.current) ...
    const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); };
    if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom); }
    if (svgRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); }

    // Cleanup
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Main dependencies


  // --- Effect for Zoom Reset ---
   useEffect(() => { /* ... (Zoom reset logic as before) ... */
     if (resetZoomTrigger > 0) { if (svgRef?.current && zoomBehaviorRef.current) { d3.select(svgRef.current).transition("resetZoom").duration(500).call(zoomBehaviorRef.current.transform, d3.zoomIdentity); } }
   }, [resetZoomTrigger, svgRef]); // Dependencies for reset effect


  // Return the group element D3 will manage
  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;