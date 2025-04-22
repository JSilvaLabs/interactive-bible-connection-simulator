// components/ArcDiagram.js (Add Logging & Checks)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions (Assume defined as before) ---
function setupScales(nodes, width, height, nodeRadius) {
    const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4))));
    const yScale = d3.scalePoint().domain(nodes.map(d => d.id)).range([0, height]).padding(padding);
    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10).domain(bookNames);
    const axisXPosition = 0;
    // console.log(`[setupScales] yScale domain size: ${yScale.domain().length}, range: [${yScale.range()[0]}, ${yScale.range()[1]}], step: ${yScale.step()}`);
    return { yScale, colorScale, axisXPosition };
}
function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source); const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) return null;
    const radius = Math.abs(y2 - y1) / 2; if (radius <= 0) return null;
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}
// --- End Helper Functions ---

// --- Main Component ---
function ArcDiagram({ svgRef, data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd }) {
  const zoomGroupRef = useRef();
  const nodeMap = useRef(new Map()).current;
  const zoomBehaviorRef = useRef();

  useEffect(() => {
    // --- Guard Clause: Ensure Refs and Dimensions are ready ---
    if (!svgRef?.current || !zoomGroupRef?.current) {
        console.log("ArcDiagram useEffect: Waiting for refs..."); return;
    }
     if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
        console.log("ArcDiagram useEffect: Invalid data or dimensions. Clearing.");
        d3.select(zoomGroupRef.current).selectAll("*").remove(); // Clear previous content
        return;
    }

    console.log(`[ArcDiagram] Rendering: ${data.nodes.length} nodes, ${data.links.length} links. Dims: ${width}x${height}`);

    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    // Clear previous content within the zoom group specifically
    zoomGroup.selectAll("*").remove();

    // --- Build Node Map ---
    nodeMap.clear();
    data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    // console.log("[ArcDiagram] Node Map Size:", nodeMap.size);

    // --- Determine Adaptive Parameters ---
    const nodeCount = data.nodes.length;
    const minLabelWidthThreshold = 90; const maxNodesForLabels = 120;
    const nodeDensityThreshold = 0.25; const calculatedNodeDensity = nodeCount / height;
    const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold;
    const isDense = calculatedNodeDensity > 0.18;
    const nodeRadius = height < 350 ? 6 : (isDense ? 7 : 8); // Larger nodes
    const hoverRadiusIncrease = 3;
    const labelFontSize = height < 350 ? '10px' : (isDense ? '11px' : '12px');
    const labelXOffset = -(nodeRadius + 7); // Adjust offset

    // --- Setup Scales ---
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

    // --- Prepare Containers within the Zoom Group ---
    const arcsContainer = zoomGroup.append("g").attr("class", "arcs-container")
        .attr("fill", "none") // Style container directly
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 1);
    const nodesContainer = zoomGroup.append("g").attr("class", "nodes-container");

    // --- Draw Arcs ---
    const arcPaths = arcsContainer.selectAll("path.arc-path")
        .data(data.links, d => `${d.source}-${d.target}`)
        .join("path")
            .attr("class", "arc-path")
            .attr("stroke", d => {
                 const sourceNode = nodeMap.get(d.source);
                 return colorScale(sourceNode?.book || 'Unknown');
             })
            .attr("d", d => calculateArcPath(d, yScale, axisXPosition)) // Calculate path
            .style("stroke-opacity", 0.6) // Ensure initial opacity
            .style("stroke-width", 1); // Ensure initial width

    arcPaths.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`);
    console.log(`[ArcDiagram] Rendered ${arcPaths.size()} arc paths.`); // Log how many paths were added

    // --- Draw Nodes ---
     const nodeGroups = nodesContainer.selectAll("g.node-group")
        .data(data.nodes, d => d.id)
        .join("g")
            .attr("class", "node-group")
            .attr("cursor", "pointer")
            .attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);

    nodeGroups.append("circle") // Add circle
        .attr("r", nodeRadius).attr("cx", 0).attr("cy", 0)
        .attr("fill", d => colorScale(d.book || 'Unknown'))
        .style("fill-opacity", 0.7)
        .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7))
        .style("stroke-width", 0.5)
        .append("title").text(d => d.label);

    nodeGroups.append("text") // Add text (visibility controlled by display)
        .filter(() => showLabels) // Only append if showLabels is true initially
        .attr("class", "node-label fill-current text-gray-700 dark:text-gray-300")
        .style("font-size", labelFontSize)
        .attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end")
        .style("pointer-events", "none")
        .text(d => d.label);

    console.log(`[ArcDiagram] Rendered ${nodeGroups.size()} node groups.`);

    // --- Define Event Handlers ---
    const hoverTransitionDuration = 100;
    const handlers = { /* ... Same handlers as before ... */
        mouseover: (event, d) => { if (onNodeHoverStart) onNodeHoverStart(d.id); const currentTarget = d3.select(event.currentTarget); currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1); arcsContainer.selectAll('path.arc-path').transition("hover").duration(hoverTransitionDuration).style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05).style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5); },
        mouseout: (event, d) => { if (onNodeHoverEnd) onNodeHoverEnd(); const currentTarget = d3.select(event.currentTarget); currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', 0.7); arcsContainer.selectAll('path.arc-path').transition("hoverEnd").duration(hoverTransitionDuration).style('stroke-opacity', 0.6).style('stroke-width', 1); },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
    };
    // Apply handlers AFTER nodes are created/updated
    nodeGroups.on("mouseover", handlers.mouseover)
              .on("mouseout", handlers.mouseout)
              .on("click", handlers.click);


    // --- D3 Zoom Setup ---
    const handleZoom = (event) => {
        zoomGroup.attr('transform', event.transform); // Apply transform
    };
    if (!zoomBehaviorRef.current) { // Initialize zoom behavior only once
        zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom);
    }
    if (svgRef.current) { // Attach zoom listener to parent SVG
        rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null);
        // console.log("[ArcDiagram] Zoom behavior attached.");
    } else { console.error("[ArcDiagram] svgRef missing for zoom."); }

    // Cleanup
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Ensure svgRef prop is in dependency array

  // Return the group element that holds all nodes and arcs, and gets transformed by zoom
  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;