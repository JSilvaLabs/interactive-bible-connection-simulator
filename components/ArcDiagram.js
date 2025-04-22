"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * Renders a D3 Arc Diagram with nodes along a vertical axis.
 * Nodes are positioned based on canonical order received in props.
 * Arcs represent links between nodes.
 */
function ArcDiagram({
    data,      // { nodes: [canonically sorted], links: [] }
    width,     // Inner width (excluding margins) - used for arc extent
    height,    // Inner height (excluding margins) - used for node axis
    onNodeSelect,
    onNodeHoverStart,
    onNodeHoverEnd
}) {
  const ref = useRef(); // Ref for the main <g> element managed by D3
  const nodeMap = useRef(new Map()).current; // Use ref for map to persist if needed, or build in useEffect

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0 || width <= 0 || height <= 0) {
      d3.select(ref.current).selectAll("*").remove(); // Clear if invalid
      return;
    }

    const svgGroup = d3.select(ref.current);
    svgGroup.selectAll("*").remove(); // Clear previous render

    console.log(`ArcDiagram V: Rendering ${data.nodes.length} nodes, ${data.links.length} links.`);

    // --- Build Node Map (inside useEffect is fine) ---
    nodeMap.clear();
    data.nodes.forEach((node, index) => {
        nodeMap.set(node.id, { index: index, ...node });
    });

    // --- Scales ---
    // Point scale for positioning nodes along the Y-axis
    const yScale = d3.scalePoint()
      .domain(data.nodes.map(d => d.id)) // Domain is the array of node IDs in sorted order
      .range([0, height]) // Map to the inner height
      .padding(0.5); // Adjust padding between nodes

    // Determine position of the vertical axis line
    const axisXPosition = 0; // Position axis at the left edge of the innerWidth

    // Color scale
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
        .attr("stroke", d => { // Color arc based on source node's book color
             const sourceNode = nodeMap.get(d.source);
             return colorScale(sourceNode?.book || 'Unknown');
         })
        .attr("class", d => `arc-path source-${(d.source || '').replace(/[:.\s]/g, '-')} target-${(d.target || '').replace(/[:.\s]/g, '-')}`)
        .attr("d", d => {
            const y1 = yScale(d.source);
            const y2 = yScale(d.target);
            // Skip rendering if source or target node position is not found
            if (y1 === undefined || y2 === undefined) return null;

            const radius = Math.abs(y2 - y1) / 2; // Radius based on vertical distance
            const sweepFlag = y1 < y2 ? 1 : 0; // Draw arc clockwise or counter-clockwise

            // M = move to start (axisX, y1)
            // A = elliptical arc command (rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x-end, y-end)
            return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
        })
        .append("title") // Add tooltip to arcs
           .text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`);


    // --- Draw Nodes ---
    const nodeGroup = svgGroup.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .join("g")
          // Position node group vertically along the axis line
          .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`)
          .attr("cursor", "pointer")
          // --- Event Handlers on Node Group ---
          .on("mouseover", (event, d) => {
              if (onNodeHoverStart) onNodeHoverStart(d.id);
              // Highlight node
              d3.select(event.currentTarget).select('circle').attr('r', 6).style('fill-opacity', 1);
              d3.select(event.currentTarget).select('text').style('font-weight', 'bold');
              // Highlight related arcs
              arcs.selectAll('path')
                  .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05) // Fade others more
                   .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
          })
          .on("mouseout", (event, d) => {
              if (onNodeHoverEnd) onNodeHoverEnd();
              // Reset highlight
               d3.select(event.currentTarget).select('circle').attr('r', 4).style('fill-opacity', 0.7);
               d3.select(event.currentTarget).select('text').style('font-weight', 'normal');
              arcs.selectAll('path').style('stroke-opacity', 0.5).style('stroke-width', 1);
          })
          .on("click", (event, d) => {
              if (onNodeSelect) onNodeSelect(d.id);
              event.stopPropagation();
          });

    // Node Circle (centered at the group's origin)
    nodeGroup.append("circle")
      .attr("r", 4)
      .attr("cx", 0) // At the axis line
      .attr("cy", 0)
      .attr("fill", d => colorScale(d.book || 'Unknown'))
       .style("fill-opacity", 0.7)
       .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7))
       .style("stroke-width", 0.5)
      .append("title") // Basic tooltip for node circle
         .text(d => d.label);

    // Node Label (Positioned to the left of the axis)
    nodeGroup.append("text")
      .attr("class", "node-label text-[9px] sm:text-[10px] fill-current text-gray-700 dark:text-gray-300")
      .attr("x", -10) // Position text to the left of the node circle
      .attr("dy", "0.35em") // Vertical alignment
      .attr("text-anchor", "end") // Align end of text to the x position
      .text(d => d.label)
       .style("pointer-events", "none"); // Prevent labels blocking node hover


  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd]); // Dependencies

  // Return the group element that D3 will manage (positioned by container's transform)
  return <g ref={ref}></g>;
}

export default ArcDiagram;