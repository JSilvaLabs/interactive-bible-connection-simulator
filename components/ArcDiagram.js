// components/ArcDiagram.js (MVP v9.0 - Refactored Structure)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---

function setupScales(nodes, width, height, nodeRadius) {
    // console.log(`[setupScales] Called with: nodes=${nodes?.length}, width=${width}, height=${height}, nodeRadius=${nodeRadius}`);
    const defaultReturn = { yScale: d3.scalePoint(), colorScale: d3.scaleOrdinal(), axisXPosition: 0 };
    if (!nodes || nodes.length === 0 || !width || width <= 0 || !height || height <= 0 || !nodeRadius || nodeRadius <= 0) { console.error("[setupScales] Invalid parameters."); return defaultReturn; }
    try {
        const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4))));
        const nodeIds = nodes.map(d => d.id); if(nodeIds.length === 0) return defaultReturn;
        const yScale = d3.scalePoint().domain(nodeIds).range([0, height]).padding(padding);
        if (typeof yScale?.bandwidth !== 'function') { console.error("[setupScales] yScale creation failed."); return defaultReturn; }
        const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
        const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10).domain(bookNames);
        if (typeof colorScale !== 'function') { console.error("[setupScales] colorScale creation failed."); return defaultReturn; }
        const axisXPosition = 0;
        return { yScale, colorScale, axisXPosition };
    } catch (error) { console.error("[setupScales] Error:", error); return defaultReturn; }
}

function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source); const y2 = yScale(d.target); if (y1 === undefined || y2 === undefined) return null;
    const radius = Math.abs(y2 - y1) / 2; if (radius <= 0) return null;
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

// Refactored drawAndUpdateArcs using .join()
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
    // console.log(`[drawArcs] Updating with ${links?.length ?? 0} links.`);
    // OPTIMIZATION POINT: If links.length is very large, consider filtering/sampling here
    // const linksToDraw = links.length > 500 ? links.slice(0, 500) : links; // Example: limit arcs
    const linksToDraw = links; // Draw all for now

    const paths = selection
        .selectAll("path.arc-path")
        .data(linksToDraw, d => `${d.source}-${d.target}`); // Key function

    paths.join(
        enter => enter.append("path")
                     .attr("class", "arc-path")
                     .attr("fill", "none")
                     .attr("stroke-width", 1)
                     .attr("stroke-opacity", 0) // Start hidden
                     .attr("stroke", d => colorScale(nodeMap.get(d.source)?.book || 'Unknown')) // Color by source
                     .attr("d", d => calculateArcPath(d, yScale, axisXPosition))
                     .call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.6)) // Fade in
                     .call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)),
        update => update
                     .call(update => update.transition("arcUpdate").duration(150) // Transition updates
                        .attr("stroke", d => colorScale(nodeMap.get(d.source)?.book || 'Unknown'))
                        .attr("d", d => calculateArcPath(d, yScale, axisXPosition))),
        exit => exit
                     .call(exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove()) // Fade out
    );
    // console.log(`[drawArcs] Rendered ${paths.size()} arcs.`);
}

// Refactored drawAndUpdateNodes using .join()
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId) {
    // console.log(`[drawNodes] Updating with ${nodes?.length ?? 0} nodes.`);
    // Define highlight styles locally
    const selectedStrokeWidth = 2.0; const defaultStrokeWidth = 0.5; const selectedStrokeColor = 'black'; const selectedFontWeight = 'bold'; const defaultFontWeight = 'normal'; const selectedFillOpacity = 0.9; const defaultFillOpacity = 0.7;

     selection
        .selectAll("g.node-group")
        .data(nodes, d => d.id) // Key nodes by ID
        .join(
            enter => { // Create new node groups
                const g = enter.append("g").attr("class", "node-group").attr("cursor", "pointer").style("opacity", 0).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                // Apply initial styles based on selection
                g.append("circle").attr("r", nodeRadius).attr("cx", 0).attr("cy", 0).attr("fill", d => colorScale(d.book || 'Unknown')).style("fill-opacity", d => d.id === selectedNodeId ? selectedFillOpacity : defaultFillOpacity).style("stroke", d => d.id === selectedNodeId ? selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)).style("stroke-width", d => d.id === selectedNodeId ? selectedStrokeWidth : defaultStrokeWidth).append("title").text(d => d.label);
                g.append("text").attr("class", "node-label fill-current text-gray-700 dark:text-gray-300").style("font-size", labelFontSize).style("font-weight", d => d.id === selectedNodeId ? selectedFontWeight : defaultFontWeight).attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none").attr("display", showLabels ? null : "none").text(d => d.label);
                g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                g.transition("fadeIn").duration(300).style("opacity", 1); return g;
            },
            update => { // Update existing node groups
                update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                // Update styles based on selection
                update.select("circle").transition("updateCircle").duration(150).attr("r", nodeRadius).attr("fill", d => colorScale(d.book || 'Unknown')).style("fill-opacity", d => d.id === selectedNodeId ? selectedFillOpacity : defaultFillOpacity).style("stroke", d => d.id === selectedNodeId ? selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)).style("stroke-width", d => d.id === selectedNodeId ? selectedStrokeWidth : defaultStrokeWidth);
                update.select("circle title").text(d => d.label);
                // Update labels
                 const labelUpdate = update.selectAll("text.node-label").data(d => showLabels ? [d] : []); labelUpdate.enter().append("text").attr("class", "node-label ...").style("pointer-events", "none").attr("dy", "0.35em").attr("text-anchor", "end"); labelUpdate.merge(labelUpdate.enter()).attr("display", showLabels ? null : "none").transition("updateLabel").duration(150).style("font-size", labelFontSize).style("font-weight", d => d.id === selectedNodeId ? selectedFontWeight : defaultFontWeight).attr("x", labelXOffset).text(d => d.label); labelUpdate.exit().remove();
                 return update;
            },
            exit => exit.transition("fadeOut").duration(200).style("opacity", 0).remove()
        );
    // console.log(`[drawNodes] Rendered ${joinedNodes.size()} nodes.`);
}


// --- Main Component ---
function ArcDiagram({ svgRef, data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, resetZoomTrigger }) {
  const zoomGroupRef = useRef();
  const nodeMap = useRef(new Map()).current;
  const zoomBehaviorRef = useRef();

  useEffect(() => {
    // --- Guard Clauses & Basic Setup ---
    if (!svgRef?.current || !zoomGroupRef?.current) return;
    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    // Clear only if data is invalid, let .join() handle updates/exits otherwise
    if (!data || !data.nodes || data.nodes.length === 0 || !width || width <= 10 || !height || height <= 50) {
        zoomGroup.selectAll("*").remove(); return;
    }

    // --- Build Map, Params, Scales ---
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    const nodeRadius = /*...*/ 8; const labelFontSize = /*...*/ '12px'; const labelXOffset = -(nodeRadius + 7); const showLabels = /*...*/ true;
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

    // --- Prepare Containers (using .join pattern) ---
    const arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
     const hoverTransitionDuration = 100;
     const handlers = {
        mouseover: (event, d) => { /* ... Highlighting logic ... */ },
        mouseout: (event, d) => { /* ... Reset highlighting logic (checking selectedNodeId) ... */ },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };
     // Explicitly define handlers again for clarity or use previous definitions
      handlers.mouseover = (event, d) => { if (onNodeHoverStart) onNodeHoverStart(d.id); const currentTarget = d3.select(event.currentTarget); currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + 3).style('fill-opacity', 1); arcsContainer.selectAll('path.arc-path').transition("hover").duration(hoverTransitionDuration).style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05).style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5); };
      handlers.mouseout = (event, d) => { if (onNodeHoverEnd) onNodeHoverEnd(); const currentTarget = d3.select(event.currentTarget); const isSelected = d.id === selectedNodeId; currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', isSelected ? 0.9 : 0.7).style('stroke-width', isSelected ? 2.0 : 0.5).style('stroke', isSelected ? 'black' : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)); currentTarget.select('text.node-label').style('font-weight', isSelected ? 'bold' : 'normal'); arcsContainer.selectAll('path.arc-path').transition("hoverEnd").duration(hoverTransitionDuration).style('stroke-opacity', 0.6).style('stroke-width', 1); };

    // --- Draw Elements using Helpers ---
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId);

    // --- D3 Zoom Setup ---
    const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); };
    if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom); }
    if (svgRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); }

    // Cleanup
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Main dependencies

  // --- Effect for Zoom Reset ---
   useEffect(() => { /* ... (Zoom reset logic as before) ... */ }, [resetZoomTrigger, svgRef]);

  // Return the group element D3 will manage
  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;