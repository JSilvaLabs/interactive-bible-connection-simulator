"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function ChordDiagram({ data, width, height, onNodeSelect }) {
  const svgRef = useRef();

  useEffect(() => {
    // --- Initial Checks & Cleanup ---
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    if (!data || !data.nodes || !data.links || data.nodes.length === 0 || width <= 0 || height <= 0) {
        console.log("ChordDiagram: No data or invalid dimensions/data.nodes length. Skipping render.");
      return; // Exit if data is missing, empty, or dimensions are invalid
    }
     console.log(`ChordDiagram: Rendering with ${data.nodes.length} nodes, ${data.links.length} links.`);


    // --- D3 Setup ---
    // Performance Note: These calculations are generally fast.
    const outerRadius = Math.min(width, height) * 0.5 - 60; // Padding for potential labels
    const innerRadius = outerRadius - 10; // Thickness of the arcs

    // --- Data Processing (Potential Optimization Area 1) ---
    // Creating the matrix: Time complexity depends on nodes (N) and links (L).
    // For MVP, N might be larger based on filtered connections. Check performance here if slow.
    const nodeMap = new Map();
    data.nodes.forEach((node, i) => {
        nodeMap.set(node.id, { index: i, ...node });
    });
    const nodes = data.nodes; // Keep original node info accessible
    const numNodes = nodes.length;

    const matrix = Array.from({ length: numNodes }, () => Array(numNodes).fill(0));
    let validLinksProcessed = 0;
    data.links.forEach(link => {
      const sourceNodeInfo = nodeMap.get(link.source);
      const targetNodeInfo = nodeMap.get(link.target);
      const value = link.value || 1; // Default connection value

      // Ensure both source and target nodes exist in the derived node list
      if (sourceNodeInfo !== undefined && targetNodeInfo !== undefined) {
        matrix[sourceNodeInfo.index][targetNodeInfo.index] += value;
        // matrix[targetNodeInfo.index][sourceNodeInfo.index] += value; // Uncomment for symmetric diagram if needed
        validLinksProcessed++;
      } else {
          // This can happen if references.json has links involving nodes not included in the filtered derivation
          // console.warn(`Skipping link in matrix: Missing node mapping for ${link.source} or ${link.target}`);
      }
    });
     console.log(`ChordDiagram: Processed ${validLinksProcessed} valid links into matrix.`);


    // --- D3 Layouts & Scales (Generally Fast) ---
    const chord = d3.chord()
      .padAngle(0.05) // Adjust padding as needed
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const ribbon = d3.ribbon()
      .radius(innerRadius);

    // Color scale based on 'book' property derived in dataService
    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown'))); // Use derived book names
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(bookNames);

    // --- D3 Rendering (Potential Optimization Area 2) ---
    // Appending SVG elements: Performance depends on the number of arcs (N) and chords (C).
    // Check performance here if rendering many elements is slow.
    const svgGroup = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .datum(chord(matrix)); // Bind chord layout data

    // Arcs (Groups)
    const group = svgGroup.append("g")
      .attr("class", "arcs")
      .selectAll("g")
      .data(d => d.groups)
      .join("g")
      .attr("cursor", "pointer"); // Indicate arcs are clickable

    const arcPaths = group.append("path")
      .attr("class", "arc")
      .style("fill", d => color(nodes[d.index]?.book || 'Unknown')) // Color by derived book
      .style("stroke", d => d3.rgb(color(nodes[d.index]?.book || 'Unknown')).darker())
      .attr("d", arc)
      .style("opacity", 1)
      .on("click", (event, d) => { // Click handler
          if (onNodeSelect && nodes[d.index]) {
              onNodeSelect(nodes[d.index].id); // Pass the node ID up
          }
          event.stopPropagation(); // Prevent event bubbling if needed
      });

     arcPaths.append("title") // Basic tooltip
       .text(d => `${nodes[d.index]?.label}\nTotal connections value: ${d.value.toFixed(1)}`); // Use derived label

    // Ribbons (Chords)
    const ribbons = svgGroup.append("g")
      .attr("class", "ribbons")
      .attr("fill-opacity", 0.7) // Apply opacity to the group
      .selectAll("path")
      .data(d => d) // Chord data from group's datum
      .join("path")
      .attr("class", "ribbon")
      .attr("d", ribbon)
      .style("fill", d => color(nodes[d.target.index]?.book || 'Unknown')) // Color by target node's book
      .style("stroke", d => d3.rgb(color(nodes[d.target.index]?.book || 'Unknown')).darker())
      .style("opacity", 1); // Start fully opaque

      ribbons.append("title") // Basic tooltip
       .text(d => `${nodes[d.source.index]?.label} → ${nodes[d.target.index]?.label}\nValue: ${d.source.value.toFixed(1)}`);


    // --- Hover Effects (Potential Optimization Area 3) ---
    // Frequent style/opacity changes on many elements can impact performance.
    // Consider simplifying if lag occurs on hover with large filtered datasets.
    group
      .on("mouseover", (event, d) => {
        svgGroup.selectAll(".ribbon") // Select ribbons within the main group
          .transition("hover").duration(150)
          .style("opacity", ribbonData => (ribbonData.source.index === d.index || ribbonData.target.index === d.index) ? 0.9 : 0.1);

        svgGroup.selectAll(".arc") // Select arc paths within the main group
           .filter(arcData => arcData.index !== d.index)
           .transition("hover").duration(150)
           .style("opacity", 0.5);
      })
      .on("mouseout", (event, d) => {
        svgGroup.selectAll(".ribbon")
            .transition("hoverEnd").duration(150)
            .style("opacity", 1); // Restore ribbon opacity defined by group (0.7)
        svgGroup.selectAll(".arc")
            .transition("hoverEnd").duration(150)
            .style("opacity", 1); // Restore arc opacity
      });

      // Note: Hover on thin ribbons can be difficult. Arc hover might be sufficient.
      // Adding ribbon hover for completeness, but evaluate if needed/performant.
    ribbons
        .on("mouseover", (event, d) => {
            svgGroup.selectAll(".ribbon").filter(r => r !== d)
                .transition("ribbonHover").duration(150)
                .style("opacity", 0.1);
             d3.select(event.currentTarget) // Highlight current ribbon more
                .transition("ribbonHover").duration(150)
                .style("opacity", 0.9);
            svgGroup.selectAll(".arc")
                .filter(a => a.index !== d.source.index && a.index !== d.target.index)
                .transition("ribbonHover").duration(150)
                .style("opacity", 0.5); // Fade unrelated arcs
        })
        .on("mouseout", (event, d) => {
            svgGroup.selectAll(".ribbon")
                .transition("ribbonHoverEnd").duration(150)
                .style("opacity", 1); // Ensure group opacity (0.7) applies
            svgGroup.selectAll(".arc")
                .transition("ribbonHoverEnd").duration(150)
                .style("opacity", 1);
        });

        // --- Optional Labels (Often Removed for Performance/Clarity with many nodes) ---
        // Add labels code here if desired and test performance.

  }, [data, width, height, onNodeSelect]); // Effect dependencies

  // Render the SVG container, D3 will populate it
  return (
    <svg ref={svgRef} width={width} height={height} className="chord-diagram"></svg>
  );
}

export default ChordDiagram;