// components/ArcDiagram.js (MVP v7.0 - Revised for Zoom & Ref Handling)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions (Assume defined as before) ---
function setupScales(nodes, width, height, nodeRadius) { /* ... */ }
function calculateArcPath(d, yScale, axisXPosition) { /* ... */ }
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) { /* ... */ }
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers) { /* ... */ }


// --- Main Component ---
function ArcDiagram({
    svgRef, // <<< Ref for the parent SVG element
    data,
    width,
    height,
    onNodeSelect,
    onNodeHoverStart,
    onNodeHoverEnd,
    // resetZoomTrigger // <<< Optional prop for reset
}) {
  // Ref for the main <g> element that holds nodes and arcs (this is what gets transformed)
  const zoomGroupRef = useRef();
  const nodeMap = useRef(new Map()).current;
  // Store zoom behavior instance in ref to access it in reset effect
  const zoomBehaviorRef = useRef();


  useEffect(() => {
    const zoomGroup = d3.select(zoomGroupRef.current); // The group to transform
    const rootSvg = d3.select(svgRef.current); // The SVG element to attach zoom listener

    // Clear only the content group, not the whole SVG
    zoomGroup.selectAll("*").remove();

    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
      return;
    }

    // --- Build Node Map ---
    nodeMap.clear();
    data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));

    // --- Determine Adaptive & Final Node Size Parameters ---
    const nodeCount = data.nodes.length;
    const minLabelWidthThreshold = 90; const maxNodesForLabels = 120;
    const nodeDensityThreshold = 0.25; const calculatedNodeDensity = nodeCount / height;
    const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold;
    const isDense = calculatedNodeDensity > 0.18;
    const nodeRadius = height < 350 ? 6 : (isDense ? 7 : 8); // Final larger nodes
    const hoverRadiusIncrease = 3;
    const labelFontSize = height < 350 ? '10px' : (isDense ? '11px' : '12px');
    const labelXOffset = -(nodeRadius + 7); // Final offset

    // --- Setup Scales ---
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

    // --- Prepare Containers within the Zoom Group ---
    let arcsContainer = zoomGroup.select("g.arcs-container");
    if (arcsContainer.empty()) arcsContainer = zoomGroup.append("g").attr("class", "arcs-container");
    let nodesContainer = zoomGroup.select("g.nodes-container");
    if (nodesContainer.empty()) nodesContainer = zoomGroup.append("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
     const hoverTransitionDuration = 100;
     const handlers = { /* ... mouseover, mouseout, click logic ... */
        mouseover: (event, d) => { if (onNodeHoverStart) onNodeHoverStart(d.id); const currentTarget = d3.select(event.currentTarget); currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1); arcsContainer.selectAll('path.arc-path').transition("hover").duration(hoverTransitionDuration).style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05).style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5); },
        mouseout: (event, d) => { if (onNodeHoverEnd) onNodeHoverEnd(); const currentTarget = d3.select(event.currentTarget); currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', 0.7); arcsContainer.selectAll('path.arc-path').transition("hoverEnd").duration(hoverTransitionDuration).style('stroke-opacity', 0.6).style('stroke-width', 1); },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };

    // --- Draw Elements using Helpers ---
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers);

    // --- D3 Zoom Setup ---
    const handleZoom = (event) => {
        zoomGroup.attr('transform', event.transform); // Apply transform to content group
    };

    // Store the behavior in a ref so reset effect can access the correct instance
    zoomBehaviorRef.current = d3.zoom()
        .scaleExtent([0.1, 10])
        .on('zoom', handleZoom);

    // Apply zoom behavior to the root SVG element referenced by the prop
    if (svgRef.current) {
        d3.select(svgRef.current)
          .call(zoomBehaviorRef.current)
          .on("dblclick.zoom", null); // Disable double-click zoom
    } else {
         console.error("ArcDiagram: svgRef not available to attach zoom.");
    }

    // Cleanup function for the main useEffect
    return () => {
        // Remove zoom listeners from the SVG element on cleanup
        if (svgRef.current) {
            d3.select(svgRef.current).on('.zoom', null);
        }
    };

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Add svgRef to dependencies

  // --- Optional Zoom Reset Effect ---
//   useEffect(() => {
//     if (resetZoomTrigger > 0) { // Check if trigger prop changed
//         if (svgRef.current && zoomBehaviorRef.current) {
//             d3.select(svgRef.current).transition().duration(500)
//               .call(zoomBehaviorRef.current.transform, d3.zoomIdentity); // Reset to default transform
//         }
//     }
//     // Add resetZoomTrigger to dependency array if using this effect
//   }, [resetZoomTrigger, svgRef]);

  // Return the group element D3 will populate (positioned by container's transform)
  // This group will be transformed by zoom.
  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;