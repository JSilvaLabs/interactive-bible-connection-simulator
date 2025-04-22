"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';

/**
 * Renders a D3 Arc Diagram based on provided nodes and links.
 * Nodes are positioned linearly along the x-axis based on canonical order.
 * Arcs represent links between nodes.
 */
function ArcDiagram({
    data,      // { nodes: [canonically sorted], links: [] }
    width,     // Inner width (excluding margins)
    height,    // Inner height (for arc scaling, axis position)
    onNodeSelect,
    onNodeHoverStart,
    onNodeHoverEnd
}) {
  const ref = useRef(); // Ref for the main <g> element managed by D3
  const nodeIdToIndex = useMemo(() => {
      // Create a map for quick lookup of node index by ID, respecting sorted order
      const map = new Map();
      data.nodes.forEach((node, index) => map.set(node.id, index));
      return map;
  }, [data.nodes]); // Recompute only when nodes change

  useEffect(() => {
    if (!data || !data.nodes || data.nodes.length === 0 || width <= 0 || height <= 0) {
      return; // Don't render if data/dimensions invalid
    }

    const svgGroup = d3.select(ref.current);
    svgGroup.selectAll("*").remove(); // Clear previous render

    // --- Scales ---
    // Point scale for positioning nodes along the x-axis
    const xScale = d3.scalePoint()
      .domain(data.nodes.map(d => d.id)) // Domain is the array of node IDs in sorted order
      .range([0, width])
      .padding(0.5); // Adjust padding between nodes

    // Optional: Color scale (can use book from node data)
    const bookNames = Array.from(new Set(data.nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);

    // --- Draw Arcs ---
    const arcs = svgGroup.append("g")
        .attr("class", "arcs")
        .attr("fill", "none") // Arcs are typically strokes
        // Use a default light stroke, maybe vary by target book color
        .attr("stroke-opacity", 0.5) // Start semi-transparent
        .attr("stroke-width", 1);

    arcs.selectAll("path")
      .data(data.links)
      .join("path")
        .attr("stroke", d => colorScale(nodeMap.get(d.target)?.book || 'Unknown')) // Color arc by target book
        .attr("class", d => `arc-link source-${d.source.replace(/[:.\s]/g, '-')} target-${d.target.replace(/[:.\s]/g, '-')}`) // Add classes for potential CSS styling/selection
        .attr("d", d => {
            const x1 = xScale(d.source);
            const x2 = xScale(d.target);
            if (x1 === undefined || x2 === undefined) return null; // Skip if node position not found

            const r = Math.abs(x2 - x1) / 2; // Radius of the arc
            // Draw arc path: M = move to start, A = arc command (rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x-end, y-end)
            // Arcs are drawn just above the axis (y=height)
            return `M ${x1},${height} A ${r},${r} 0 0,1 ${x2},${height}`;
        });

    // --- Draw Nodes ---
    const nodeGroup = svgGroup.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .join("g")
          .attr("transform", d => `translate(${xScale(d.id)},${height})`) // Position node group at bottom axis
          .attr("cursor", "pointer")
          // Add event listeners to the group containing circle and text
          .on("mouseover", (event, d) => {
              if (onNodeHoverStart) onNodeHoverStart(d.id);
              // Highlight node and related arcs
              d3.select(event.currentTarget).select('circle').attr('r', 6).style('fill-opacity', 1);
               d3.select(event.currentTarget).select('text').style('font-weight', 'bold');
              arcs.selectAll('path')
                  .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.1)
                   .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);

          })
          .on("mouseout", (event, d) => {
              if (onNodeHoverEnd) onNodeHoverEnd();
              // Reset highlight
               d3.select(event.currentTarget).select('circle').attr('r', 4).style('fill-opacity', 0.7);
               d3.select(event.currentTarget).select('text').style('font-weight', 'normal');
              arcs.selectAll('path')
                  .style('stroke-opacity', 0.5)
                  .style('stroke-width', 1);
          })
          .on("click", (event, d) => {
              if (onNodeSelect) onNodeSelect(d.id);
              event.stopPropagation();
          });

    // Node Circle
    nodeGroup.append("circle")
      .attr("r", 4)
      .attr("fill", d => colorScale(d.book || 'Unknown'))
       .style("fill-opacity", 0.7)
       .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7))
       .style("stroke-width", 0.5)
      .append("title") // Basic tooltip
         .text(d => d.label);

    // Node Label
    // Position labels below the node circle, rotate for readability if many nodes
    nodeGroup.append("text")
      .attr("class", "node-label text-[8px] sm:text-[9px] fill-current text-gray-700 dark:text-gray-300") // Smaller font
      .attr("dy", "0.35em")
      .attr("y", 15) // Position below circle
      .attr("text-anchor", "middle")
      // Rotate labels slightly if many nodes, more if very dense
      .attr("transform", `rotate(${data.nodes.length > 50 ? 45 : 0})`)
      .text(d => d.label)
       .style("pointer-events", "none"); // Prevent labels from interfering with node hover


  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, nodeIdToIndex]); // Include dependencies

  // Return the group element that D3 will manage
  return <g ref={ref}></g>;
}

export default ArcDiagram;