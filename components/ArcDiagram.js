// components/ArcDiagram.js (MVP v6.0 Refactor Outline)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---

// Calculates scales based on current data and dimensions
function setupScalesAndAxes(nodes, width, height, nodeRadius) {
    const yScale = d3.scalePoint()
      .domain(nodes.map(d => d.id))
      .range([0, height])
      .padding(Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 3))))); // Adaptive padding

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);

    // Axis position can be decided here or passed in
    const axisXPosition = 0;

    return { yScale, colorScale, axisXPosition };
}

// Calculates the SVG path data for an arc
function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source);
    const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) return null;
    const radius = Math.abs(y2 - y1) / 2;
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

// Draws/Updates the arcs using the .join() pattern
function drawArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
    selection.selectAll("path.arc-path")
        .data(links, d => `${d.source}-${d.target}`) // Key function
        .join(
            enter => enter.append("path")
                .attr("class", "arc-path")
                .attr("fill", "none")
                .attr("stroke-opacity", 0) // Start hidden
                .attr("stroke-width", 1)
                .attr("stroke", d => colorScale(nodeMap.get(d.target)?.book || 'Unknown'))
                .attr("d", d => calculateArcPath(d, yScale, axisXPosition))
                .call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.5)) // Fade in
                .call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)), // Add tooltip on enter
            update => update
                .call(update => update.transition("update").duration(150) // Optional transition on update
                    .attr("stroke", d => colorScale(nodeMap.get(d.target)?.book || 'Unknown'))
                    .attr("d", d => calculateArcPath(d, yScale, axisXPosition))
                    ), // Update path and color if needed
            exit => exit
                .call(exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove()) // Fade out and remove
        );
}

// Draws/Updates the nodes using the .join() pattern
function drawNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers) {
     selection.selectAll("g.node-group")
        .data(nodes, d => d.id)
        .join(
            enter => { // Code to run for new nodes
                const g = enter.append("g")
                    .attr("class", "node-group")
                    .attr("cursor", "pointer")
                    .style("opacity", 0) // Start transparent
                    .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);

                // Add circle
                g.append("circle")
                    .attr("r", nodeRadius)
                    .attr("fill", d => colorScale(d.book || 'Unknown'))
                    .style("fill-opacity", 0.7)
                    .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7))
                    .style("stroke-width", 0.5)
                    .append("title").text(d => d.label);

                // Add label (conditionally)
                 if (showLabels) {
                    g.append("text")
                        .attr("class", "node-label fill-current text-gray-700 dark:text-gray-300")
                        .style("font-size", labelFontSize)
                        .attr("x", labelXOffset)
                        .attr("dy", "0.35em")
                        .attr("text-anchor", "end")
                        .style("pointer-events", "none")
                        .text(d => d.label);
                 }

                 // Add event handlers
                 g.on("mouseover", handlers.mouseover)
                  .on("mouseout", handlers.mouseout)
                  .on("click", handlers.click);

                 // Fade in transition
                 g.transition("fadeIn").duration(300).style("opacity", 1);

                 return g;
            },
            update => { // Code to run for existing nodes that might need updates
                update.transition("update").duration(150) // Smooth transition for position changes
                      .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);

                // Update circle styles if needed (e.g., color based on changed book)
                update.select("circle")
                    .transition("update").duration(150)
                    .attr("r", nodeRadius)
                    .attr("fill", d => colorScale(d.book || 'Unknown'))
                    .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7));
                update.select("circle title").text(d => d.label); // Update tooltip

                 // Update labels (visibility, text, font size)
                 const labelUpdate = update.select("text.node-label");
                 if (showLabels) {
                     labelUpdate.attr("display", null) // Ensure visible
                                .style("font-size", labelFontSize)
                                .attr("x", labelXOffset)
                                .text(d => d.label);
                 } else {
                     labelUpdate.attr("display", "none"); // Hide if not needed
                 }
                 return update;
            },
            exit => exit.transition("fadeOut").duration(200).style("opacity", 0).remove() // Fade out and remove old nodes
        );
}

// --- Main Component ---
function ArcDiagram({ data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd }) {
  const ref = useRef();
  const nodeMap = useRef(new Map()).current; // Persist map across renders if needed

  useEffect(() => {
    const svgGroup = d3.select(ref.current);
    // No need to clear manually if using .join() correctly on selections bound to svgGroup

    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
        svgGroup.selectAll("*").remove(); // Clear if invalid
        // Render placeholder text if needed (handled by container now)
      return;
    }

     // --- Build Node Map ---
    nodeMap.clear();
    data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));

    // --- Determine Adaptive Parameters ---
    const nodeCount = data.nodes.length;
    const minLabelWidthThreshold = 80; const maxNodesForLabels = 100;
    const nodeDensityThreshold = 0.2; const calculatedNodeDensity = nodeCount / height;
    const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold;
    const isDense = calculatedNodeDensity > 0.15;
    const nodeRadius = height < 300 ? 2.5 : (isDense ? 3 : 4);
    const labelFontSize = height < 300 ? '8px' : (isDense ? '9px' : '10px');
    const labelXOffset = -(nodeRadius + 4);

    // --- Setup Scales ---
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

    // --- Define Event Handlers ---
     const hoverTransitionDuration = 100;
     // Define handlers accessing necessary variables (scales, selections etc.) from outer scope
     const handlers = {
        mouseover: (event, d) => { /* ... (Highlighting logic using d.id, arcsSelection) ... */
            if (onNodeHoverStart) onNodeHoverStart(d.id);
            d3.select(event.currentTarget).select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + 2).style('fill-opacity', 1);
            d3.select(event.currentTarget).select('text').style('font-weight', 'bold');
            arcsSelection.selectAll('path')
                 .transition("hover").duration(hoverTransitionDuration)
                 .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                 .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
        },
        mouseout: (event, d) => { /* ... (Reset highlighting logic) ... */
            if (onNodeHoverEnd) onNodeHoverEnd();
            d3.select(event.currentTarget).select('circle').transition("hoverEnd").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', 0.7);
            d3.select(event.currentTarget).select('text').style('font-weight', 'normal');
            arcsSelection.selectAll('path')
                .transition("hoverEnd").duration(hoverTransitionDuration)
                .style('stroke-opacity', 0.5)
                .style('stroke-width', 1);
        },
        click: (event, d) => { /* ... (Call onNodeSelect) ... */
             if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation();
         }
     };

    // --- Draw Elements using Helpers ---
    // Ensure selections are available for handlers
    const arcsSelection = drawArcs({ svgGroup: svgGroup.append("g").attr("class", "arcs-container"), links: data.links, yScale, colorScale, axisXPosition, nodeMap });
    const nodesSelection = drawNodes({ svgGroup: svgGroup.append("g").attr("class", "nodes-container"), nodes: data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers });

    // Raise nodes above arcs if needed
    // svgGroup.select(".nodes-container").raise();

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd]); // Dependencies

  // Return the group element D3 will manage
  return <g ref={ref}></g>;
}

export default ArcDiagram;