"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function ChordDiagram({ data, width, height }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || !data.nodes || !data.links || width <= 0 || height <= 0) {
      // Clear SVG if no data or invalid dimensions
       d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    // --- D3 Logic ---
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const outerRadius = Math.min(width, height) * 0.5 - 60; // Adjusted padding
    const innerRadius = outerRadius - 10;

    // --- Data Processing ---
    // Create a mapping from node ID to index and store node data
    const nodeMap = new Map();
    data.nodes.forEach((node, i) => {
        nodeMap.set(node.id, { index: i, ...node });
    });
    const nodes = data.nodes; // Use original nodes array for labels etc.
    const numNodes = nodes.length;

    // Create the square matrix for d3.chord
    const matrix = Array.from({ length: numNodes }, () => Array(numNodes).fill(0));
    data.links.forEach(link => {
      const sourceIndex = nodeMap.get(link.source)?.index;
      const targetIndex = nodeMap.get(link.target)?.index;
      const value = link.value || 1; // Default value if not provided

      // Check if indices are valid before assigning
      if (sourceIndex !== undefined && targetIndex !== undefined) {
        matrix[sourceIndex][targetIndex] += value;
        // Add symmetric value for undirected connections if desired,
        // but for typical cross-refs, it might be directional or summed.
        // matrix[targetIndex][sourceIndex] += value; // Optional: makes diagram symmetric
      } else {
          console.warn(`Skipping link due to missing node: ${link.source} -> ${link.target}`);
      }
    });

    // --- D3 Setup ---
    const chord = d3.chord()
      .padAngle(0.05) // padding between groups
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
      .radius(innerRadius);

    // Define a color scale (using book names for grouping if possible, otherwise index)
    // Create a domain of unique book names or just use indices
    const bookNames = Array.from(new Set(nodes.map(d => d.book || d.index))); // Fallback to index
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(bookNames);

    // --- Rendering ---
    const svgGroup = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .datum(chord(matrix)); // Bind chord data to the group

    // Add Arcs (Groups)
    const group = svgGroup.append("g")
      .attr("class", "arcs")
      .selectAll("g")
      .data(d => d.groups)
      .join("g");

    group.append("path")
      .attr("class", "arc")
      .style("fill", d => color(nodes[d.index]?.book || d.index)) // Color by book or index
      .style("stroke", d => d3.rgb(color(nodes[d.index]?.book || d.index)).darker())
      .attr("d", arc)
       // --- Tooltip Interaction (Basic Example) ---
      .append("title") // Simple browser tooltip
      .text(d => `${nodes[d.index]?.label}\nValue: ${d.value}`);

    // Add Ribbons (Chords)
    svgGroup.append("g")
      .attr("class", "ribbons")
      .selectAll("path")
      .data(d => d) // The chord data is the datum of svgGroup
      .join("path")
      .attr("class", "ribbon")
      .attr("d", ribbon)
      .style("fill", d => color(nodes[d.target.index]?.book || d.target.index)) // Color based on target book/index
      .style("stroke", d => d3.rgb(color(nodes[d.target.index]?.book || d.target.index)).darker())
      .style("fill-opacity", 0.7)
      // --- Tooltip Interaction ---
      .append("title")
      .text(d => `${nodes[d.source.index]?.label} → ${nodes[d.target.index]?.label}\nValue: ${d.source.value}`); // Show connection & value

     // Add Labels (Optional - can get crowded)
     // This part is tricky to get right and might be omitted for POC clarity
     /*
     group.append("text")
        .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("class", "arc-label")
        .attr("transform", d => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${outerRadius + 5})
            ${d.angle > Math.PI ? "rotate(180)" : ""}
        `)
        .style("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .text(d => nodes[d.index]?.label);
     */


  }, [data, width, height]); // Re-run effect if data or dimensions change

  return (
    <svg ref={svgRef} width={width} height={height} className="chord-diagram"></svg>
  );
}

export default ChordDiagram;