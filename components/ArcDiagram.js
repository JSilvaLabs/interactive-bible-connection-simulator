// components/ArcDiagram.js (MVP v7.0 - Fix Ref Error & Implement Zoom)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---

// Calculates scales based on current data and dimensions
function setupScales(nodes, width, height, nodeRadius) {
    const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4))));
    const yScale = d3.scalePoint()
      .domain(nodes.map(d => d.id))
      .range([0, height]) // Map domain to the inner height
      .padding(padding);

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);

    // Position the vertical axis at x=0 within the transformed group <g>
    const axisXPosition = 0;

    return { yScale, colorScale, axisXPosition };
}

// Calculates the SVG path data for an arc
function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source);
    const y2 = yScale(d.target);
    // Only return a path if both points are valid
    if (y1 === undefined || y2 === undefined) return null;
    const radius = Math.abs(y2 - y1) / 2;
    // Prevent zero radius arcs
    if (radius <= 0) return null;
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

// Draws/Updates the arcs using the .join() pattern
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
     selection // This is the <g class="arcs-container"> selection
        .attr("fill", "none")
        .attr("stroke-opacity", 0.6) // Base opacity
        .attr("stroke-width", 1)   // Base width
        .selectAll("path.arc-path")
        .data(links, d => `${d.source}-${d.target}`) // Key function for object constancy
        .join(
            enter => enter.append("path")
                         .attr("class", "arc-path")
                         .style("mix-blend-mode", "multiply") // Optional blending
                         .attr("stroke-opacity", 0) // Start transparent
                         .attr("stroke", d => { // Color by source node's book
                             const sourceNode = nodeMap.get(d.source);
                             return colorScale(sourceNode?.book || 'Unknown');
                         })
                         .attr("d", d => calculateArcPath(d, yScale, axisXPosition)) // Calculate path
                         .call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.6)) // Fade in
                         .call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)), // Tooltip
            update => update
                         .call(update => update.transition("arcUpdate").duration(150) // Transition updates
                            .attr("stroke", d => colorScale(nodeMap.get(d.source)?.book || 'Unknown')) // Update color if needed
                            .attr("d", d => calculateArcPath(d, yScale, axisXPosition))), // Recalculate path
            exit => exit
                         .call(exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove()) // Fade out
        );
}

// Draws/Updates the nodes using the .join() pattern
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers) {
     selection // This is the <g class="nodes-container"> selection
        .selectAll("g.node-group")
        .data(nodes, d => d.id) // Key nodes by ID
        .join(
            enter => { // Create new node groups
                const g = enter.append("g")
                    .attr("class", "node-group")
                    .attr("cursor", "pointer")
                    .style("opacity", 0) // Start transparent
                    .attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`); // Position vertically

                // Add circle
                g.append("circle")
                    .attr("r", nodeRadius)
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .attr("fill", d => colorScale(d.book || 'Unknown'))
                    .style("fill-opacity", 0.7)
                    .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7))
                    .style("stroke-width", 0.5)
                    .append("title").text(d => d.label); // Tooltip

                // Add text element (visibility controlled by display attribute)
                g.append("text")
                    .attr("class", "node-label fill-current text-gray-700 dark:text-gray-300")
                    .style("font-size", labelFontSize)
                    .attr("x", labelXOffset) // Position left of axis
                    .attr("dy", "0.35em")    // Vertical align center
                    .attr("text-anchor", "end") // Align end of text to the offset position
                    .style("pointer-events", "none")
                    .attr("display", showLabels ? null : "none") // Initial visibility
                    .text(d => d.label);

                 // Attach event handlers
                 g.on("mouseover", handlers.mouseover)
                  .on("mouseout", handlers.mouseout)
                  .on("click", handlers.click);

                 // Fade in
                 g.transition("fadeIn").duration(300).style("opacity", 1);
                 return g;
            },
            update => { // Update existing node groups
                // Transition position smoothly
                update.transition("updatePos").duration(150)
                      .attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);

                // Update circle properties
                update.select("circle")
                      .transition("updateCircle").duration(150)
                      .attr("r", nodeRadius)
                      .attr("fill", d => colorScale(d.book || 'Unknown'))
                      .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7));
                update.select("circle title").text(d => d.label); // Update tooltip

                // Update label properties (visibility, text, font size)
                 update.select("text.node-label")
                     .attr("display", showLabels ? null : "none") // Show/hide based on flag
                     .style("font-size", labelFontSize)
                     .attr("x", labelXOffset)
                     .text(d => d.label);
                 return update;
            },
            exit => exit // Remove old nodes
                      .transition("fadeOut").duration(200)
                      .style("opacity", 0)
                      .remove()
        );
}


// --- Main Component ---
function ArcDiagram({
    svgRef, // Ref for the parent SVG element (passed from container)
    data,
    width,
    height,
    onNodeSelect,
    onNodeHoverStart,
    onNodeHoverEnd,
    // resetZoomTrigger // Optional prop for reset
}) {
  // Ref for the main <g> element that holds nodes and arcs (this is what gets transformed by zoom)
  const zoomGroupRef = useRef();
  // Store D3 zoom behavior instance in a ref to manage its lifecycle
  const zoomBehaviorRef = useRef();
  // Use ref for nodeMap if needed across effects or renders, otherwise define locally
  const nodeMap = useRef(new Map()).current;


  useEffect(() => {
    // --- Guard Clause: Ensure Refs are ready ---
    // Check both the SVG ref from parent and the local group ref
    if (!svgRef?.current || !zoomGroupRef?.current) {
        // console.log("ArcDiagram useEffect: Waiting for refs...");
        return; // Exit effect early if refs aren't attached yet
    }

    // --- Selections ---
    const rootSvg = d3.select(svgRef.current);    // The <svg> element itself
    const zoomGroup = d3.select(zoomGroupRef.current); // The <g> inside svg to apply zoom transform to

    // --- Data Validation & Setup ---
    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
      zoomGroup.selectAll("*").remove(); // Clear content if data is invalid
      return;
    }

    // Build Node Map (for quick lookups by ID)
    nodeMap.clear();
    data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));

    // --- Determine Adaptive & Final Parameters ---
    const nodeCount = data.nodes.length;
    const minLabelWidthThreshold = 90; const maxNodesForLabels = 120; // Tune these thresholds
    const nodeDensityThreshold = 0.25; const calculatedNodeDensity = nodeCount / height;
    const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold;
    const isDense = calculatedNodeDensity > 0.18; // Tune density threshold
    const nodeRadius = height < 350 ? 6 : (isDense ? 7 : 8); // Final node radius values
    const hoverRadiusIncrease = 3;
    const labelFontSize = height < 350 ? '10px' : (isDense ? '11px' : '12px'); // Final label sizes
    const labelXOffset = -(nodeRadius + 7); // Final label offset

    // --- Setup Scales ---
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

    // --- Prepare Containers within the Zoom Group ---
    // Use selectAll + data join pattern for containers as well for robustness
    const arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
     const hoverTransitionDuration = 100;
     const handlers = {
        mouseover: (event, d) => {
            if (onNodeHoverStart) onNodeHoverStart(d.id);
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1);
            // Optionally bold label - might cause reflow
            // currentTarget.select('text.node-label').style('font-weight', 'bold');
            arcsContainer.selectAll('path.arc-path')
                 .transition("hover").duration(hoverTransitionDuration)
                 .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                 .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
        },
        mouseout: (event, d) => {
            if (onNodeHoverEnd) onNodeHoverEnd();
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', 0.7);
            // currentTarget.select('text.node-label').style('font-weight', 'normal');
            arcsContainer.selectAll('path.arc-path')
                .transition("hoverEnd").duration(hoverTransitionDuration)
                .style('stroke-opacity', 0.6) // Restore base opacity
                .style('stroke-width', 1); // Restore base width
        },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };

    // --- Draw Elements using Helpers ---
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers);

    // --- D3 Zoom Setup & Application ---
    const handleZoom = (event) => {
        zoomGroup.attr('transform', event.transform); // Apply transform to the main content group
    };

    // Create or update the zoom behavior instance
    if (!zoomBehaviorRef.current) {
         zoomBehaviorRef.current = d3.zoom()
            .scaleExtent([0.1, 10]) // Min/Max zoom factor
            .on('zoom', handleZoom);
    }

    // Apply zoom behavior to the root SVG element
    if (svgRef.current) {
        rootSvg.call(zoomBehaviorRef.current)
             .on("dblclick.zoom", null); // Disable double-click zoom
        // Apply a default transform (e.g., centered or identity) if needed on first load
        // const initialTransform = d3.zoomIdentity;
        // rootSvg.call(zoomBehaviorRef.current.transform, initialTransform);
    } else {
         console.error("ArcDiagram: svgRef not available to attach zoom.");
    }

    // Cleanup function for the main useEffect
    return () => {
        // Remove zoom listener from the SVG element on cleanup
        if (svgRef.current) {
            d3.select(svgRef.current).on('.zoom', null);
        }
    };

  // Dependencies for the main effect
  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]);

  // --- Optional Zoom Reset Effect ---
//   useEffect(() => {
//     // Check if reset trigger prop exists and changed
//     if (resetZoomTrigger > 0) {
//         if (svgRef.current && zoomBehaviorRef.current) {
//             console.log("ArcDiagram: Resetting zoom");
//             d3.select(svgRef.current).transition().duration(500)
//               .call(zoomBehaviorRef.current.transform, d3.zoomIdentity); // Reset to default transform
//         }
//     }
//     // Add resetZoomTrigger to dependency array below if using this effect
//   }, [resetZoomTrigger, svgRef]);


  // Return the group element that D3 will manage (positioned by container's transform)
  // This group will be transformed by zoom.
  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;