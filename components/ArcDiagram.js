// components/ArcDiagram.js (MVP v8.2 Update - Implement Selection Highlight)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// --- D3 Helper Functions ---
function setupScales(nodes, width, height, nodeRadius) { /* ... (no changes) ... */ }
function calculateArcPath(d, yScale, axisXPosition) { /* ... (no changes) ... */ }
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap) { /* ... (no changes) ... */ }

// --- Updated drawAndUpdateNodes Helper ---
function drawAndUpdateNodes(
    selection, nodes, yScale, colorScale, nodeRadius, axisXPosition,
    showLabels, labelFontSize, labelXOffset, handlers,
    selectedNodeId // <<< New parameter
) {
    // --- Define Highlight Styles ---
    const selectedStrokeWidth = 2.0;
    const defaultStrokeWidth = 0.5;
    const selectedStrokeColor = 'black'; // Or use a theme color like 'currentColor' potentially
    const selectedFontWeight = 'bold';
    const defaultFontWeight = 'normal';
    const selectedFillOpacity = 0.9;
    const defaultFillOpacity = 0.7;
    // ---

     selection // This is the <g class="nodes-container"> selection
        .selectAll("g.node-group")
        .data(nodes, d => d.id) // Key nodes by ID
        .join(
            enter => { // Create new node groups
                const g = enter.append("g")
                    .attr("class", "node-group")
                    .attr("cursor", "pointer")
                    .style("opacity", 0)
                    .attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);

                // Add circle - set initial style based on selection
                g.append("circle")
                    .attr("r", nodeRadius)
                    .attr("cx", 0).attr("cy", 0)
                    .attr("fill", d => colorScale(d.book || 'Unknown'))
                    .style("fill-opacity", d => d.id === selectedNodeId ? selectedFillOpacity : defaultFillOpacity) // Initial opacity based on selection
                    .style("stroke", d => d.id === selectedNodeId ? selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)) // Initial stroke color
                    .style("stroke-width", d => d.id === selectedNodeId ? selectedStrokeWidth : defaultStrokeWidth) // Initial stroke width
                    .append("title").text(d => d.label);

                // Add text element (visibility controlled by display attribute)
                g.append("text")
                    .attr("class", "node-label fill-current text-gray-700 dark:text-gray-300")
                    .style("font-size", labelFontSize)
                    .style("font-weight", d => d.id === selectedNodeId ? selectedFontWeight : defaultFontWeight) // Initial font weight
                    .attr("x", labelXOffset)
                    .attr("dy", "0.35em").attr("text-anchor", "end")
                    .style("pointer-events", "none")
                    .attr("display", showLabels ? null : "none") // Initial visibility
                    .text(d => d.label);

                 g.on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
                 g.transition("fadeIn").duration(300).style("opacity", 1);
                 return g;
            },
            update => { // Update existing node groups
                update.transition("updatePos").duration(150)
                      .attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`); // Update position

                // Update circle properties including selection styles
                update.select("circle")
                      .transition("updateCircle").duration(150)
                      .attr("r", nodeRadius)
                      .attr("fill", d => colorScale(d.book || 'Unknown'))
                      .style("fill-opacity", d => d.id === selectedNodeId ? selectedFillOpacity : defaultFillOpacity) // Apply selection opacity
                      .style("stroke", d => d.id === selectedNodeId ? selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)) // Apply selection stroke
                      .style("stroke-width", d => d.id === selectedNodeId ? selectedStrokeWidth : defaultStrokeWidth); // Apply selection stroke width
                update.select("circle title").text(d => d.label); // Update tooltip

                 // Update label properties including selection styles
                 const labelSelection = update.selectAll("text.node-label").data(d => showLabels ? [d] : []);
                 labelSelection.enter().append("text").attr("class", "node-label ...").style("pointer-events", "none").attr("dy", "0.35em").attr("text-anchor", "end"); // Enter logic
                 labelSelection.merge(labelSelection.enter()) // Apply updates to enter+update
                        .attr("display", showLabels ? null : "none")
                        .transition("updateLabel").duration(150) // Transition label updates
                        .style("font-size", labelFontSize)
                        .style("font-weight", d => d.id === selectedNodeId ? selectedFontWeight : defaultFontWeight) // Apply selection font weight
                        .attr("x", labelXOffset)
                        .text(d => d.label);
                 labelSelection.exit().remove();
                 return update;
            },
            exit => exit.transition("fadeOut").duration(200).style("opacity", 0).remove()
        );
}


// --- Main Component ---
function ArcDiagram({
    svgRef, data, width, height,
    selectedNodeId, // <<< Added prop
    onNodeSelect, onNodeHoverStart, onNodeHoverEnd,
    resetZoomTrigger
}) {
  const zoomGroupRef = useRef();
  const nodeMap = useRef(new Map()).current;
  const zoomBehaviorRef = useRef();

  useEffect(() => {
    // --- Guard Clauses & Setup ---
    if (!svgRef?.current || !zoomGroupRef?.current) return;
    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    if (!data || !data.nodes || data.nodes.length === 0 || width <= 10 || height <= 50) {
        zoomGroup.selectAll("*").remove(); return;
    }
    // Don't clear zoom group here if using .join() correctly, allows transitions
    // zoomGroup.selectAll("*").remove();

    // --- Build Node Map, Determine Params, Setup Scales ---
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    // ... (adaptive parameter calculations: nodeRadius, showLabels, etc. - same as v6.1) ...
    const nodeCount = data.nodes.length; const minLabelWidthThreshold = 90; const maxNodesForLabels = 120; const nodeDensityThreshold = 0.25; const calculatedNodeDensity = nodeCount / height; const showLabels = width > minLabelWidthThreshold && nodeCount <= maxNodesForLabels && calculatedNodeDensity < nodeDensityThreshold; const isDense = calculatedNodeDensity > 0.18; const nodeRadius = height < 350 ? 6 : (isDense ? 7 : 8); const hoverRadiusIncrease = 3; const labelFontSize = height < 350 ? '10px' : (isDense ? '11px' : '12px'); const labelXOffset = -(nodeRadius + 7);
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);

    // --- Prepare Containers ---
    const arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

     // --- Define Highlight Styles ---
    const selectedStrokeWidth = 2.0; const defaultStrokeWidth = 0.5;
    const selectedStrokeColor = 'black'; const selectedFontWeight = 'bold';
    const defaultFontWeight = 'normal'; const selectedFillOpacity = 0.9;
    const defaultFillOpacity = 0.7;

    // --- Define Event Handlers (incorporating selectedNodeId check) ---
     const hoverTransitionDuration = 100;
     const handlers = {
        mouseover: (event, d) => {
            if (onNodeHoverStart) onNodeHoverStart(d.id);
            const currentTarget = d3.select(event.currentTarget);
            currentTarget.select('circle').transition("hover").duration(hoverTransitionDuration).attr('r', nodeRadius + hoverRadiusIncrease).style('fill-opacity', 1); // Always increase size/opacity on hover
            currentTarget.select('text.node-label').style('font-weight', selectedFontWeight); // Always bold on hover
            // Highlight arcs, fade others
            arcsContainer.selectAll('path.arc-path')
                 .transition("hover").duration(hoverTransitionDuration)
                 .style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : 0.05)
                 .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 0.5);
        },
        mouseout: (event, d) => {
            if (onNodeHoverEnd) onNodeHoverEnd();
            const currentTarget = d3.select(event.currentTarget);
            const isSelected = d.id === selectedNodeId; // Check if this node is the selected one

            // Revert to selected style OR default style
            currentTarget.select('circle').transition("hoverEnd").duration(hoverTransitionDuration)
                         .attr('r', nodeRadius) // Revert size
                         .style('fill-opacity', isSelected ? selectedFillOpacity : defaultFillOpacity) // Revert opacity
                         .style('stroke-width', isSelected ? selectedStrokeWidth : defaultStrokeWidth) // Revert stroke width
                         .style('stroke', isSelected ? selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)); // Revert stroke color
            currentTarget.select('text.node-label')
                         .style('font-weight', isSelected ? selectedFontWeight : defaultFontWeight); // Revert font weight

            // Reset arc styles
            arcsContainer.selectAll('path.arc-path')
                .transition("hoverEnd").duration(hoverTransitionDuration)
                .style('stroke-opacity', 0.6) // Restore base opacity
                .style('stroke-width', 1); // Restore base width
        },
        click: (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); }
     };

    // --- Draw Elements using Helpers ---
    // Pass selectedNodeId to drawAndUpdateNodes
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap);
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, showLabels, labelFontSize, labelXOffset, handlers, selectedNodeId); // Pass selectedNodeId

    // --- D3 Zoom Setup ---
    const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); };
    if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).on('zoom', handleZoom); }
    if (svgRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); }

    // Cleanup zoom listener
    return () => { if (svgRef.current) { d3.select(svgRef.current).on('.zoom', null); } };

  }, [data, width, height, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef, selectedNodeId]); // Add selectedNodeId dependency

  // --- Effect for Zoom Reset ---
   useEffect(() => {
     if (resetZoomTrigger > 0) {
         if (svgRef?.current && zoomBehaviorRef.current) {
             console.log("ArcDiagram: Resetting zoom via trigger");
             d3.select(svgRef.current).transition("resetZoom").duration(500)
               .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
         }
     }
   }, [resetZoomTrigger, svgRef]); // Dependencies


  return <g ref={zoomGroupRef}></g>;
}

export default ArcDiagram;