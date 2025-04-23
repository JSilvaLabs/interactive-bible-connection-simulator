// components/ArcDiagram.js (MVP v8.2 - Logging INSIDE Helpers)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---
function setupScales(nodes, width, height, nodeRadius) { /* ... as before ... */ }
function calculateArcPath(d, yScale, axisXPosition) { /* ... as before ... */ }

// --- Updated drawAndUpdateArcs ---
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
    console.log(`[drawArcs] Received selection: ${selection.empty() ? 'EMPTY' : 'VALID'}, links: ${links?.length ?? 0}`); // Log input validity
    if (selection.empty() || !links || links.length === 0) return; // Don't proceed if container or data is bad

    const linkData = links; // Use links directly
    console.log('[drawArcs] Data being passed to .data():', linkData.slice(0, 5)); // Log first 5 links

    const joinedArcs = selection
        .selectAll("path.arc-path")
        .data(linkData, d => `${d.source}-${d.target}`) // Key function
        .join(
            enter => {
                console.log(`[drawArcs] Enter selection size: ${enter.size()}`); // Log enter size
                const path = enter.append("path")
                         .attr("class", "arc-path")
                         .attr("fill", "none")
                         .attr("stroke-width", 1.5) // DEBUG: Thicker
                         .attr("stroke-opacity", 0) // Start transparent
                         .attr("stroke", "blue") // DEBUG: Fixed color
                         .attr("d", d => calculateArcPath(d, yScale, axisXPosition)); // Calculate path

                 // Add logging inside attribute setting if needed
                 // path.each(function(d) { console.log(`[drawArcs] Setting path d for ${d.source}->${d.target}: ${d3.select(this).attr('d')}`); });

                 path.transition("fadeIn").duration(300).attr("stroke-opacity", 0.6); // Fade in
                 path.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`);
                 return path; // Return the entering selection
            },
            update => {
                 console.log(`[drawArcs] Update selection size: ${update.size()}`); // Log update size
                 update.transition("arcUpdate").duration(150) // Transition updates
                       .attr("stroke", "orange") // DEBUG: Update color
                       .attr("d", d => calculateArcPath(d, yScale, axisXPosition)); // Recalculate path
                 return update; // Return the updating selection
            },
            exit => {
                 console.log(`[drawArcs] Exit selection size: ${exit.size()}`); // Log exit size
                 exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove(); // Fade out
                 return exit; // Return the exiting selection
            }
        );
     console.log(`[drawArcs] Final joined arcs selection size: ${joinedArcs.size()}`); // Log overall joined size
}

// --- Updated drawAndUpdateNodes ---
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId) {
    console.log(`[drawNodes] Received selection: ${selection.empty() ? 'EMPTY' : 'VALID'}, nodes: ${nodes?.length ?? 0}`);
    if (selection.empty() || !nodes || nodes.length === 0) return;

    const nodeData = nodes;
    console.log('[drawNodes] Data being passed to .data():', nodeData.slice(0, 5)); // Log first 5 nodes

    const joinedNodes = selection
        .selectAll("g.node-group")
        .data(nodeData, d => d.id) // Key nodes by ID
        .join(
            enter => {
                console.log(`[drawNodes] Enter selection size: ${enter.size()}`);
                const g = enter.append("g") /* ... setup as before ... */ .style("opacity",0).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                g.append("circle").attr("r", nodeRadius).attr("cx", 0).attr("cy", 0).attr("fill", "red").style("fill-opacity", 1).style("stroke", "black").style("stroke-width", 1).append("title").text(d => d.label); // Debug styles
                g.append("text").attr("class", "node-label").attr("fill", "black").style("font-size", labelFontSize).attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none").attr("display", showLabels ? null : "none").text(d => d.label);
                g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                g.transition("fadeIn").duration(300).style("opacity", 1);
                return g;
            },
            update => {
                console.log(`[drawNodes] Update selection size: ${update.size()}`);
                update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                update.select("circle").transition("updateCircle").duration(150).attr("r", nodeRadius).attr("fill", "purple"); // Debug update color
                update.select("circle title").text(d => d.label);
                update.select("text.node-label").attr("display", showLabels ? null : "none").style("font-size", labelFontSize).attr("x", labelXOffset).text(d => d.label); // Update label
                return update;
            },
            exit => {
                 console.log(`[drawNodes] Exit selection size: ${exit.size()}`);
                 exit.transition("fadeOut").duration(200).style("opacity", 0).remove();
                 return exit;
            }
        );
    console.log(`[drawNodes] Final joined nodes selection size: ${joinedNodes.size()}`);
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
    if (!data || !data.nodes || !data.nodes.length === 0 || !width || width <= 10 || !height || height <= 50) {
        console.log("[ArcDiagram Hook] Invalid data or dimensions, clearing."); zoomGroup.selectAll("*").remove(); return;
    }
    // console.log(`[ArcDiagram Hook] Rendering: ${data.nodes.length} nodes, ${data.links.length} links. Dims: ${width}x${height}`);

    // --- Build Node Map & Params ---
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    // ... (adaptive parameter calculations: nodeRadius, showLabels, etc.) ...
    const nodeRadius = /*...*/ 8; const labelFontSize = /*...*/ '12px'; const labelXOffset = -(nodeRadius + 7); const showLabels = width > 90; const axisXPosition = 0;

    // --- Setup Scales ---
    const scales = setupScales(data.nodes, width, height, nodeRadius);
    // console.log("[ArcDiagram Hook] Result from setupScales:", scales);
    if (typeof scales === 'undefined' || scales === null || typeof scales.yScale === 'undefined') { console.error("[ArcDiagram Hook] FATAL: setupScales returned invalid result. Scales:", scales); return; }
    const { yScale, colorScale } = scales;

    // --- Prepare Containers ---
    const arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
     const handlers = { /* ... Simplified handlers or full handlers ... */
         mouseover: (event, d) => { if (onNodeHoverStart) onNodeHoverStart(d.id); d3.select(event.currentTarget).select('circle').attr('r', nodeRadius + 3); },
         mouseout: (event, d) => { if (onNodeHoverEnd) onNodeHoverEnd(); d3.select(event.currentTarget).select('circle').attr('r', nodeRadius); },
         click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };

    // --- Draw Elements using Helpers ---
    try {
        // console.log("[ArcDiagram Hook] Calling drawAndUpdateArcs/Nodes...");
        drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
        drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId);
        // console.log("[ArcDiagram Hook] Drawing functions called successfully.");
    } catch (error) { console.error("[ArcDiagram Hook] Error during D3 drawing functions:", error); }

    // --- D3 Zoom Setup ---
    // ... (Zoom setup logic as before) ...
     const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); }; if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom); } if (svgRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); } else { console.error("ArcDiagram: svgRef missing for zoom attach."); }

    // Cleanup
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Dependencies

  // --- Effect for Zoom Reset ---
   useEffect(() => { /* ... (Zoom reset logic as before) ... */ }, [resetZoomTrigger, svgRef]);

  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;