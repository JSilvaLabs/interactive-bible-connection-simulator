"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * Renders a D3 Arc Diagram with nodes along a vertical axis.
 * Adapts rendering based on available space and node density.
 */
function ArcDiagram({
    data,      // { nodes: [canonically sorted], links: [] }
    width,     // Inner width (excluding margins)
    height,    // Inner height (excluding margins)
    onNodeSelect,
    onNodeHoverStart,
    onNodeHoverEnd
}) {
  const ref = useRef(); // Ref for the main <g> element managed by D3
  const nodeMap = useRef(new Map()).current;

  useEffect(() => {
    const svgGroup = d3.select(ref.current);
    svgGroup.selectAll("*").remove();

    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
      // console.log("ArcDiagram V: No data or dimensions too small.");
      // No placeholder needed here, container handles it
      return;
    }
    // console.log(`ArcDiagram V: Rendering ${data.nodes.length} nodes, ${data.links.length} links.`);

    // --- Build Node Map ---
    nodeMap.clear();
    data.nodes.forEach((node, index) => {
        nodeMap.set(node.id, { index: index, ...node });
    });

    // --- Adaptive Parameters ---
    const nodeCount = data.nodes.length;
    const minLabelWidthThreshold = 80; // Min innerWidth needed to consider showing labels
    const maxNodesForLabels = 100; // Max nodes before hiding labels regardless of width
    const nodeDensityThreshold = 0.2; // nodes per pixel height before hiding labels (tune this)

    const calculatedNodeDensity = nodeCount / height;
    const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold;
    const nodeRadius = height < 300 ? 2.5 : (isDense ? 3 : 4); // Smaller nodes if height is small or very dense
    const labelFontSize = height < 300 ? '8px' : (isDense ? '9px' : '10px'); // Smaller font if dense or small
    const labelXOffset = -(nodeRadius + 4); // Position left of node circle + padding
    const isDense = calculatedNodeDensity > 0.15; // Simpler dense check for padding/radius

    // --- Scales ---
    const yScale = d3.scalePoint()
      .domain(data.nodes.map(d => d.id))
      .range([0, height])
      // Adjust padding based on node count and available height
      .padding(Math.min(0.8, Math.max(0.1, 1 - nodeCount / (height / (nodeRadius * 3)))));

    const axisXPosition = 0; // Axis on the left edge of the innerWidth (needs container margin.left)

    const bookNames = Array.from(new Set(data.nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);

    // --- Draw Arcs ---
    const arcs = svgGroup.append("g")
        .attr("class", "arcs")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .attr("stroke-width", 1);

    arcs.selectAll("path")
      .data(data.links)
      .join("path")
        .attr("stroke", d => {
             const sourceNode = nodeMap.get(d.source); // Color by source book
             return colorScale(sourceNode?.book || 'Unknown');
         })
        .attr("class", "arc-path") // Simpler class for potential CSS
        .attr("d", d => {
            const y1 = yScale(d.source);
            const y2 = yScale(d.target);
            if (y1 === undefined || y2 === undefined) return null;
            const radius = Math.abs(y2 - y1) / 2;
            const sweepFlag = y1 < y2 ? 1 : 0;
            // Draw arc from axis outwards
            return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
        })
        .append("title")
           .text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`);


    // --- Draw Nodes ---
    const nodeGroup = svgGroup.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .join("g")
          .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`)
          .attr("cursor", "pointer")
          .on("mouseover", (event, d) => {
              if (onNodeHoverStart) onNodeHoverStart(d.id);
              d3.select(event.currentTarget).select('circle').attr('r', nodeRadius + 2).style('fill-opacity', 1); // Slightly larger radius on hover
              d3.select(event.currentTarget).select('text').style('font-weight', 'bold');
              arcs.selectAll('path')
                  .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                   .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
          })
          .on("mouseout", (event, d) => {
              if (onNodeHoverEnd) onNodeHoverEnd();
              d3.select(event.currentTarget).select('circle').attr('r', nodeRadius).style('fill-opacity', 0.7); // Restore original radius
              d3.select(event.currentTarget).select('text').style('font-weight', 'normal');
              arcs.selectAll('path').style('stroke-opacity', 0.5).style('stroke-width', 1);
          })
          .on("click", (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); });

    // Node Circle
    nodeGroup.append("circle")
      .attr("r", nodeRadius) // Use adaptive radius
      .attr("cx", 0).attr("cy", 0)
      .attr("fill", d => colorScale(d.book || 'Unknown'))
       .style("fill-opacity", 0.7)
       .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7))
       .style("stroke-width", 0.5)
      .append("title")
         .text(d => d.label);

    // Node Label (Conditional & Adaptive)
    nodeGroup.append("text")
      .filter(() => showLabels) // Only add text elements if showLabels is true
      .attr("class", "node-label fill-current text-gray-700 dark:text-gray-300")
      .style("font-size", labelFontSize) // Apply dynamic font size
      .attr("x", labelXOffset) // Position left of circle + padding
      .attr("dy", "0.35em") // Vertical alignment
      .attr("text-anchor", "end") // Align end of text to the x position
      .text(d => d.label)
      .style("pointer-events", "none");


  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd]); // Dependencies

  return <g ref={ref}></g>; // Return the group D3 will manage
}

export default ArcDiagram;