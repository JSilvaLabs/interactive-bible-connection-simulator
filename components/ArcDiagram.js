// components/ArcDiagram.js (MVP v8.2 - TEMPORARY DEBUG setupScales)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions --- for debugging the "Cannot destructure property 'yScale'" error.

**Remember:** This version will **not** render the diagram correctly because it uses dummy scales. Its only purpose is to check if the build process succeeds and if the `TypeError` disappears, helping to isolate the source of the original error.

---

**File: `components/ArcDiagram.js` (MVP v8.2 - Temporary Debugging `setupScales`)**

```javascript
// components/ArcDiagram.js (MVP v8.2 - Temporary Debugging setupScales)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---

// --- TEMPORARY DEBUGGING VERSION of setupScales ---
// This version bypasses D3 scale calculations to check if they

// --- TEMPORARY DEBUGGING VERSION of setupScales ---
// This version bypasses actual D3 scale creation to isolate the destructuring error.
// It will result in an incorrect visual layout but should prevent the TypeError if the issue is within D3 scale calculations.
function setupScales(nodes, width, height, nodeRadius) {
    const logPrefix = "[setupScales DEBUG]";
    console.log(`${logPrefix} Called with: nodes=${nodes?.length}, width=${width}, height=${height}, nodeRadius=${nodeRadius}`);
    const defaultReturn = {
         // Create minimal valid scales, using input domain/range if possible, otherwise defaults
         yScale: d3.scalePoint().domain(nodes?.map(d => d.id) ?? []).range([0, height ?? 100]).padding(0.5),
         colorScale: d3.scaleOrdinal().domain(['Unknown']).range(['#cccccc']),
         axisXPosition: 0
    };
    try {
        console.log(`${logPrefix} Bypassing D3 scale creation. Returning hardcoded defaults.`);
        // Check if inputs seem generally okay before returning default
        if (!nodes || nodes.length === 0 || !width were the source of the error.
// It will NOT produce a correct layout.
function setupScales(nodes, width, height, nodeRadius) {
    const logPrefix = "[setupScales DEBUG]";
    console.log(`${logPrefix} Called with: nodes=${nodes?.length}, width=${width}, height=${height}, nodeRadius=${nodeRadius}`);
    const defaultReturn = {
         // Create minimal valid scales, using input domain/range if possible to avoid downstream errors
         yScale: d3.scalePoint().domain(nodes?.map(d => d.id) ?? []).range([0, height ?? 100]).padding(0.5),
         colorScale: d3.scaleOrdinal().domain(['Unknown']).range(['#cccccc']),
         axisXPosition: 0
    };
    // Explicitly return the default object, bypassing complex calculations
    console.log(`${logPrefix} Bypassing D3 scale creation. Returning hardcoded defaults.`);
    return defaultReturn;
}
// --- END TEMPORARY DEBUGGING VERSION ---


// Calculates the SVG path data for an arc (uses output of setupScales)
function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source); const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) return null;
    const radius = Math.abs(y2 - y1) / 2; if (radius <= 0) return null;
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

// Draws/Updates the arcs using the .join() pattern
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
    // console.log(`[drawArcs] Drawing ${links?.length ?? 0} links.`); // Keep logs if needed
    const joinedArcs || width <= 0 || !height || height <= 0) {
             console.warn(`${logPrefix} Invalid parameters detected, returning defaults.`);
             return defaultReturn;
        }
        // Always return the default object in this debug version
        return defaultReturn;
    } catch (error) {
        console.error(`${logPrefix} Unexpected error even during bypass:`, error);
        return defaultReturn; // Ensure an object is always returned
    }
}
// --- END TEMPORARY DEBUGGING VERSION ---


// Original calculateArcPath - might return null frequently with dummy scale
function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source); const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) return null;
    const radius = Math.abs(y2 - y1) / 2; if (radius <= 0) return null;
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

// Original drawAndUpdateArcs - will use dummy scales
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
     const joinedArcs = selection
        .attr("fill", "none").attr("stroke-opacity", 0.6).attr("stroke-width", 1.5).attr("stroke", "blue") // Force blue stroke
        .selectAll("path.arc-path").data(links, d => `${d.source}-${d.target}`)
        .join(
            enter => enter.append("path").attr("class", "arc-path").attr("stroke-opacity", 0).attr("stroke", "blue").attr("d", d => calculateArcPath(d, yScale, axisXPosition)).call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.6)).call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)),
            update => update.call(update => update.transition("arcUpdate").duration(150).attr("stroke", "orange").attr("d", d => calculateArcPath(d, yScale, axisXPosition))),
            exit => exit.call(exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove())
        );
     console.log(`[drawArcs DEBUG] Joined arcs size: ${joinedArcs.size()}`); // Log size
}

// Original drawAndUpdateNodes - will use dummy scales
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId) {
     const joinedNodes = selection
        .selectAll("g.node-group").data(nodes, d => d.id)
        .join(
            enter => {
                const g = enter.append("g").attr("class", "node-group").attr("cursor", "pointer").style("opacity", 0).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                g.append("circle").attr("r", nodeRadius).attr("cx", 0).attr("cy", 0).attr("fill", "red").style("fill-opacity", 1).style("stroke", "black").style("stroke-width", 1).append("title").text(d => d.label); = selection
        .attr("fill", "none").attr("stroke-opacity", 0.6).attr("stroke-width", 1.5) // Use debug thickness
        .selectAll("path.arc-path")
        .data(links, d => `${d.source}-${d.target}`)
        .join(
            enter => enter.append("path").attr("class", "arc-path").attr("stroke-opacity", 0).attr("stroke", "blue") // Debug color
                         .attr("d", d => calculateArcPath(d, yScale, axisXPosition)).call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.6)).call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)),
            update => update.call(update => update.transition("arcUpdate").duration(150).attr("stroke", "orange").attr("d", d => calculateArcPath(d, yScale, axisXPosition))), // Debug color
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
                g.append("circle").attr("r", nodeRadius).attr("cx", 0).attr("cy", 0).attr("fill", "red").style("fill-opacity", 1).style("stroke", "black").style("stroke-width", 1).append("title").text(d => d.label); // Debug styles
                g.append("text").attr("class", "node-label").attr("fill", "black").style("font-size", labelFontSize).attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none").attr("display", showLabels ? null : "none").text(d => d.label);
                g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                g.transition("fadeIn").duration(300).style("opacity", 1); return g;
            },
            update => {
                update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                update.select("circle").transition("updateCircle").duration(150).attr("r", nodeRadius).attr("fill", "purple"); // Debug color
                update.select("circle title").text(d => d.label);
                 const labelUpdate = update.selectAll("text.node-label").data(d => showLabels ? [d] : []); labelUpdate.enter().append("text").attr("class", "node-label ...").style("pointer-events", "none").attr("dy", "0.35em").attr("text-anchor", "end"); labelUpdate.merge(labelUpdate.enter()).attr("display", showLabels ? null : "none").style("font-size", labelFontSize).attr("x", labelXOffset).text(d => d.label); labelUpdate.exit().remove();
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
    if (!svgRef?.current || !zoomGroupRef?.current) { console.log("ArcDiagram useEffect: Waiting for refs..."); return; }
    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    if (!data || !data.nodes || data.nodes.length === 0 || !width || width <= 10 || !height || height <= 50) {
        console.log("[ArcDiagram Hook] Invalid data or dimensions, clearing."); zoomGroup.selectAll("*").remove(); return;
    }
    // console.log(`[ArcDiagram Hook] Rendering: ${data.nodes.length} nodes, ${data.links.length} links. Dims: ${width}x${height}`);
    zoomGroup.selectAll("*").remove(); // Clear content group

    // --- Build Node Map & Params ---
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    const nodeRadius = 8; // Use fixed radius for debug
    const labelFontSize = '10px'; // Fixed size
    const labelXOffset = -(nodeRadius + 7);
    const showLabels = width > 90; // Basic visibility check

    // --- Setup Scales (USING DEBUG VERSION) ---
    console.log("[ArcDiagram Hook] Preparing to call DEBUG setupScales...");
    if (!data.nodes || !width || !height || !nodeRadius) { console.error("[ArcDiagram Hook] FATAL: Missing valid parameters BEFORE calling setupScales."); return; }
    const scales = setupScales(data.nodes, width, height, nodeRadius);
    console.log("[ArcDiagram Hook] Result from DEBUG setupScales:", scales); // Log the direct result

    // --- CRITICAL CHECK ---
    if (typeof scales === 'undefined' || scales === null || typeof scales.yScale !== 'function' || typeof scales.yScale.domain !== 'function') { // Check if yScale looks like a scale
        console.error("[ArcDiagram Hook] FATAL: setupScales returned undefined or invalid object. Scales:", scales); return;
    }
    console.log("[ArcDiagram Hook] setupScales check passed. // Force Red nodes
                g.append("text").attr("class", "node-label").attr("fill", "black").style("font-size", labelFontSize).attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none").attr("display", showLabels ? null : "none").text(d => d.label);
                g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                g.transition("fadeIn").duration(300).style("opacity", 1); return g;
            },
            update => {
                update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
                update.select("circle").transition("updateCircle").duration(150).attr("r", nodeRadius).attr("fill", "purple"); // Force Purple update
                update.select("circle title").text(d => d.label);
                update.select("text.node-label").attr("display", showLabels ? null : "none").style("font-size", labelFontSize).attr("x", labelXOffset).text(d => d.label); return update;
            },
            exit => exit.transition("fadeOut").duration(200).style("opacity", 0).remove()
        );
     console.log(`[drawNodes DEBUG] Joined nodes size: ${joinedNodes.size()}`); // Log size
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
    const nodeRadius = 8; // Use fixed large radius for debug
    const labelFontSize = '10px'; // Fixed size
    const labelXOffset = -(nodeRadius + 7);
    const showLabels = true; // Always try to show labels for debug

    // --- Setup Scales (Using Debug Version) ---
    console.log("[ArcDiagram Hook] Preparing to call DEBUG setupScales...");
    const scales = setupScales(data.nodes, width, height, nodeRadius); // Calls the debug version
    console.log("[ArcDiagram Hook] Result from DEBUG setupScales:", scales); // Log the result

    // --- CRITICAL CHECK ---
    if (typeof scales === 'undefined' || scales === null || typeof scales.yScale !== 'function' || typeof scales.colorScale !== 'function') { // Check scale validity
        console.error("[ArcDiagram Hook] FATAL: DEBUG setupScales returned invalid result. Scales:", scales);
        zoomGroup.selectAll("*").remove();
        return;
    }
    console.log("[ArcDiagram Hook] DEBUG setupScales check passed. Destructuring...");
    const { yScale, colorScale, axisXPosition } = scales;

    // --- Prepare Containers ---
    const arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
     const handlers = { /* Simplified handlers for debug if needed */
         mouseover: (event, d) Destructuring...");
    const { yScale, colorScale, axisXPosition } = scales; // Destructure only after validation

    // --- Prepare Containers ---
    const arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
    const handlers = { /* ... Simplified handlers for debugging if needed ... */
         mouseover: (event, d) => { if (onNodeHoverStart) onNodeHoverStart(d.id); d3.select(event.currentTarget).select('circle').attr('r', nodeRadius + 3); },
         mouseout: (event, d) => { if (onNodeHoverEnd) onNodeHoverEnd(); d3.select(event.currentTarget).select('circle').attr('r', nodeRadius); },
         click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };

    // --- Draw Elements using Helpers ---
    try {
        console.log("[ArcDiagram Hook] Calling drawAndUpdateArcs/Nodes...");
        drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
        drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId);
        console.log("[ArcDiagram Hook] Drawing functions potentially finished.");
    } catch (error) { console.error("[ArcDiagram Hook] Error during D3 drawing functions:", error); }

    // --- D3 Zoom Setup ---
    // ... (Keep zoom setup logic as before) ...
     const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); }; if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom); } if (svgRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); } else { console.error("ArcDiagram: svgRef missing for zoom attach."); }

    // Cleanup zoom listener
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Main dependencies


  // --- Effect for Zoom Reset ---
   useEffect(() => { /* ... (Zoom reset logic as before) ... */
     if (resetZoomTrigger > 0) { if (svgRef?.current && zoomBehaviorRef.current) { console.log("ArcDiagram: Resetting zoom via trigger", resetZoomTrigger); d3.select(svgRef.current).transition("resetZoom").duration(500).call(zoomBehaviorRef.current.transform, d3.zoomIdentity); } }
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [resetZoomTrigger, svgRef]); // Dependencies for reset effect


  // Return the group element D3 will manage
  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;