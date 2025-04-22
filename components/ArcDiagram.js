// components/ArcDiagram.js (MVP v7.0 - Debugging Logs Added)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---

// Calculates scales based on current data and dimensions
function setupScales(nodes, width, height, nodeRadius) {
    const padding = Math.min(0.8, Math.max(0.1, 1 - nodes.length / (height / (nodeRadius * 4))));
    const yScale = d3.scalePoint()
      .domain(nodes.map(d => d.id))
      .range([0, height])
      .padding(padding);

    const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
    const colorScale = d3.scaleOrdinal(bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10)
                        .domain(bookNames);
    const axisXPosition = 0; // Axis on left edge of inner area
    // console.log(`[setupScales] yScale Domain Size: ${yScale.domain().length}, Range: [${yScale.range()[0]}, ${yScale.range()[1]}], Step: ${yScale.step()?.toFixed(2)}`);
    return { yScale, colorScale, axisXPosition };
}

// Calculates the SVG path data for an arc
function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source);
    const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) {
        // console.warn(`[calcArcPath] Skipping arc: Cannot find y-position for ${d.source} or ${d.target}`);
        return null;
    }
    const radius = Math.abs(y2 - y1) / 2;
    if (radius <= 0) {
        // console.warn(`[calcArcPath] Skipping arc: Zero radius for ${d.source} -> ${d.target}`);
        return null;
    }
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}

// Draws/Updates the arcs using the .join() pattern
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) {
    // console.log(`[drawArcs] Drawing ${links.length} links.`);
    const joinedArcs = selection // This is the <g class="arcs-container"> selection
        .attr("fill", "none")
        .attr("stroke-opacity", 0.6) // Base opacity
        .attr("stroke-width", 1)   // Base width
        .selectAll("path.arc-path")
        .data(links, d => `${d.source}-${d.target}`) // Key function
        .join(
            enter => enter.append("path")
                         .attr("class", "arc-path")
                         .attr("stroke-opacity", 0) // Start transparent
                         .attr("stroke", d => { const sourceNode = nodeMap.get(d.source); return colorScale(sourceNode?.book || 'Unknown'); })
                         .attr("d", d => calculateArcPath(d, yScale, axisXPosition)) // Calculate path
                         .call(enter => enter.transition("fadeIn").duration(300).attr("stroke-opacity", 0.6)) // Fade in
                         .call(enter => enter.append("title").text(d => `${nodeMap.get(d.source)?.label} → ${nodeMap.get(d.target)?.label}`)), // Tooltip
            update => update
                         .call(update => update.transition("arcUpdate").duration(150) // Transition updates
                            .attr("stroke", d => colorScale(nodeMap.get(d.source)?.book || 'Unknown')) // Update color
                            .attr("d", d => calculateArcPath(d, yScale, axisXPosition))), // Recalculate path
            exit => exit
                         .call(exit => exit.transition("fadeOut").duration(200).attr("stroke-opacity", 0).remove()) // Fade out
        );
     console.log(`[drawArcs] Joined arcs selection size: ${joinedArcs.size()}`);
}

// Draws/Updates the nodes using the .join() pattern
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers) {
    // console.log(`[drawNodes] Drawing ${nodes.length} nodes.`);
     const joinedNodes = selection // This is the <g class="nodes-container"> selection
        .selectAll("g.node-group")
        .data(nodes, d => d.id) // Key nodes by ID
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("class", "node-group")
                    .attr("cursor", "pointer")
                    .style("opacity", 0) // Start transparent
                    .attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);

                g.append("circle").attr("r", nodeRadius).attr("cx", 0).attr("cy", 0).attr("fill", d => colorScale(d.book || 'Unknown')).style("fill-opacity", 0.7).style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)).style("stroke-width", 0.5).append("title").text(d => d.label);
                g.append("text").attr("class", "node-label fill-current text-gray-700 dark:text-gray-300").style("font-size", labelFontSize).attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none").attr("display", showLabels ? null : "none").text(d => d.label); // Set initial visibility
                g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click); // Attach handlers on enter
                g.transition("fadeIn").duration(300).style("opacity", 1);
                return g;
            },
            update => {
                update.transition("updatePos").duration(150).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`); // Update position
                update.select("circle").transition("updateCircle").duration(150).attr("r", nodeRadius).attr("fill", d => colorScale(d.book || 'Unknown')).style("stroke", d => d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)); // Update circle
                update.select("circle title").text(d => d.label); // Update tooltip

                 // Update label visibility, size, offset, text
                 update.select("text.node-label")
                     .attr("display", showLabels ? null : "none")
                     .transition("updateLabel").duration(150) // Optional transition for label updates
                     .style("font-size", labelFontSize)
                     .attr("x", labelXOffset)
                     .text(d => d.label);
                 return update;
            },
            exit => exit.transition("fadeOut").duration(200).style("opacity", 0).remove() // Remove old nodes
        );
      console.log(`[drawNodes] Joined nodes selection size: ${joinedNodes.size()}`);
}


// --- Main Component ---
function ArcDiagram({ svgRef, data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd }) {
  const zoomGroupRef = useRef(); // Ref for the <g> element that holds nodes and arcs
  const nodeMap = useRef(new Map()).current;
  const zoomBehaviorRef = useRef(); // Ref to store D3 zoom behavior instance

  useEffect(() => {
    // --- Guard Clause: Ensure Refs and Dimensions are ready ---
    if (!svgRef?.current || !zoomGroupRef?.current) {
        console.log("ArcDiagram useEffect: Waiting for refs..."); return;
    }
    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
        console.log("ArcDiagram useEffect: Invalid data or dimensions. Clearing.");
        d3.select(zoomGroupRef.current).selectAll("*").remove(); return;
    }

    // --- Selections ---
    const rootSvg = d3.select(svgRef.current);    // The <svg> element itself
    const zoomGroup = d3.select(zoomGroupRef.current); // The <g> inside svg to apply zoom transform to
    // Clear previous content INSIDE the zoom group before drawing
    zoomGroup.selectAll("*").remove();
    console.log(`[ArcDiagram] Rendering: ${data.nodes.length} nodes, ${data.links.length} links. Dims: ${width}x${height}`);

    // --- Build Node Map ---
    nodeMap.clear();
    data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));

    // --- Determine Adaptive Parameters ---
    const nodeCount = data.nodes.length;
    const minLabelWidthThreshold = 90; const maxNodesForLabels = 120;
    const nodeDensityThreshold = 0.25; const calculatedNodeDensity = nodeCount / height;
    const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold;
    const isDense = calculatedNodeDensity > 0.18;
    const nodeRadius = height < 350 ? 6 : (isDense ? 7 : 8); // Larger nodes
    const hoverRadiusIncrease = 3;
    const labelFontSize = height < 350 ? '10px' : (isDense ? '11px' : '12px');
    const labelXOffset = -(nodeRadius + 7); // Adjusted offset

    // --- Setup Scales ---
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

    // --- Prepare Containers ---
    // Append containers directly to the zoomGroup
    const arcsContainer = zoomGroup.append("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.append("g").attr("class", "nodes-container");

    // --- Define Event Handlers ---
     const hoverTransitionDuration = 100;
     const handlers = {
        mouseover: (event, d) => {
            if (onNodeHoverStart) onNodeHoverStart(d.id);
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1);
            arcsContainer.selectAll('path.arc-path')
                 .transition("hover").duration(hoverTransitionDuration)
                 .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                 .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
        },
        mouseout: (event, d) => {
            if (onNodeHoverEnd) onNodeHoverEnd();
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', 0.7);
            arcsContainer.selectAll('path.arc-path')
                .transition("hoverEnd").duration(hoverTransitionDuration)
                .style('stroke-opacity', 0.6) // Restore base opacity
                .style('stroke-width', 1); // Restore base width
        },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };

    // --- Draw Elements using Helpers ---
    // Pass the D3 selections of the containers to the helpers
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers);

    // --- D3 Zoom Setup ---
    const handleZoom = (event) => {
        zoomGroup.attr('transform', event.transform); // Apply transform
    };

    // Initialize or update zoom behavior
    if (!zoomBehaviorRef.current) {
        zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom);
    }

    // Apply zoom behavior to the root SVG element if ref is valid
    if (svgRef.current) {
        rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null);
        // console.log("[ArcDiagram] Zoom behavior attached/updated.");
        // Optionally apply initial transform if needed (e.g., after data changes)
        // rootSvg.call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    } else {
         console.error("[ArcDiagram] svgRef not available to attach zoom.");
    }

    // --- Cleanup Effect ---
    return () => {
        // Remove zoom listener from the SVG element on cleanup
        if (svgRef.current) {
            d3.select(svgRef.current).on('.zoom', null);
            // console.log("[ArcDiagram] Zoom behavior detached.");
        }
    };

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]); // Dependencies

  // This component returns the group element that holds the visualization content
  // and is transformed by the zoom behavior attached to the parent SVG.
  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;