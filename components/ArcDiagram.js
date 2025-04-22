// components/ArcDiagram.js (MVP v6.1 Update - Adjust positions for margins)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions (Assume these are defined as in v6.0 outline) ---
function setupScales(nodes, width, height, nodeRadius) {
    const yScale = d3.scalePoint()
      .domain(nodes.map(d => d.id))
      .range([0, height])
      .padding(Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 3)))));

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);

    // --- MVP v6.1: Axis Position inside innerWidth ---
    // Place the vertical axis line at x=0 within the <g> element
    // (which is already translated by margin.left in the container)
    const axisXPosition = 0;
    // --- End Adjustment ---

    return { yScale, colorScale, axisXPosition };
}

function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source);
    const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) return null;
    const radius = Math.abs(y2 - y1) / 2;
    const sweepFlag = y1 < y2 ? 1 : 0;
    // Arcs emanate from axisXPosition
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
     selection.selectAll("path.arc-path")
        .data(links, d => `${d.source}-${d.target}`) // Key function
        .join(
            enter => enter.append("path")
                         .attr("class", "arc-path")
                         .attr("fill", "none")
                         .attr("stroke-width", 1)
                         .attr("stroke-opacity", 0) // Start transparent
                         .attr("stroke", d => colorScale(nodeMap.get(d.target)?.book || 'Unknown'))
                         .attr("d", d => calculateArcPath(d, yScale, axisXPosition))
                         .call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.5))
                         .call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)),
            update => update
                         .call(update => update.transition("arcUpdate").duration(150)
                            .attr("stroke", d => colorScale(nodeMap.get(d.target)?.book || 'Unknown'))
                            .attr("d", d => calculateArcPath(d, yScale, axisXPosition))),
            exit => exit
                         .call(exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove())
        );
}

function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers) {
     selection.selectAll("g.node-group")
        .data(nodes, d => d.id) // Key nodes by ID
        .join(
            enter => { // Create new node groups
                const g = enter.append("g")
                    .attr("class", "node-group")
                    .attr("cursor", "pointer")
                    .style("opacity", 0)
                    // Position group vertically based on scale, horizontally at axisXPosition
                    .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);

                // Add circle centered at group origin (axisXPosition)
                g.append("circle").attr("r", nodeRadius).attr("cx", 0).attr("cy", 0)
                    .style("fill-opacity", 0.7).style("stroke-width", 0.5)
                    .append("title");

                // Add label slot if shown
                 if (showLabels) {
                    g.append("text")
                        .attr("class", "node-label fill-current text-gray-700 dark:text-gray-300")
                        .style("font-size", labelFontSize)
                        .attr("x", labelXOffset) // Position left of axis
                        .attr("dy", "0.35em")    // Vertical align
                        .attr("text-anchor", "end") // Align end to the offset
                        .style("pointer-events", "none");
                 }
                 g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                 g.transition("fadeIn").duration(300).style("opacity", 1);
                 return g;
            },
            update => { // Update existing node groups
                update.transition("updatePos").duration(150)
                      .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);
                update.select("circle") // Update circle
                      .transition("updateCircle").duration(150)
                      .attr("r", nodeRadius)
                      .attr("fill", d => colorScale(d.book || 'Unknown'))
                      .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7));
                update.select("circle title").text(d => d.label); // Update tooltip

                // Update label (handle enter/exit of label itself)
                 const labelUpdate = update.selectAll("text.node-label").data(d => showLabels ? [d] : []);
                 labelUpdate.enter() // Add label if now shown
                     .append("text")
                        .attr("class", "node-label fill-current text-gray-700 dark:text-gray-300")
                        .style("font-size", labelFontSize).attr("x", labelXOffset)
                        .attr("dy", "0.35em").attr("text-anchor", "end")
                        .style("pointer-events", "none").text(d => d.label);
                 labelUpdate // Update existing labels
                        .style("font-size", labelFontSize).attr("x", labelXOffset)
                        .text(d => d.label);
                 labelUpdate.exit().remove(); // Remove label if now hidden
                 return update;
            },
            exit => exit.transition("fadeOut").duration(200).style("opacity", 0).remove()
        );
}


// --- Main Component ---
function ArcDiagram({ data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd }) {
  const svgGroupRef = useRef();
  const nodeMap = useRef(new Map()).current;

  useEffect(() => {
    const svgGroup = d3.select(svgGroupRef.current);
    svgGroup.selectAll("*").remove(); // Clear previous render

    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
        // Container should show placeholder if needed
      return;
    }

    // --- Build Node Map ---
    nodeMap.clear();
    data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));

    // --- Determine Adaptive Parameters ---
    const nodeCount = data.nodes.length;
    const minLabelWidthThreshold = 80; const maxNodesForLabels = 100;
    const nodeDensityThreshold = 0.2; const calculatedNodeDensity = nodeCount / height;
    // Base showLabels check on available innerWidth (passed as width prop)
    const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold;
    const isDense = calculatedNodeDensity > 0.15;
    const nodeRadius = height < 300 ? 2.5 : (isDense ? 3 : 4);
    const labelFontSize = height < 300 ? '8px' : (isDense ? '9px' : '10px');
    const labelXOffset = -(nodeRadius + 4); // Position left of node circle + padding

    // --- Setup Scales ---
    // axisXPosition defines the line where nodes sit, within the innerWidth provided
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

    // --- Prepare Selections ---
    let arcsContainer = svgGroup.select("g.arcs-container");
    if (arcsContainer.empty()) arcsContainer = svgGroup.append("g").attr("class", "arcs-container");
    let nodesContainer = svgGroup.select("g.nodes-container");
    if (nodesContainer.empty()) nodesContainer = svgGroup.append("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
     const hoverTransitionDuration = 100;
     const handlers = {
        mouseover: (event, d) => {
            if (onNodeHoverStart) onNodeHoverStart(d.id);
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + 2).style('fill-opacity', 1);
            // Don't bold label text on hover, might cause layout shift
            // currentTarget.select('text.node-label').style('font-weight', 'bold');
             // Highlight connected arcs
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
            arcsContainer.selectAll('path.arc-path') // Use selection
                .transition("hoverEnd").duration(hoverTransitionDuration)
                .style('stroke-opacity', 0.5) // Restore base opacity
                .style('stroke-width', 1); // Restore base width
        },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };

    // --- Draw Elements using Helpers ---
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers);

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd]); // Dependencies

  // Return the group element D3 will manage (positioned by container's transform)
  return <g ref={svgGroupRef}></g>;
}

export default ArcDiagram;