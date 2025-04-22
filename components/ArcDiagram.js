// components/ArcDiagram.js (MVP v6.0 Refactor Outline)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions (Defined outside useEffect for clarity) ---

// Example helper for scales (could be part of a larger setup function)
function setupScales(nodes, width, height, nodeRadius) {
    const yScale = d3.scalePoint()
      .domain(nodes.map(d => d.id))
      .range([0, height])
      // Dynamic padding logic from v5.1
      .padding(Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 3)))));

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);

    return { yScale, colorScale };
}

// Example helper for drawing nodes
function drawNodes({ svgGroup, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers }) {
     const nodeGroups = svgGroup.selectAll("g.node-group")
        .data(nodes, d => d.id) // Key function for object constancy
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("class", "node-group")
                    .attr("cursor", "pointer")
                    .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);

                g.append("circle")
                    .attr("r", nodeRadius)
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .style("fill-opacity", 0.7)
                    .style("stroke-width", 0.5)
                    .append("title") // Tooltip added on enter
                        .text(d => d.label);

                // Add labels only if needed on enter
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
                 // Add event listeners on enter
                 g.on("mouseover", handlers.mouseover)
                  .on("mouseout", handlers.mouseout)
                  .on("click", handlers.click);

                 return g;
            },
            update => {
                // Update positions if scale changes (might not happen if width/height fixed)
                update.attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);
                // Update styles based on data
                update.select("circle")
                      .attr("r", nodeRadius) // Update radius if it changed
                      .attr("fill", d => colorScale(d.book || 'Unknown'))
                      .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7));
                update.select("title").text(d => d.label); // Update tooltip text

                 // Update labels - visibility and text
                 update.select("text.node-label")
                    .attr("display", showLabels ? null : "none") // Show/hide based on flag
                    .style("font-size", labelFontSize)
                    .attr("x", labelXOffset)
                    .text(d => d.label);

                 return update;
            },
            exit => exit.remove() // Remove nodes that are no longer in the data
        );
      return nodeGroups; // Return the selection for potential further use
}

// Example helper for drawing arcs
function drawArcs({ svgGroup, links, yScale, colorScale, axisXPosition, nodeMap }) {
     const arcPaths = svgGroup.selectAll("path.arc-path")
        .data(links, d => `${d.source}-${d.target}`) // Key function for object constancy
        .join(
            enter => {
                 const path = enter.append("path")
                    .attr("class", "arc-path")
                    .attr("fill", "none")
                    .attr("stroke-opacity", 0) // Start transparent, fade in
                    .attr("stroke-width", 1);

                 path.append("title") // Add tooltip on enter
                      .text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`);

                 // Fade-in transition
                 path.transition("fadeIn").duration(300)
                     .attr("stroke-opacity", 0.5);

                 return path;
            },
            update => update, // Arcs might not need complex updates if data source/target don't change often
            exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove() // Fade out and remove
        )
        // Apply styles that might change (like stroke based on target) to the merged selection
        .attr("stroke", d => {
            const targetNode = nodeMap.get(d.target);
            return colorScale(targetNode?.book || 'Unknown');
        })
        .attr("d", d => { // Recalculate path if scale changes
            const y1 = yScale(d.source);
            const y2 = yScale(d.target);
            if (y1 === undefined || y2 === undefined) return null;
            const radius = Math.abs(y2 - y1) / 2;
            const sweepFlag = y1 < y2 ? 1 : 0;
            return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
        });

     return arcPaths; // Return selection
}


// --- Main Component ---
function ArcDiagram({ data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd }) {
  const ref = useRef();

  useEffect(() => {
    const svgGroup = d3.select(ref.current);
    svgGroup.selectAll("*").remove();

    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
      return;
    }

    // --- Build Node Map (needed by helpers) ---
    const nodeMap = new Map();
    data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));

    // --- Determine Adaptive Parameters ---
    const nodeCount = data.nodes.length;
    const minLabelWidthThreshold = 80;
    const maxNodesForLabels = 100;
    const nodeDensityThreshold = 0.2;
    const calculatedNodeDensity = nodeCount / height;
    const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold;
    const isDense = calculatedNodeDensity > 0.15;
    const nodeRadius = height < 300 ? 2.5 : (isDense ? 3 : 4);
    const labelFontSize = height < 300 ? '8px' : (isDense ? '9px' : '10px');
    const labelXOffset = -(nodeRadius + 4);
    const axisXPosition = 0; // Keep axis on left

    // --- Setup Scales ---
    const { yScale, colorScale } = setupScales(data.nodes, width, height, nodeRadius);

    // --- Define Event Handlers for Nodes ---
     const hoverTransitionDuration = 100;
     const handlers = {
        mouseover: (event, d) => {
            if (onNodeHoverStart) onNodeHoverStart(d.id);
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + 2).style('fill-opacity', 1);
            currentTarget.select('text').style('font-weight', 'bold');
            // Select arcs connected to this node's ID (d.id)
            arcsSelection // Need reference to arc selection
                .transition("hover").duration(hoverTransitionDuration)
                .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
        },
        mouseout: (event, d) => {
            if (onNodeHoverEnd) onNodeHoverEnd();
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', 0.7);
            currentTarget.select('text').style('font-weight', 'normal');
            arcsSelection // Need reference to arc selection
                .transition("hoverEnd").duration(hoverTransitionDuration)
                .style('stroke-opacity', 0.5)
                .style('stroke-width', 1);
        },
        click: (event, d) => {
            if (onNodeSelect) onNodeSelect(d.id);
            event.stopPropagation();
        }
     };


    // --- Draw Elements using Helpers ---
    const arcsSelection = drawArcs({ svgGroup: svgGroup.append("g"), links: data.links, yScale, colorScale, axisXPosition, nodeMap });
    const nodesSelection = drawNodes({ svgGroup: svgGroup.append("g"), nodes: data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers });

    // Ensure elements are layered correctly (e.g., nodes on top of arcs) if needed
    // svgGroup.select(".nodes").raise(); // Bring nodes group to front

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd]); // Dependencies

  return <g ref={ref}></g>;
}

export default ArcDiagram;