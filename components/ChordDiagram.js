"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function ChordDiagram({ data, width, height, onNodeSelect }) { // Added onNodeSelect prop
  const svgRef = useRef();

  useEffect(() => {
    if (!data || !data.nodes || !data.links || width <= 0 || height <= 0) {
       d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const outerRadius = Math.min(width, height) * 0.5 - 60;
    const innerRadius = outerRadius - 10;

    const nodeMap = new Map();
    data.nodes.forEach((node, i) => {
        nodeMap.set(node.id, { index: i, ...node });
    });
    const nodes = data.nodes;
    const numNodes = nodes.length;

    const matrix = Array.from({ length: numNodes }, () => Array(numNodes).fill(0));
    data.links.forEach(link => {
      const sourceIndex = nodeMap.get(link.source)?.index;
      const targetIndex = nodeMap.get(link.target)?.index;
      const value = link.value || 1;

      if (sourceIndex !== undefined && targetIndex !== undefined) {
        matrix[sourceIndex][targetIndex] += value;
         // matrix[targetIndex][sourceIndex] += value; // Uncomment for symmetric diagram
      } else {
          console.warn(`Skipping link due to missing node: ${link.source} -> ${link.target}`);
      }
    });

    const chord = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
      .radius(innerRadius);

    const bookNames = Array.from(new Set(nodes.map(d => d.book || d.index)));
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(bookNames);

    const svgGroup = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .datum(chord(matrix));

    // --- Arcs (Groups) ---
    const group = svgGroup.append("g")
      .attr("class", "arcs")
      .selectAll("g")
      .data(d => d.groups)
      .join("g")
      .attr("cursor", "pointer"); // Add pointer cursor to arcs

    const arcPaths = group.append("path")
      .attr("class", "arc")
      .style("fill", d => color(nodes[d.index]?.book || d.index))
      .style("stroke", d => d3.rgb(color(nodes[d.index]?.book || d.index)).darker())
      .attr("d", arc)
      .style("opacity", 1) // Start fully opaque
      .on("click", (event, d) => { // --- CLICK HANDLER ---
          if (onNodeSelect && nodes[d.index]) {
              onNodeSelect(nodes[d.index].id); // Call callback with node ID
          }
      });

     // Add basic tooltip title
     arcPaths.append("title")
       .text(d => `${nodes[d.index]?.label}\nValue: ${d.value}`);


    // --- Ribbons (Chords) ---
    const ribbons = svgGroup.append("g")
      .attr("class", "ribbons")
      .selectAll("path")
      .data(d => d)
      .join("path")
      .attr("class", "ribbon")
      .attr("d", ribbon)
      .style("fill", d => color(nodes[d.target.index]?.book || d.target.index))
      .style("stroke", d => d3.rgb(color(nodes[d.target.index]?.book || d.target.index)).darker())
      .style("fill-opacity", 0.7)
      .style("opacity", 1); // Start fully opaque

      // Add basic tooltip title
      ribbons.append("title")
       .text(d => `${nodes[d.source.index]?.label} → ${nodes[d.target.index]?.label}\nValue: ${d.source.value}`);

    // --- Enhanced Hover Effects ---
    group
      .on("mouseover", (event, d) => {
        // Fade all ribbons
        ribbons.transition().duration(150).style("opacity", 0.1);
        // Highlight ribbons connected to this arc
        ribbons.filter(ribbonData => ribbonData.source.index === d.index || ribbonData.target.index === d.index)
          .transition().duration(150)
          .style("opacity", 0.9);
        // Fade other arcs slightly
         arcPaths.filter(arcData => arcData.index !== d.index)
           .transition().duration(150)
           .style("opacity", 0.5);
      })
      .on("mouseout", (event, d) => {
        // Restore opacity on mouseout
        ribbons.transition().duration(150).style("opacity", 0.7);
        arcPaths.transition().duration(150).style("opacity", 1);
      });

    ribbons
        .on("mouseover", (event, d) => {
            // Fade other ribbons
            ribbons.filter(r => r !== d)
                .transition().duration(150)
                .style("opacity", 0.1);
            // Highlight current ribbon
             d3.select(event.currentTarget)
                .transition().duration(150)
                .style("opacity", 0.9);
            // Fade unrelated arcs
            arcPaths.filter(a => a.index !== d.source.index && a.index !== d.target.index)
                .transition().duration(150)
                .style("opacity", 0.5);
        })
        .on("mouseout", (event, d) => {
             // Restore opacity on mouseout
            ribbons.transition().duration(150).style("opacity", 0.7);
            arcPaths.transition().duration(150).style("opacity", 1);
        });


  }, [data, width, height, onNodeSelect]); // Include onNodeSelect in dependency array

  return (
    <svg ref={svgRef} width={width} height={height} className="chord-diagram"></svg>
  );
}

export default ChordDiagram;