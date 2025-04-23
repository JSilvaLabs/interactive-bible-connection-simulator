// components/ArcDiagram.js (MVP v8.2 - Fix setupScales Return)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---

// Calculates scales based on current data and dimensions
// Ensures it always returns a valid scales object structure.
function setupScales(nodes, width, height, nodeRadius) {
    const logPrefix = "[setupScales]";
    // console.log(`${logPrefix} Called with: nodes=${nodes?.length}, width=${width}, height=${height}, nodeRadius=${nodeRadius}`);
    const defaultReturn = { yScale: d3.scalePoint(), colorScale: d3.scaleOrdinal(), axisXPosition: 0 }; // Define default/empty scales

    // Validate inputs before proceeding
    if (!nodes || nodes.length === 0 || !width || width <= 0 || !height || height <= 0 || !nodeRadius || nodeRadius <= 0) {
        console.error(`${logPrefix} Invalid parameters received. Returning default scales.`);
        return defaultReturn;
    }
    try {
        // Calculate padding based on density
        const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4))));

        // Create Y Scale
        const yScale = d3.scalePoint()
            .domain(nodes.map(d => d.id)) // Domain MUST be non-empty here due to earlier check
            .range([0, height])
            .padding(padding);

        // Check if yScale seems valid (basic check)
        if (typeof yScale.bandwidth !== 'function') {
             console.error(`${logPrefix} yScale creation failed or returned invalid object. Domain:`, nodes.map(d => d.id));
             return defaultReturn;
        }

        // Create Color Scale
        const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
        const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                            .domain(bookNames);

        const axisXPosition = 0;
        // console.log(`${logPrefix} Scales calculated successfully.`);
        return { yScale, colorScale, axisXPosition }; // Return calculated object

    } catch (error) {
        console.error(`${logPrefix} Error during scale calculation:`, error);
        return defaultReturn; // Return default object on unexpected error
    }
}

// Calculates the SVG path data for an arc
function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source); const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) return null;
    const radius = Math.abs(y2 - y1) / 2; if (radius <= 0) return null;
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

// Draws/Updates the arcs using the .join() pattern
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
    // console.log(`[drawArcs] Drawing ${links?.length ?? 0} links.`);
    const joinedArcs = selection
        .attr("fill", "none").attr("stroke-opacity", 0.6).attr("stroke-width", 1)
        .selectAll("path.arc-path")
        .data(links, d => `${d.source}-${d.target}`)
        .join(
            enter => enter.append("path").attr("class", "arc-path").attr("stroke-opacity", 0).attr("stroke", d => { const sourceNode = nodeMap.get(d.source); return colorScale(sourceNode?.book || 'Unknown'); }).attr("d", d => calculateArcPath(d, yScale, axisXPosition)).call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.6)).call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)),
            update => update.call(update => update.transition("arcUpdate").duration(150).attr("stroke", d => colorScale(nodeMap.get(d.source)?.book || 'Unknown')).attr("d", d => calculateArcPath(d, yScale, axisXPosition))),
            exit => exit.call(exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove())
        );
     // console.log(`[drawArcs] Joined arcs selection size: ${joinedArcs.size()}`);
}

// Draws/Updates the nodes using the .join() pattern
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId) {
    // console.log(`[drawNodes] Drawing ${nodes?.length ?? 0} nodes.`);
     const joinedNodes = selection
        .selectAll("g.node-group")
        .data(nodes, d => d.id)
        .join(
            enter => {
                const g = enter.append("g").attr("class", "node-group").attr("cursor", "pointer").style("opacity", 0).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                g.append("circle").attr("r", nodeRadius).attr("cx", 0).attr("cy", 0).attr("fill", d => colorScale(d.book || 'Unknown')).style("fill-opacity", d => d.id === selectedNodeId ? 0.9 : 0.7).style("stroke", d => d.id === selectedNodeId ? 'black' : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)).style("stroke-width", d => d.id === selectedNodeId ? 2.0 : 0.5).append("title").text(d => d.label); // Apply initial selected style
                g.append("text").attr("class", "node-label fill-current text-gray-700 dark:text-gray-300").style("font-size", labelFontSize).style("font-weight", d => d.id === selectedNodeId ? 'bold' : 'normal').attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none").attr("display", showLabels ? null : "none").text(d => d.label); // Apply initial selected style
                g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                g.transition("fadeIn").duration(300).style("opacity", 1);
                return g;
            },
            update => {
                update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                update.select("circle").transition("updateCircle").duration(150).attr("r", nodeRadius).attr("fill", d => colorScale(d.book || 'Unknown')).style("fill-opacity", d => d.id === selectedNodeId ? 0.9 : 0.7).style("stroke", d => d.id === selectedNodeId ? 'black' : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)).style("stroke-width", d => d.id === selectedNodeId ? 2.0 : 0.5); // Update styles based on selection
                update.select("circle title").text(d => d.label);
                const labelUpdate = update.selectAll("text.node-label").data(d => showLabels ? [d] : []); labelUpdate.enter().append("text").attr("class", "node-label ...").style("pointer-events", "none").attr("dy", "0.35em").attr("text-anchor", "end"); labelUpdate.merge(labelUpdate.enter()).attr("display", showLabels ? null : "none").transition("updateLabel").duration(150).style("font-size", labelFontSize).style("font-weight", d => d.id === selectedNodeId ? 'bold' : 'normal').attr("x", labelXOffset).text(d => d.label); labelUpdate.exit().remove(); // Update styles based on selection
                return update;
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
    if (!svgRef?.current || !zoomGroupRef?.current) return;
    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    if (!data || !data.nodes || data.nodes.length === 0 || !width || width <= 10 || !height || height <= 50) {
        zoomGroup.selectAll("*").remove(); return;
    }

    // --- Build Node Map & Params ---
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    const nodeCount = data.nodes.length; const minLabelWidthThreshold = 90; const maxNodesForLabels = 120; const nodeDensityThreshold = 0.25; const calculatedNodeDensity = nodeCount / height; const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold; const isDense = calculatedNodeDensity > 0.18; const nodeRadius = height < 350 ? 6 : (isDense ? 7 : 8); const hoverRadiusIncrease = 3; const labelFontSize = height < 350 ? '10px' : (isDense ? '11px' : '12px'); const labelXOffset = -(nodeRadius + 7);

    // --- Setup Scales ---
    const scales = setupScales(data.nodes, width, height, nodeRadius);
    // console.log("[ArcDiagram Hook] Result from setupScales:", scales); // Log only if debugging needed
    if (typeof scales === 'undefined' || scales === null || typeof scales.yScale?.domain !== 'function') { // Check if yScale is a valid scale
        console.error("[ArcDiagram Hook] FATAL: setupScales returned invalid result. Scales:", scales);
        zoomGroup.selectAll("*").remove(); // Clear potentially bad state
        return;
    }
    const { yScale, colorScale, axisXPosition } = scales;

    // --- Prepare Containers ---
    const arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
     const hoverTransitionDuration = 100;
     const handlers = {
        mouseover: (event, d) => {
            if (onNodeHoverStart) onNodeHoverStart(d.id);
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1);
            // currentTarget.select('text.node-label').style('font-weight', 'bold'); // Keep non-selected bold on hover for clarity
            arcsContainer.selectAll('path.arc-path')
                 .transition("hover").duration(hoverTransitionDuration)
                 .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                 .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
        },
        mouseout: (event, d) => {
            if (onNodeHoverEnd) onNodeHoverEnd();
            const currentTarget = d3.select(event.currentTarget);
            const isSelected = d.id === selectedNodeId;
            currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration)
                         .attr('r', nodeRadius) // Base radius
                         .style('fill-opacity', isSelected ? 0.9 : 0.7) // Selected or default opacity
                         .style('stroke-width', isSelected ? 2.0 : 0.5) // Selected or default stroke width
                         .style('stroke', isSelected ? 'black' : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)); // Selected or default stroke color
            currentTarget.select('text.node-label')
                         .style('font-weight', isSelected ? 'bold' : 'normal'); // Selected or default font weight
            arcsContainer.selectAll('path.arc-path')
                .transition("hoverEnd").duration(hoverTransitionDuration)
                .style('stroke-opacity', 0.6) // Restore base opacity
                .style('stroke-width', 1); // Restore base width
        },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };

    // --- Draw Elements ---
    try {
        // console.log("[ArcDiagram Hook] Calling drawAndUpdateArcs/Nodes...");
        drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
        drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId); // Pass selectedNodeId
        // console.log("[ArcDiagram Hook] Drawing functions called successfully.");
    } catch (error) { console.error("[ArcDiagram Hook] Error during D3 drawing functions:", error); }


    // --- D3 Zoom Setup ---
    const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); };
    if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom); }
    if (svgRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); }
    else { console.error("ArcDiagram: svgRef missing for zoom attach."); }

    // Cleanup zoom listener
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Main dependencies


  // --- Effect for Zoom Reset ---
   useEffect(() => {
     // Only run if the trigger key actually changes (and is > 0)
     if (resetZoomTrigger > 0) {
         if (svgRef?.current && zoomBehaviorRef.current) {
             console.log("ArcDiagram: Resetting zoom via trigger", resetZoomTrigger);
             d3.select(svgRef.current).transition("resetZoom").duration(500)
               .call(zoomBehaviorRef.current.transform, d3.zoomIdentity); // Reset transform
         }
     }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [resetZoomTrigger, svgRef]); // Dependencies for reset effect


  // Return the group element D3 will manage
  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;