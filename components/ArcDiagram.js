// components/ArcDiagram.js (MVP v8.2 - Restore Real Scales with Checks)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---

// Calculates scales based on current data and dimensions
// Ensures it always returns a valid scales object structure.
function setupScales(nodes, width, height, nodeRadius) {
    const logPrefix = "[setupScales]";
    // console.log(`${logPrefix} Called with: nodes=${nodes?.length}, width=${width}, height=${height}, nodeRadius=${nodeRadius}`);
    const defaultReturn = { yScale: d3.scalePoint(), colorScale: d3.scaleOrdinal(), axisXPosition: 0 };

    if (!nodes || nodes.length === 0 || !width || width <= 0 || !height || height <= 0 || !nodeRadius || nodeRadius <= 0) {
        console.error(`${logPrefix} Invalid parameters received. Returning default scales.`);
        return defaultReturn;
    }
    try {
        // --- REAL D3 CALCULATIONS ---
        const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4))));
        const nodeIds = nodes.map(d => d.id);
         if(nodeIds.length === 0) {
             console.error(`${logPrefix} Node ID list is empty. Returning default scales.`);
             return defaultReturn;
         }
        const yScale = d3.scalePoint().domain(nodeIds).range([0, height]).padding(padding);

        // Check if yScale seems valid
        if (typeof yScale?.bandwidth !== 'function') { // Check for a method specific to scalePoint
             console.error(`${logPrefix} yScale creation failed or returned invalid object. Domain used:`, nodeIds);
             return defaultReturn;
        }

        const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
        const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10).domain(bookNames);

        // Check if colorScale seems valid
        if (typeof colorScale !== 'function') {
            console.error(`${logPrefix} colorScale creation failed.`);
            return defaultReturn;
        }

        const axisXPosition = 0;
        // console.log(`${logPrefix} Scales calculated successfully.`);
        return { yScale, colorScale, axisXPosition };
        // --- END REAL D3 CALCULATIONS ---
    } catch (error) {
        console.error(`${logPrefix} Error during scale calculation:`, error);
        return defaultReturn; // Return default on unexpected error
    }
}


// Calculates the SVG path data for an arc
function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source); const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) { return null; }
    const radius = Math.abs(y2 - y1) / 2; if (radius <= 0) { return null; }
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

// Draws/Updates the arcs using the .join() pattern
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
    // console.log(`[drawArcs] Drawing ${links?.length ?? 0} links.`);
    const joinedArcs = selection
        .attr("fill", "none")
        .attr("stroke-opacity", 0.6) // Base opacity
        .attr("stroke-width", 1)   // Base width
        .selectAll("path.arc-path")
        .data(links, d => `${d.source}-${d.target}`)
        .join(
            enter => enter.append("path")
                         .attr("class", "arc-path")
                         .style("mix-blend-mode", "multiply") // Optional blending
                         .attr("stroke-opacity", 0) // Start transparent
                         .attr("stroke", d => { // Color by source book
                             const sourceNode = nodeMap.get(d.source);
                             return colorScale(sourceNode?.book || 'Unknown');
                         })
                         .attr("d", d => calculateArcPath(d, yScale, axisXPosition))
                         .call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.6)) // Fade in
                         .call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)), // Tooltip
            update => update
                         .call(update => update.transition("arcUpdate").duration(150)
                            .attr("stroke", d => colorScale(nodeMap.get(d.source)?.book || 'Unknown')) // Update color
                            .attr("d", d => calculateArcPath(d, yScale, axisXPosition))), // Update path
            exit => exit
                         .call(exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove()) // Fade out
        );
     // console.log(`[drawArcs] Joined arcs selection size: ${joinedArcs.size()}`);
}

// Draws/Updates the nodes using the .join() pattern
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId) {
    // console.log(`[drawNodes] Drawing ${nodes?.length ?? 0} nodes.`);
     // Define highlight styles using passed parameters
     const selectedStrokeWidth = 2.0;
     const defaultStrokeWidth = 0.5;
     const selectedStrokeColor = 'black';
     const selectedFontWeight = 'bold';
     const defaultFontWeight = 'normal';
     const selectedFillOpacity = 0.9;
     const defaultFillOpacity = 0.7;

     const joinedNodes = selection
        .selectAll("g.node-group")
        .data(nodes, d => d.id)
        .join(
            enter => {
                const g = enter.append("g").attr("class", "node-group").attr("cursor", "pointer").style("opacity", 0).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                // Apply initial styles including selected state
                g.append("circle").attr("r", nodeRadius).attr("cx", 0).attr("cy", 0).attr("fill", d => colorScale(d.book || 'Unknown')).style("fill-opacity", d => d.id === selectedNodeId ? selectedFillOpacity : defaultFillOpacity).style("stroke", d => d.id === selectedNodeId ? selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)).style("stroke-width", d => d.id === selectedNodeId ? selectedStrokeWidth : defaultStrokeWidth).append("title").text(d => d.label);
                g.append("text").attr("class", "node-label fill-current text-gray-700 dark:text-gray-300").style("font-size", labelFontSize).style("font-weight", d => d.id === selectedNodeId ? selectedFontWeight : defaultFontWeight).attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none").attr("display", showLabels ? null : "none").text(d => d.label);
                g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                g.transition("fadeIn").duration(300).style("opacity", 1); return g;
            },
            update => {
                update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                // Apply updates including selected state
                update.select("circle").transition("updateCircle").duration(150).attr("r", nodeRadius).attr("fill", d => colorScale(d.book || 'Unknown')).style("fill-opacity", d => d.id === selectedNodeId ? selectedFillOpacity : defaultFillOpacity).style("stroke", d => d.id === selectedNodeId ? selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)).style("stroke-width", d => d.id === selectedNodeId ? selectedStrokeWidth : defaultStrokeWidth);
                update.select("circle title").text(d => d.label);
                const labelUpdate = update.selectAll("text.node-label").data(d => showLabels ? [d] : []); labelUpdate.enter().append("text").attr("class", "node-label ...").style("pointer-events", "none").attr("dy", "0.35em").attr("text-anchor", "end"); labelUpdate.merge(labelUpdate.enter()).attr("display", showLabels ? null : "none").transition("updateLabel").duration(150).style("font-size", labelFontSize).style("font-weight", d => d.id === selectedNodeId ? selectedFontWeight : defaultFontWeight).attr("x", labelXOffset).text(d => d.label); labelUpdate.exit().remove(); return update;
            },
            exit => exit.transition("fadeOut").duration(200).style("opacity", 0).remove()
        );
    // console.log(`[drawNodes] Joined nodes selection size: ${joinedNodes.size()}`);
}


// --- Main Component ---
function ArcDiagram({ svgRef, data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, resetZoomTrigger }) {
  const zoomGroupRef = useRef();
  const nodeMap = useRef(new Map()).current;
  const zoomBehaviorRef = useRef();

  useEffect(() => {
    // --- Guard Clauses & Basic Setup ---
    if (!svgRef?.current || !zoomGroupRef?.current) { return; }
    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    if (!data || !data.nodes || data.nodes.length === 0 || !width || width <= 10 || !height || height <= 50) {
        zoomGroup.selectAll("*").remove(); return;
    }

    // --- Build Node Map & Params ---
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    const nodeCount = data.nodes.length; const minLabelWidthThreshold = 90; const maxNodesForLabels = 120; const nodeDensityThreshold = 0.25; const calculatedNodeDensity = nodeCount / height; const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold; const isDense = calculatedNodeDensity > 0.18; const nodeRadius = height < 350 ? 6 : (isDense ? 7 : 8); const hoverRadiusIncrease = 3; const labelFontSize = height < 350 ? '10px' : (isDense ? '11px' : '12px'); const labelXOffset = -(nodeRadius + 7);

    // --- Setup Scales (Using REAL calculations with checks) ---
    // console.log("[ArcDiagram Hook] Preparing to call setupScales...");
    const scales = setupScales(data.nodes, width, height, nodeRadius);
    // console.log("[ArcDiagram Hook] Result from setupScales:", scales);

    // --- CRITICAL CHECK ---
    if (typeof scales === 'undefined' || scales === null || typeof scales.yScale !== 'function' || typeof scales.colorScale !== 'function' || typeof scales.yScale.domain !== 'function') {
        console.error("[ArcDiagram Hook] FATAL: setupScales returned invalid result. Clearing diagram. Scales:", scales);
        zoomGroup.selectAll("*").remove(); // Clear group if scales are bad
        return;
    }
    // console.log("[ArcDiagram Hook] setupScales check passed.");
    const { yScale, colorScale, axisXPosition } = scales;

    // --- Prepare Containers ---
    const arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
    const selectedStrokeWidth = 2.0; const defaultStrokeWidth = 0.5; const selectedStrokeColor = 'black'; const selectedFontWeight = 'bold'; const defaultFontWeight = 'normal'; const selectedFillOpacity = 0.9; const defaultFillOpacity = 0.7;
    const hoverTransitionDuration = 100;
     const handlers = {
        mouseover: (event, d) => {
            if (onNodeHoverStart) onNodeHoverStart(d.id);
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1);
            arcsContainer.selectAll('path.arc-path').transition("hover").duration(hoverTransitionDuration).style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05).style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
        },
        mouseout: (event, d) => {
            if (onNodeHoverEnd) onNodeHoverEnd();
            const currentTarget = d3.select(event.currentTarget);
            const isSelected = d.id === selectedNodeId;
            currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', isSelected ? selectedFillOpacity : defaultFillOpacity).style('stroke-width', isSelected ? selectedStrokeWidth : defaultStrokeWidth).style('stroke', isSelected ? selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7));
            currentTarget.select('text.node-label').style('font-weight', isSelected ? selectedFontWeight : defaultFontWeight);
            arcsContainer.selectAll('path.arc-path').transition("hoverEnd").duration(hoverTransitionDuration).style('stroke-opacity', 0.6).style('stroke-width', 1);
        },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };

    // --- Draw Elements ---
    try {
        // console.log("[ArcDiagram Hook] Calling drawAndUpdateArcs/Nodes...");
        drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
        drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId);
        // console.log("[ArcDiagram Hook] Drawing functions called successfully.");
    } catch (error) { console.error("[ArcDiagram Hook] Error during D3 drawing functions:", error); }

    // --- D3 Zoom Setup ---
    const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); };
    if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom); }
    if (svgRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); }
    else { console.error("ArcDiagram: svgRef missing for zoom attach."); }

    // Cleanup
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Main dependencies


  // --- Effect for Zoom Reset ---
   useEffect(() => {
     if (resetZoomTrigger > 0) {
         if (svgRef?.current && zoomBehaviorRef.current) {
             // console.log("ArcDiagram: Resetting zoom via trigger", resetZoomTrigger);
             d3.select(svgRef.current).transition("resetZoom").duration(500)
               .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
         }
     }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [resetZoomTrigger, svgRef]); // Dependencies for reset effect


  // Return the group element D3 will manage
  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;