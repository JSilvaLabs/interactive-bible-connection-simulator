"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

function ChordDiagram({
    data,
    width,
    height,
    onNodeSelect,
    onNodeHoverStart, // New prop
    onNodeHoverEnd    // New prop
}) {
  const svgRef = useRef();

  useEffect(() => {
    // --- Initial Checks & Cleanup ---
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!data || !data.nodes || !data.links || data.nodes.length === 0 || width <= 0 || height <= 0) {
        console.log("ChordDiagram: No data or invalid dimensions/data.nodes length.");
        svg.append("text")
           .attr("x", width / 2).attr("y", height / 2).attr("text-anchor", "middle")
           .attr("class", "text-sm text-gray-500 dark:text-gray-400")
           .text("No connection data to display for this selection.");
      return;
    }
    // console.log(`ChordDiagram: Rendering with ${data.nodes.length} nodes, ${data.links.length} links.`);


    // --- D3 Setup ---
    const outerRadius = Math.min(width, height) * 0.5 - 40;
    const innerRadius = outerRadius - 15;

    // --- Data Processing ---
    const nodes = data.nodes; // Assumed pre-sorted
    const nodeMap = new Map();
    nodes.forEach((node, i) => {
        nodeMap.set(node.id, { index: i, ...node });
    });
    const numNodes = nodes.length;

    const matrix = Array.from({ length: numNodes }, () => Array(numNodes).fill(0));
    let validLinksProcessed = 0;
    data.links.forEach(link => {
      const sourceNodeInfo = nodeMap.get(link.source);
      const targetNodeInfo = nodeMap.get(link.target);
      const value = 1; // Uniform thickness

      if (sourceNodeInfo !== undefined && targetNodeInfo !== undefined) {
        matrix[sourceNodeInfo.index][targetNodeInfo.index] += value;
        // matrix[targetNodeInfo.index][sourceNodeInfo.index] += value; // Symmetric if needed
        validLinksProcessed++;
      }
    });
     // console.log(`ChordDiagram: Processed ${validLinksProcessed} links into matrix (value=1).`);


    // --- D3 Layouts & Scales ---
    const chord = d3.chord()
      .padAngle(numNodes > 50 ? 0.02 : 0.04)
      .sortSubgroups(null) // Respect incoming node order
      .sortChords(d3.descending);

    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius);

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const color = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                    .domain(bookNames);

    // --- D3 Rendering ---
    const svgGroup = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .style("font-size", "10px") // Base font size for labels
      .style("font-family", "sans-serif")
      .datum(chord(matrix));

    // Arcs (Groups)
    const group = svgGroup.append("g")
      .attr("class", "arcs")
      .selectAll("g")
      .data(d => d.groups)
      .join("g")
      .attr("cursor", "pointer");

    const arcPaths = group.append("path")
      .attr("class", "arc")
      .style("fill", d => color(nodes[d.index]?.book || 'Unknown'))
      .style("stroke", d => d3.rgb(color(nodes[d.index]?.book || 'Unknown')).darker(0.7))
      .style("stroke-width", 0.5)
      .attr("d", arc)
      .style("opacity", 1);

     // Click handler
     arcPaths.on("click", (event, d) => {
          if (onNodeSelect && nodes[d.index]) {
              onNodeSelect(nodes[d.index].id);
          }
          event.stopPropagation();
      });

     // Tooltip for Arcs
     arcPaths.append("title")
       .text(d => `${nodes[d.index]?.label}\nConnections: ${d.value}`); // Value is connection count

    // Ribbons (Chords)
    const ribbons = svgGroup.append("g")
      .attr("class", "ribbons")
      .attr("fill-opacity", 0.65)
      .selectAll("path")
      .data(d => d)
      .join("path")
      .attr("class", "ribbon")
      .attr("d", ribbon)
      .style("fill", d => color(nodes[d.target.index]?.book || 'Unknown'))
      .style("stroke", "#fff")
      .style("stroke-width", 0.5)
      .style("opacity", 1);

      // Tooltip for Ribbons
      ribbons.append("title")
       .text(d => `${nodes[d.source.index]?.label} → ${nodes[d.target.index]?.label}`);


    // --- Hover Effects ---
    const hoverTransitionDuration = 100;

    group // Add hover listeners to the group containing the arc path
      .on("mouseover", (event, d) => {
        if (onNodeHoverStart && nodes[d.index]) onNodeHoverStart(nodes[d.index].id);

        svgGroup.selectAll(".ribbon")
          .transition("groupHoverFadeRibbon").duration(hoverTransitionDuration)
          .style("opacity", ribbonData => (ribbonData.source.index === d.index || ribbonData.target.index === d.index) ? 0.9 : 0.1);
        svgGroup.selectAll(".arcs g path")
           .filter(arcData => arcData.index !== d.index)
           .transition("groupHoverFadeArc").duration(hoverTransitionDuration)
           .style("opacity", 0.3);
         d3.select(event.currentTarget).select('path.arc')
             .transition("groupHoverHighlightArc").duration(hoverTransitionDuration)
             .style("stroke-width", 1.5);
      })
      .on("mouseout", (event, d) => {
         if (onNodeHoverEnd) onNodeHoverEnd();

        svgGroup.selectAll(".ribbon")
            .transition("groupHoverEnd").duration(hoverTransitionDuration)
            .style("opacity", 1); // Group opacity takes over
        svgGroup.selectAll(".arcs g path")
            .transition("groupHoverEnd").duration(hoverTransitionDuration)
            .style("opacity", 1)
            .style("stroke-width", 0.5);
      });

    // --- Optional: Ribbon Hover Effects ---
    ribbons
        .on("mouseover", (event, d) => {
            // Optionally call hover start for source/target? Might be too noisy.
            // if (onNodeHoverStart && nodes[d.source.index]) onNodeHoverStart(nodes[d.source.index].id);
            svgGroup.selectAll(".ribbon").filter(r => r !== d)
                .transition("ribbonHover").duration(hoverTransitionDuration)
                .style("opacity", 0.1);
             d3.select(event.currentTarget)
                .transition("ribbonHover").duration(hoverTransitionDuration)
                .style("opacity", 0.9);
            svgGroup.selectAll(".arcs g path")
                .filter(a => a.index !== d.source.index && a.index !== d.target.index)
                .transition("ribbonHover").duration(hoverTransitionDuration)
                .style("opacity", 0.3);
        })
        .on("mouseout", (event, d) => {
            // if (onNodeHoverEnd) onNodeHoverEnd(); // Reset hover state
            svgGroup.selectAll(".ribbon")
                .transition("ribbonHoverEnd").duration(hoverTransitionDuration)
                .style("opacity", 1); // Group opacity takes over
            svgGroup.selectAll(".arcs g path")
                .transition("ribbonHoverEnd").duration(hoverTransitionDuration)
                .style("opacity", 1);
        });

    // --- Optional: Arc Labels ---
    // Adjust threshold and radius as needed for clarity
    const labelRadius = outerRadius + 5;
    group.append("text")
        .each(d => {
             d.angle = (d.startAngle + d.endAngle) / 2;
             d.nodeData = nodes[d.index]; // Attach node data for easy access
        })
        // Filter to show labels only for arcs with substantial value (connection count)
        .filter(d => d.value > (validLinksProcessed * 0.01) && d.value > 1) // Example: >1% of total links shown & > 1 link
        .attr("dy", ".35em")
        .attr("class", "arc-label fill-current text-gray-700 dark:text-gray-300 text-[8px] sm:text-[10px]") // Smaller font size base
        .attr("transform", d => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${labelRadius})
            ${d.angle > Math.PI ? "rotate(180)" : ""}
        `)
        .style("text-anchor", d => d.angle > Math.PI ? "end" : "start")
        .text(d => d.nodeData?.label); // Use label from derived node data


  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd]); // Effect dependencies

  return (
    <svg ref={svgRef} width={width} height={height} className="chord-diagram max-w-full max-h-full"></svg>
  );
}

export default ChordDiagram;