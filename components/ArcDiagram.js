// components/ArcDiagram.js (MVP v8.1 Update - Implement Zoom Reset)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions (Assume defined as before) ---
function setupScales(nodes, width, height, nodeRadius) { /* ... */
    const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4)))); const yScale = d3.scalePoint().domain(nodes.map(d => d.id)).range([0, height]).padding(padding); const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown'))); const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10).domain(bookNames); const axisXPosition = 0; return { yScale, colorScale, axisXPosition };
}
function calculateArcPath(d, yScale, axisXPosition) { /* ... */
     const y1 = yScale(d.source); const y2 = yScale(d.target); if (y1 === undefined || y2 === undefined) return null; const radius = Math.abs(y2 - y1) / 2; if (radius <= 0) return null; const sweepFlag = y1 < y2 ? 1 : 0; return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) { /* ... .join() logic ... */
     selection.selectAll("path.arc-path").data(links, d => `${d.source}-${d.target}`).join( enter => enter.append("path").attr("class", "arc-path").attr("fill", "none").attr("stroke-width", 1).attr("stroke-opacity", 0).attr("stroke", d => { const sourceNode = nodeMap.get(d.source); return colorScale(sourceNode?.book || 'Unknown'); }).attr("d", d => calculateArcPath(d, yScale, axisXPosition)).call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.6)).call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)), update => update.call(update => update.transition("arcUpdate").duration(150).attr("stroke", d => colorScale(nodeMap.get(d.source)?.book || 'Unknown')).attr("d", d => calculateArcPath(d, yScale, axisXPosition))), exit => exit.call(exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove()) );
}
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers) { /* ... .join() logic ... */
    selection.selectAll("g.node-group").data(nodes, d => d.id).join( enter => { const g = enter.append("g").attr("class", "node-group").attr("cursor", "pointer").style("opacity", 0).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`); g.append("circle").attr("r", nodeRadius).attr("cx",0).attr("cy",0).attr("fill", d => colorScale(d.book || 'Unknown')).style("fill-opacity", 0.7).style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)).style("stroke-width", 0.5).append("title").text(d => d.label); if (showLabels) { g.append("text").attr("class", "node-label ...").style("font-size", labelFontSize).attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none").text(d => d.label); } g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click); g.transition("fadeIn").duration(300).style("opacity", 1); return g; }, update => { update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`); update.select("circle").transition("updateCircle").duration(150).attr("r", nodeRadius).attr("fill", d => colorScale(d.book || 'Unknown')).style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)); update.select("circle title").text(d => d.label); const labelSelection = update.selectAll("text.node-label").data(d => showLabels ? [d] : []); labelSelection.enter().append("text").attr("class", "node-label ...").style("pointer-events", "none").attr("dy", "0.35em").attr("text-anchor", "end"); labelSelection.merge(labelSelection.enter()).style("font-size", labelFontSize).attr("x", labelXOffset).text(d => d.label); labelSelection.exit().remove(); return update; }, exit => exit.transition("fadeOut").duration(200).style("opacity", 0).remove() );
}


// --- Main Component ---
function ArcDiagram({
    svgRef, // Ref for the parent SVG element
    data,
    width,
    height,
    onNodeSelect,
    onNodeHoverStart,
    onNodeHoverEnd,
    resetZoomTrigger // <<< New prop for reset
}) {
  const zoomGroupRef = useRef(); // Ref for the <g> element to be zoomed/panned
  const nodeMap = useRef(new Map()).current;
  const zoomBehaviorRef = useRef(); // Ref to store the zoom behavior instance

  // --- Main Rendering Effect ---
  useEffect(() => {
    if (!svgRef?.current || !zoomGroupRef?.current) { return; } // Wait for refs
    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    zoomGroup.selectAll("*").remove(); // Clear previous content

    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) { return; }

    // (Build nodeMap, calculate adaptive parameters, setup scales - code omitted for brevity)
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    const nodeCount = data.nodes.length; const minLabelWidthThreshold = 90; const maxNodesForLabels = 120; const nodeDensityThreshold = 0.25; const calculatedNodeDensity = nodeCount / height; const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold; const isDense = calculatedNodeDensity > 0.18; const nodeRadius = height < 350 ? 6 : (isDense ? 7 : 8); const hoverRadiusIncrease = 3; const labelFontSize = height < 350 ? '10px' : (isDense ? '11px' : '12px'); const labelXOffset = -(nodeRadius + 7);
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

    // Prepare containers
    let arcsContainer = zoomGroup.select("g.arcs-container"); if (arcsContainer.empty()) arcsContainer = zoomGroup.append("g").attr("class", "arcs-container");
    let nodesContainer = zoomGroup.select("g.nodes-container"); if (nodesContainer.empty()) nodesContainer = zoomGroup.append("g").attr("class", "nodes-container");

    // Define handlers
     const handlers = {
        mouseover: (event, d) => { /* ... */ },
        mouseout: (event, d) => { /* ... */ },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };
      // Re-implement mouseover/out handlers from previous version here...
      handlers.mouseover = (event, d) => { if (onNodeHoverStart) onNodeHoverStart(d.id); const currentTarget = d3.select(event.currentTarget); currentTarget.select('circle').transition("hover").duration(100).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1); arcsContainer.selectAll('path.arc-path').transition("hover").duration(100).style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05).style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5); };
      handlers.mouseout = (event, d) => { if (onNodeHoverEnd) onNodeHoverEnd(); const currentTarget = d3.select(event.currentTarget); currentTarget.select('circle').transition("hoverEnd").duration(100).attr('r', nodeRadius).style('fill-opacity', 0.7); arcsContainer.selectAll('path.arc-path').transition("hoverEnd").duration(100).style('stroke-opacity', 0.6).style('stroke-width', 1); };


    // Draw elements
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers);

    // --- D3 Zoom Setup ---
    const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); };
    if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom); }
    if (svgRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); }
    else { console.error("ArcDiagram: svgRef missing for zoom attach."); }

    // Cleanup zoom listener on effect re-run or unmount
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Main render dependencies

  // --- Effect for Zoom Reset ---
  useEffect(() => {
    // Check if trigger is valid (changed and > 0) and refs/behavior are ready
    if (resetZoomTrigger > 0 && svgRef?.current && zoomBehaviorRef.current) {
        console.log("ArcDiagram: Resetting zoom via trigger", resetZoomTrigger);
        d3.select(svgRef.current)
          .transition("resetZoom").duration(500) // Smooth transition
          .call(zoomBehaviorRef.current.transform, d3.zoomIdentity); // Reset to identity transform
    }
    // Dependency on resetZoomTrigger will cause this effect to run when the key increments
  }, [resetZoomTrigger, svgRef]); // Dependencies for reset effect

  // Return the group element to be transformed by zoom
  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;