// components/ArcDiagram.js
"use client";

import React, { useEffect, useRef } from 'react'; // Removed useMemo, nodeMap defined in useEffect
import * as d3 from 'd3';

function ArcDiagram({ data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd }) {
  const ref = useRef();

  useEffect(() => {
    const svgGroup = d3.select(ref.current);
    svgGroup.selectAll("*").remove();

    if (!data || !data.nodes || data.nodes.length === 0 || width <= 0 || height <= 0) {
        // ... (placeholder rendering) ...
      return;
    }
    console.log(`ArcDiagram: Rendering ${data.nodes.length} nodes, ${data.links.length} links.`);

    // --- Define nodeMap HERE within useEffect ---
    // Create map for quick lookup of node details by ID
    const nodeMap = new Map();
    data.nodes.forEach((node, index) => {
        // Include index if needed elsewhere, but primary use is lookup by id
        nodeMap.set(node.id, { index: index, ...node });
    });
    // --- End nodeMap definition ---


    // --- Scales ---
    const xScale = d3.scalePoint()
      .domain(data.nodes.map(d => d.id))
      .range([0, width])
      .padding(0.5);

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
        // --- Use nodeMap correctly HERE ---
        .attr("stroke", d => {
            const targetNode = nodeMap.get(d.target); // Look up target node info
            return colorScale(targetNode?.book || 'Unknown'); // Use its book for color
        })
        // --- End stroke color fix ---
        .attr("class", d => `arc-link source-${(d.source || '').replace(/[:.\s]/g, '-')} target-${(d.target || '').replace(/[:.\s]/g, '-')}`)
        .attr("d", d => {
            const x1 = xScale(d.source);
            const x2 = xScale(d.target);
            if (x1 === undefined || x2 === undefined) {
                 console.warn(`Skipping arc draw: Cannot find scale position for ${d.source} or ${d.target}`);
                 return null;
             }
            const r = Math.abs(x2 - x1) / 2;
            return `M ${x1},${height} A ${r},${r} 0 0,1 ${x2},${height}`;
        });

    // --- Draw Nodes ---
    const nodeGroup = svgGroup.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(data.nodes)
        .join("g")
          .attr("transform", d => `translate(${xScale(d.id)},${height})`)
          .attr("cursor", "pointer")
          .on("mouseover", (event, d) => {
              if (onNodeHoverStart) onNodeHoverStart(d.id);
              // Highlight node and related arcs using nodeMap if needed for efficiency
              const sourceLinks = arcs.selectAll('path').filter(link => link.source === d.id);
              const targetLinks = arcs.selectAll('path').filter(link => link.target === d.id);
              const otherLinks = arcs.selectAll('path').filter(link => link.source !== d.id && link.target !== d.id);

              d3.select(event.currentTarget).select('circle').attr('r', 6).style('fill-opacity', 1);
              d3.select(event.currentTarget).select('text').style('font-weight', 'bold');
              otherLinks.style('stroke-opacity', 0.1);
              sourceLinks.style('stroke-opacity', 0.9).style('stroke-width', 1.5);
              targetLinks.style('stroke-opacity', 0.9).style('stroke-width', 1.5);
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

    // Node Circle
    nodeGroup.append("circle")
      .attr("r", 4)
      .attr("fill", d => colorScale(d.book || 'Unknown'))
       .style("fill-opacity", 0.7)
       .style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7))
       .style("stroke-width", 0.5)
      .append("title")
         .text(d => d.label);

    // Node Label
    nodeGroup.append("text")
      .attr("class", "node-label text-[8px] sm:text-[9px] fill-current text-gray-700 dark:text-gray-300")
      .attr("dy", "0.35em")
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(${data.nodes.length > 50 ? 45 : 0})`)
      .text(d => d.label)
       .style("pointer-events", "none");

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd]); // Removed nodeIdToIndex from dependency array

  // Return the group element that D3 will manage
  return <g ref={ref}></g>;
}

export default ArcDiagram;