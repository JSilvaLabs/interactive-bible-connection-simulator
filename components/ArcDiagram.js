// components/ArcDiagram.js (MVP v6.2 Update - Larger Nodes)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---
// (Assuming setupScales, calculateArcPath helpers exist as before)
function setupScales(nodes, width, height, nodeRadius) {
    const yScale = d3.scalePoint()
      .domain(nodes.map(d => d.id))
      .range([0, height])
      // Padding calculation might need slight tuning with larger radius
      .padding(Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 3.5))))); // Slightly increase denominator if needed

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);
    const axisXPosition = 0;
    return { yScale, colorScale, axisXPosition };
}

function calculateArcPath(d, yScale, axisXPosition) {
    // ... (same as before) ...
     const y1 = yScale(d.source); const y2 = yScale(d.target); if (y1 === undefined || y2 === undefined) return null; const radius = Math.abs(y2 - y1) / 2; const sweepFlag = y1 < y2 ? 1 : 0; return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
    // ... (same join logic as before) ...
     selection.selectAll("path.arc-path").data(links, d => `${d.source}-${d.target}`).join( /* ... */ );
}

function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers) {
    selection.selectAll("g.node-group")
        .data(nodes, d => d.id)
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("class", "node-group")
                    .attr("cursor", "pointer")
                    .style("opacity", 0)
                    .attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);
                // Apply nodeRadius to new circles
                g.append("circle").attr("r", nodeRadius).style("fill-opacity", 0.7).style("stroke-width", 0.5).append("title");
                if (showLabels) { // Apply label offsets/styles to new labels
                    g.append("text").attr("class", "node-label ...").style("font-size", labelFontSize).attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none");
                }
                g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                g.transition("fadeIn").duration(300).style("opacity", 1);
                return g;
            },
            update => {
                update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id)})`);
                // Apply updated nodeRadius to existing circles
                update.select("circle").transition("updateCircle").duration(150).attr("r", nodeRadius).attr("fill", d => colorScale(d.book || 'Unknown')).style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7));
                update.select("circle title").text(d => d.label);

                 // Update labels (visibility, text, font size, offset)
                 const labelUpdate = update.selectAll("text.node-label").data(d => showLabels ? [d] : []);
                 labelUpdate.enter().append("text").attr("class", "node-label ...").style("pointer-events", "none").attr("dy", "0.35em").attr("text-anchor", "end"); // Add basics
                 labelUpdate.merge(labelUpdate.enter()) // Apply to new and existing
                        .style("font-size", labelFontSize).attr("x", labelXOffset).text(d => d.label);
                 labelUpdate.exit().remove();
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
    svgGroup.selectAll("*").remove();

    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) { return; }

    // --- Build Node Map ---
    nodeMap.clear();
    data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));

    // --- Determine Adaptive & Updated Parameters ---
    const nodeCount = data.nodes.length;
    const minLabelWidthThreshold = 80; const maxNodesForLabels = 100;
    const nodeDensityThreshold = 0.2; const calculatedNodeDensity = nodeCount / height;
    const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold;
    const isDense = calculatedNodeDensity > 0.15;

    // *** MVP v6.1: Increase Node Radius ***
    const nodeRadius = height < 400 ? 4 : (isDense ? 5 : 6); // Increased base size
    const hoverRadiusIncrease = 3; // Increase size on hover
    // *** End Node Radius Increase ***

    // Adjust label size and offset based on node radius
    const labelFontSize = height < 400 ? '9px' : (isDense ? '10px' : '11px'); // Slightly larger labels too
    const labelXOffset = -(nodeRadius + 5); // Adjusted offset for larger radius + padding

    // --- Setup Scales ---
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

     // --- Define Event Handlers ---
     const hoverTransitionDuration = 100;
     const handlers = {
        mouseover: (event, d) => {
            if (onNodeHoverStart) onNodeHoverStart(d.id);
            const currentTarget = d3.select(event.currentTarget);
            // Increase radius more on hover
            currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1);
            currentTarget.select('text.node-label').style('font-weight', 'bold');
            arcsContainer.selectAll('path.arc-path') // Use arcsContainer selection
                .transition("hover").duration(hoverTransitionDuration)
                .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
        },
        mouseout: (event, d) => {
            if (onNodeHoverEnd) onNodeHoverEnd();
            const currentTarget = d3.select(event.currentTarget);
            // Reset to base radius
            currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', 0.7);
            currentTarget.select('text.node-label').style('font-weight', 'normal');
            arcsContainer.selectAll('path.arc-path') // Use arcsContainer selection
                .transition("hoverEnd").duration(hoverTransitionDuration)
                .style('stroke-opacity', 0.5).style('stroke-width', 1);
        },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };

    // --- Prepare Containers ---
    let arcsContainer = svgGroup.select("g.arcs-container");
    if (arcsContainer.empty()) arcsContainer = svgGroup.append("g").attr("class", "arcs-container");
    let nodesContainer = svgGroup.select("g.nodes-container");
    if (nodesContainer.empty()) nodesContainer = svgGroup.append("g").attr("class", "nodes-container");


    // --- Draw Elements using Helpers ---
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers);

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd]);

  return <g ref={svgGroupRef}></g>;
}

export default ArcDiagram;