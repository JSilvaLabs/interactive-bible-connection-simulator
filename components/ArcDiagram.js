// components/ArcDiagram.js (MVP v6.2 Update - Fix Arcs & Larger Nodes)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---

function setupScales(nodes, width, height, nodeRadius) {
    // Adjust padding based on node count and available height, considering larger radius
    const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4)))); // Increased denominator slightly
    const yScale = d3.scalePoint()
      .domain(nodes.map(d => d.id))
      .range([0, height]) // Map to the inner height
      .padding(padding);

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);

    // Axis remains at the left edge of the inner drawing area
    const axisXPosition = 0;

    return { yScale, colorScale, axisXPosition };
}

function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source);
    const y2 = yScale(d.target);
    // Critical check: Only draw if both points are valid
    if (y1 === undefined || y2 === undefined) {
         // console.warn(`Skipping arc: Cannot find y-position for ${d.source} or ${d.target}`);
         return null;
     }
    const radius = Math.abs(y2 - y1) / 2;
    // Prevent zero radius arcs which cause errors
    if (radius <= 0) return null;
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

// Refactored function using .join() for arcs
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
     selection // This is the <g class="arcs-container"> selection
        .attr("fill", "none") // Ensure no fill is applied to arcs
        .attr("stroke-opacity", 0.6) // Base opacity for arcs
        .attr("stroke-width", 1)   // Base stroke width
        .selectAll("path.arc-path")
        .data(links, d => `${d.source}-${d.target}`) // Key function
        .join(
            enter => enter.append("path")
                         .attr("class", "arc-path")
                         .style("mix-blend-mode", "multiply") // Helps visibility with overlaps
                         .attr("stroke-opacity", 0) // Start transparent
                         .attr("stroke", d => {
                             const sourceNode = nodeMap.get(d.source);
                             return colorScale(sourceNode?.book || 'Unknown'); // Color by source book
                         })
                         .attr("d", d => calculateArcPath(d, yScale, axisXPosition))
                         .call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.6)) // Fade in to base opacity
                         .call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)),
            update => update
                         .call(update => update.transition("arcUpdate").duration(150)
                            .attr("stroke", d => colorScale(nodeMap.get(d.source)?.book || 'Unknown')) // Update color if needed
                            .attr("d", d => calculateArcPath(d, yScale, axisXPosition))), // Update path
            exit => exit
                         .call(exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove())
        );
}

// Refactored function using .join() for nodes
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers) {
     selection // This is the <g class="nodes-container"> selection
        .selectAll("g.node-group")
        .data(nodes, d => d.id) // Key nodes by ID
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("class", "node-group")
                    .attr("cursor", "pointer")
                    .style("opacity", 0)
                    .attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`); // Fallback y=0 if scale fails initially

                g.append("circle").attr("r", nodeRadius).attr("cx", 0).attr("cy", 0) /* ... styles ... */.style("fill-opacity", 0.7).style("stroke-width", 0.5).append("title");
                 if (showLabels) { g.append("text").attr("class", "node-label ...").style("font-size", labelFontSize).attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none"); }
                 g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                 g.transition("fadeIn").duration(300).style("opacity", 1);
                 return g;
            },
            update => {
                update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`); // Update position
                update.select("circle").transition("updateCircle").duration(150).attr("r", nodeRadius) /* ... update fill/stroke ... */;
                update.select("circle title").text(d => d.label);
                 // Update label (handle enter/exit of label itself more reliably)
                 const labelSelection = update.selectAll("text.node-label").data(d => showLabels ? [d] : []);
                 labelSelection.enter().append("text").attr("class", "node-label fill-current text-gray-700 dark:text-gray-300").style("pointer-events", "none").attr("dy", "0.35em").attr("text-anchor", "end");
                 labelSelection.merge(labelSelection.enter()).style("font-size", labelFontSize).attr("x", labelXOffset).text(d => d.label);
                 labelSelection.exit().remove();
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
    // No need to clear manually if using .join() correctly on sub-selections

    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
        svgGroup.selectAll("*").remove(); // Clear if invalid data/dims
      return;
    }

    // --- Build Node Map ---
    nodeMap.clear();
    data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));

    // --- Determine Adaptive & Updated Parameters ---
    const nodeCount = data.nodes.length;
    const minLabelWidthThreshold = 80; const maxNodesForLabels = 100;
    const nodeDensityThreshold = 0.2; const calculatedNodeDensity = nodeCount / height;
    const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold;
    const isDense = calculatedNodeDensity > 0.15;

    // *** MVP v6.2: Increased Node Radius Further ***
    const nodeRadius = height < 400 ? 5 : (isDense ? 6 : 7); // Increased base size
    const hoverRadiusIncrease = 3;
    const labelFontSize = height < 400 ? '9px' : (isDense ? '10px' : '11px');
    const labelXOffset = -(nodeRadius + 6); // Adjust offset for larger node + padding
    // *** End Node Size Increase ***

    // --- Setup Scales ---
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

    // --- Prepare Containers ---
    // Ensure containers exist for draw functions
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
            currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1);
            currentTarget.select('text.node-label').style('font-weight', 'bold');
            arcsContainer.selectAll('path.arc-path') // Use selection
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
                .style('stroke-opacity', 0.6) // Restore base opacity
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