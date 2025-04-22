// components/ArcDiagram.js (MVP v6.0 Refactor Outline)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions (Defined within or outside useEffect) ---

function setupScales(nodes, width, height, nodeRadius) {
    // console.log("Setting up scales..."); // Debugging
    const yScale = d3.scalePoint()
      .domain(nodes.map(d => d.id))
      .range([0, height])
      .padding(Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 3)))));

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);

    const axisXPosition = 0; // Or calculate dynamically if needed
    return { yScale, colorScale, axisXPosition };
}

function calculateArcPath(d, yScale, axisXPosition, nodeMap) {
    // Use nodeMap for potentially faster lookups if needed, else use yScale directly
    const y1 = yScale(d.source);
    const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) return null;
    const radius = Math.abs(y2 - y1) / 2;
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

// --- Main Component ---
function ArcDiagram({ data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd }) {
  const svgGroupRef = useRef(); // Ref for the main <g> element D3 will manage

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
        d3.select(svgGroupRef.current).selectAll("*").remove(); // Clear if invalid
      return;
    }

    const svgGroup = d3.select(svgGroupRef.current);

    // --- Build Node Map (For lookups within this effect) ---
    const nodeMap = new Map();
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

    // --- Draw Arcs using .join() ---
    const arcsGroup = svgGroup.selectAll("g.arcs-container").data([null]); // Bind single datum
    const arcsGroupEnter = arcsGroup.enter().append("g").attr("class", "arcs-container")
                                     .attr("fill", "none").attr("stroke-opacity", 0.5).attr("stroke-width", 1);
    arcsGroup.merge(arcsGroupEnter) // Operate on merged selection
        .selectAll("path.arc-path")
        .data(data.links, d => `${d.source}-${d.target}`) // Key links
        .join(
            enter => enter.append("path") // How to add new arcs
                         .attr("class", "arc-path")
                         .attr("stroke-opacity", 0) // Start transparent
                         .attr("stroke", d => colorScale(nodeMap.get(d.target)?.book || 'Unknown'))
                         .attr("d", d => calculateArcPath(d, yScale, axisXPosition, nodeMap))
                         .call(enter => enter.transition("arcEnter").duration(300).attr("stroke-opacity", 0.5))
                         .call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)),
            update => update // How to update existing arcs
                         .call(update => update.transition("arcUpdate").duration(150)
                            .attr("stroke", d => colorScale(nodeMap.get(d.target)?.book || 'Unknown'))
                            .attr("d", d => calculateArcPath(d, yScale, axisXPosition, nodeMap))), // Recalculate path
            exit => exit   // How to remove old arcs
                         .call(exit => exit.transition("arcExit").duration(200).attr("stroke-opacity", 0).remove())
        );

    // --- Draw Nodes using .join() ---
    const nodesGroup = svgGroup.selectAll("g.nodes-container").data([null]);
    const nodesGroupEnter = nodesGroup.enter().append("g").attr("class", "nodes-container");

    const nodeUpdateSelection = nodesGroup.merge(nodesGroupEnter) // Operate on merged selection
        .selectAll("g.node-group")
        .data(data.nodes, d => d.id); // Key nodes by ID

    // Enter selection (new nodes)
    const nodeEnterSelection = nodeUpdateSelection.enter()
        .append("g")
            .attr("class", "node-group")
            .attr("cursor", "pointer")
            .style("opacity", 0)
            .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);

    nodeEnterSelection.append("circle") // Add circle to new nodes
        .attr("r", nodeRadius)
        .style("fill-opacity", 0.7)
        .style("stroke-width", 0.5)
        .append("title"); // Add tooltip slot

    nodeEnterSelection.append("text") // Add text slot to new nodes
        .attr("class", "node-label fill-current text-gray-700 dark:text-gray-300")
        .attr("x", labelXOffset)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .style("pointer-events", "none");

    // Merge Enter + Update selections
    const nodeMergedSelection = nodeEnterSelection.merge(nodeUpdateSelection);

    // Apply updates to all existing/new nodes
    nodeMergedSelection
        .transition("nodeUpdatePos").duration(150) // Transition position changes
        .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`)
        .style("opacity", 1); // Ensure visible

    nodeMergedSelection.select("circle") // Update circle properties
        .transition("nodeUpdateCircle").duration(150)
        .attr("r", nodeRadius)
        .attr("fill", d => colorScale(d.book || 'Unknown'))
        .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7));
    nodeMergedSelection.select("circle title") // Update tooltip text
        .text(d => d.label);

    nodeMergedSelection.select("text.node-label") // Update label properties
        .attr("display", showLabels ? null : "none")
        .style("font-size", labelFontSize)
        .attr("x", labelXOffset)
        .text(d => d.label);

    // Apply event handlers to merged selection (ensures they are on new and existing nodes)
    nodeMergedSelection
        .on("mouseover", (event, d) => {
            if (onNodeHoverStart) onNodeHoverStart(d.id);
             // Highlighting logic... (can select arcs using svgGroup.select(".arcs-container").selectAll(...))
             const arcs = svgGroup.select(".arcs-container").selectAll('path.arc-path');
             d3.select(event.currentTarget).select('circle').transition("hover").duration(100).attr('r', nodeRadius + 2).style('fill-opacity', 1);
             d3.select(event.currentTarget).select('text.node-label').style('font-weight', 'bold');
             arcs.transition("hover").duration(100)
                 .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                 .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
        })
        .on("mouseout", (event, d) => {
            if (onNodeHoverEnd) onNodeHoverEnd();
             // Reset highlighting logic...
             const arcs = svgGroup.select(".arcs-container").selectAll('path.arc-path');
             d3.select(event.currentTarget).select('circle').transition("hoverEnd").duration(100).attr('r', nodeRadius).style('fill-opacity', 0.7);
             d3.select(event.currentTarget).select('text.node-label').style('font-weight', 'normal');
             arcs.transition("hoverEnd").duration(100).style('stroke-opacity', 0.5).style('stroke-width', 1);
        })
        .on("click", (event, d) => {
            if (onNodeSelect) onNodeSelect(d.id);
            event.stopPropagation();
        });

    // Exit selection (remove nodes that are no longer in data)
    nodeUpdateSelection.exit()
        .transition("nodeExit").duration(200)
        .style("opacity", 0)
        .remove();

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd]); // Dependencies

  // The ref points to the <g> element where D3 renders
  return <g ref={svgGroupRef}></g>;
}

export default ArcDiagram;