// components/ArcDiagram.js (MVP v6.0 Refactor - Using Helpers)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---

function setupScales(nodes, width, height, nodeRadius) {
    const yScale = d3.scalePoint()
      .domain(nodes.map(d => d.id))
      .range([0, height])
      .padding(Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 3)))));

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);
    const axisXPosition = 0;
    return { yScale, colorScale, axisXPosition };
}

function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source);
    const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) return null;
    const radius = Math.abs(y2 - y1) / 2;
    const sweepFlag = y1 < y2 ? 1 : 0;
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
                    .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);

                g.append("circle")
                    .attr("r", nodeRadius)
                    .style("fill-opacity", 0.7)
                    .style("stroke-width", 0.5)
                    .append("title"); // Add tooltip slot

                 if (showLabels) { // Conditionally add text slot
                    g.append("text")
                        .attr("class", "node-label fill-current text-gray-700 dark:text-gray-300")
                        .style("font-size", labelFontSize)
                        .attr("x", labelXOffset)
                        .attr("dy", "0.35em")
                        .attr("text-anchor", "end")
                        .style("pointer-events", "none");
                 }
                 g.on("mouseover", handlers.mouseover)
                  .on("mouseout", handlers.mouseout)
                  .on("click", handlers.click);
                 g.transition("fadeIn").duration(300).style("opacity", 1);
                 return g;
            },
            update => { // Update existing node groups
                update.transition("update").duration(150)
                      .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);
                update.select("circle") // Update circle
                      .transition("update").duration(150)
                      .attr("r", nodeRadius)
                      .attr("fill", d => colorScale(d.book || 'Unknown'))
                      .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7));
                update.select("circle title").text(d => d.label); // Update tooltip

                 // Update label (handle entering/exiting label text if needed)
                 const labelSelection = update.selectAll("text.node-label").data(d => showLabels ? [d] : []); // Data join for label
                 labelSelection.enter() // Add label if now shown
                     .append("text")
                        .attr("class", "node-label fill-current text-gray-700 dark:text-gray-300")
                        .style("font-size", labelFontSize)
                        .attr("x", labelXOffset)
                        .attr("dy", "0.35em")
                        .attr("text-anchor", "end")
                        .style("pointer-events", "none")
                        .text(d => d.label);
                 labelSelection // Update existing labels
                        .style("font-size", labelFontSize)
                        .attr("x", labelXOffset)
                        .text(d => d.label);
                 labelSelection.exit().remove(); // Remove label if now hidden

                 return update;
            },
            exit => exit.transition("fadeOut").duration(200).style("opacity", 0).remove()
        );
}


// --- Main Component ---
function ArcDiagram({ data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd }) {
  const svgGroupRef = useRef();
  const nodeMap = useRef(new Map()).current; // Use ref for map if needed across renders/effects

  useEffect(() => {
    const svgGroup = d3.select(svgGroupRef.current);
    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
      svgGroup.selectAll("*").remove(); return;
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

    // --- Prepare Selections for Event Handlers ---
    // Create containers first if they don't exist
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
            currentTarget.select('text.node-label').style('font-weight', 'bold');
            // Select paths within the arcs container
            arcsContainer.selectAll('path.arc-path')
                .transition("hover").duration(hoverTransitionDuration)
                .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
        },
        mouseout: (event, d) => {
            if (onNodeHoverEnd) onNodeHoverEnd();
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', 0.7);
            currentTarget.select('text.node-label').style('font-weight', 'normal');
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

  return <g ref={svgGroupRef}></g>;
}

export default ArcDiagram;