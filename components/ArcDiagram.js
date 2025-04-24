// components/ArcDiagram.js (MRP v1.2 - Dim Unselected Arcs on Verse Select)
"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getNodeMetadata } from '@/utils/dataService';

// --- D3 Helper Functions (setupScales, calculateArcPath - remain unchanged) ---
function setupScales(nodes, width, height, nodeRadius) {
    const defaultReturn = { yScale: d3.scalePoint(), colorScale: d3.scaleOrdinal(), axisXPosition: 0 };
    if (!nodes || nodes.length === 0 || !width || width <= 0 || !height || height <= 0 || !nodeRadius || nodeRadius <= 0) { console.error("[setupScales] Invalid parameters."); return defaultReturn; }
    try {
        const padding = Math.min(0.8, Math.max(0.05, 1 - nodes.length / (height / (nodeRadius * 3))));
        const nodeIds = nodes.map(d => d.id);
        if(nodeIds.length === 0) return defaultReturn;
        const yScale = d3.scalePoint().domain(nodeIds).range([0, height]).padding(padding);
        if (typeof yScale?.bandwidth !== 'function') { console.error("[setupScales] yScale creation failed or invalid."); return defaultReturn; }
        const bookNames = Array.from(new Set(nodes.map(d => d.book || 'Unknown')));
        const colorScheme = bookNames.length > 10 ? d3.schemeSpectral[Math.min(bookNames.length, 11)] : d3.schemeCategory10;
        const colorScale = d3.scaleOrdinal(colorScheme).domain(bookNames);
        if (typeof colorScale !== 'function') { console.error("[setupScales] colorScale creation failed."); return defaultReturn; }
        const axisXPosition = 0;
        return { yScale, colorScale, axisXPosition };
    } catch (error) { console.error("[setupScales] Error:", error); return defaultReturn; }
}

function calculateArcPath(d, yScale, axisXPosition) {
    const y1 = yScale(d.source); const y2 = yScale(d.target);
    if (y1 === undefined || y2 === undefined) { return null; }
    const radius = Math.abs(y2 - y1) / 2;
    if (radius <= 0.1) return `M ${axisXPosition},${y1} L ${axisXPosition},${y2}`;
    const sweepFlag = y1 < y2 ? 1 : 0;
    return `M ${axisXPosition},${y1} A ${radius},${radius} 0 0,${sweepFlag} ${axisXPosition},${y2}`;
}


// --- Updated Arc Drawing Helper ---
/**
 * Draws and updates arc paths. Includes default highlighting for selected verse arcs
 * AND dimming for non-connected arcs when a verse is selected.
 * @param {d3.Selection} selection - Container <g> for arcs.
 * @param {object[]} links - Link data.
 * @param {d3.ScalePoint} yScale - Y scale.
 * @param {d3.ScaleOrdinal} colorScale - Color scale.
 * @param {number} axisXPosition - Axis X position.
 * @param {Map<string, object>} nodeMap - Node lookup map.
 * @param {string|null} selectedNodeId - Currently selected node ID.
 */
function drawAndUpdateArcs(selection, links, yScale, colorScale, axisXPosition, nodeMap, selectedNodeId) {
    const MAX_ARCS_TO_RENDER = 1000; // Keep performance safeguard
    const linksToDraw = links.length > MAX_ARCS_TO_RENDER ? links.slice(0, MAX_ARCS_TO_RENDER) : links;
    if (links.length > MAX_ARCS_TO_RENDER) { console.warn(`[drawAndUpdateArcs] Rendering limited to ${MAX_ARCS_TO_RENDER} arcs.`); }

    const selectedNodeIsVerse = selectedNodeId ? /[v\.]\d+$/i.test(selectedNodeId) : false;

    // Define Arc Styles
    const defaultArcOpacity = 0.5;
    const defaultArcWidth = 1;
    const highlightedArcOpacity = 0.9;
    const highlightedArcWidth = 1.5;
    const dimmedArcOpacity = 0.1; // Opacity for non-selected/non-hovered arcs when a verse is selected

    const paths = selection
        .selectAll("path.arc-path")
        .data(linksToDraw, d => `${d.source}-${d.target}`);

    paths.join(
        enter => enter.append("path")
                     .attr("class", "arc-path")
                     .attr("fill", "none")
                     .attr("stroke", d => colorScale(nodeMap.get(d.source)?.book || 'Unknown'))
                     .attr("d", d => calculateArcPath(d, yScale, axisXPosition))
                      // Set initial width based on selection state
                     .attr("stroke-width", d => {
                        if (selectedNodeIsVerse && (d.source === selectedNodeId || d.target === selectedNodeId)) {
                            return highlightedArcWidth; // Highlight selected verse arcs
                        }
                        return defaultArcWidth; // Default otherwise
                     })
                     .attr("stroke-opacity", 0) // Start hidden
                     // Transition opacity to target value
                     .call(enter => enter.transition("fadeInArc").duration(300)
                        .attr("stroke-opacity", d => {
                            if (selectedNodeIsVerse) {
                                return (d.source === selectedNodeId || d.target === selectedNodeId) ? highlightedArcOpacity : dimmedArcOpacity;
                            }
                            return defaultArcOpacity; // Default if no verse selected
                        }))
                     .call(enter => enter.append("title").text(d => { /* ... tooltip ... */
                          const sourceMeta = getNodeMetadata(d.source); const targetMeta = getNodeMetadata(d.target);
                          return `${sourceMeta.label || d.source} → ${targetMeta.label || d.target}`;
                      })),
        update => update
                     .call(update => update.transition("arcUpdate").duration(250)
                        .attr("stroke", d => colorScale(nodeMap.get(d.source)?.book || 'Unknown'))
                        .attr("d", d => calculateArcPath(d, yScale, axisXPosition))
                        // Update style based on current selection state
                        .attr("stroke-width", d => {
                             if (selectedNodeIsVerse && (d.source === selectedNodeId || d.target === selectedNodeId)) {
                                 return highlightedArcWidth;
                             }
                             return defaultArcWidth;
                         })
                        .attr("stroke-opacity", d => {
                             if (selectedNodeIsVerse) {
                                 return (d.source === selectedNodeId || d.target === selectedNodeId) ? highlightedArcOpacity : dimmedArcOpacity;
                             }
                             return defaultArcOpacity;
                        }))
                     .select("title").text(d => { /* ... tooltip ... */
                         const sourceMeta = getNodeMetadata(d.source); const targetMeta = getNodeMetadata(d.target);
                         return `${sourceMeta.label || d.source} → ${targetMeta.label || d.target}`;
                     }),
        exit => exit
                     .call(exit => exit.transition("fadeOutArc").duration(200).attr("stroke-opacity", 0).remove())
    );
}


// --- Node Drawing Helper (drawAndUpdateNodes - remains unchanged from v1.1) ---
function drawAndUpdateNodes(selection, nodes, yScale, colorScale, nodeRadius, axisXPosition, labelFontSize, labelXOffset, handlers, selectedNodeId, hoveredNodeId, styles) {
    const {
        selectedStrokeWidth, hoverStrokeWidth, defaultStrokeWidth,
        selectedStrokeColor, hoverStrokeColor,
        selectedFillOpacity, hoverFillOpacity, defaultFillOpacity,
        selectedFontWeight, defaultFontWeight, transitionDuration
     } = styles;
    const nodeSpacing = yScale.step();
    const showLabels = nodeSpacing > (labelFontSize * 1.5);
    const nodeGroups = selection.selectAll("g.node-group").data(nodes, d => d.id);
    nodeGroups.join(
        enter => { /* ... implementation from v1.1 ... */
            const g = enter.append("g").attr("class", "node-group").attr("cursor", "pointer").style("opacity", 0).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`).on("mouseover", handlers.mouseover).on("mouseout", handlers.mouseout).on("click", handlers.click);
            const isSelected = d => d.id === selectedNodeId; const isHovered = d => d.id === hoveredNodeId;
            g.append("circle").attr("r", nodeRadius).attr("cx", 0).attr("cy", 0).attr("fill", d => colorScale(d.book || 'Unknown')).style("fill-opacity", d => isHovered(d) ? hoverFillOpacity : (isSelected(d) ? selectedFillOpacity : defaultFillOpacity)).style("stroke", d => isHovered(d) ? hoverStrokeColor : (isSelected(d) ? selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7))).style("stroke-width", d => isHovered(d) ? hoverStrokeWidth : (isSelected(d) ? selectedStrokeWidth : defaultStrokeWidth)).append("title").text(d => d.label || d.id);
            g.append("text").attr("class", "node-label fill-current text-gray-700 dark:text-gray-300").style("font-size", `${labelFontSize}px`).style("font-weight", d => isSelected(d) ? selectedFontWeight : defaultFontWeight).attr("x", labelXOffset).attr("dy", "0.35em").attr("text-anchor", "end").style("pointer-events", "none").attr("display", showLabels ? null : "none").text(d => d.label || d.id);
            g.transition("fadeInNode").duration(transitionDuration).style("opacity", 1); return g;
         },
        update => { /* ... implementation from v1.1 ... */
             const isSelected = d => d.id === selectedNodeId; const isHovered = d => d.id === hoveredNodeId;
             update.transition("updateNodePos").duration(transitionDuration).attr("transform", d => `translate(${axisXPosition},${yScale(d.id) ?? 0})`);
             update.select("circle").transition("updateCircleStyle").duration(transitionDuration).attr("r", nodeRadius).attr("fill", d => colorScale(d.book || 'Unknown')).style("fill-opacity", d => isHovered(d) ? hoverFillOpacity : (isSelected(d) ? selectedFillOpacity : defaultFillOpacity)).style("stroke", d => isHovered(d) ? hoverStrokeColor : (isSelected(d) ? selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7))).style("stroke-width", d => isHovered(d) ? hoverStrokeWidth : (isSelected(d) ? selectedStrokeWidth : defaultStrokeWidth));
             update.select("circle title").text(d => d.label || d.id);
             update.select("text.node-label").attr("display", showLabels ? null : "none").transition("updateLabelStyle").duration(transitionDuration).style("font-size", `${labelFontSize}px`).style("font-weight", d => isSelected(d) ? selectedFontWeight : defaultFontWeight).attr("x", labelXOffset).text(d => d.label || d.id);
             return update;
         },
        exit => exit.transition("fadeOutNode").duration(transitionDuration).style("opacity", 0).remove()
    );
}


// --- Main Component ---
function ArcDiagram({
    svgRef, data, width, height, selectedNodeId,
    onNodeSelect, onNodeHoverStart, onNodeHoverEnd, resetZoomTrigger
}) {
  const zoomGroupRef = useRef();
  const nodeMap = useRef(new Map()).current;
  const zoomBehaviorRef = useRef();
  const hoveredNodeRef = useRef(null);

  // --- Main Effect for Drawing/Updating ---
  useEffect(() => {
    if (!svgRef?.current || !zoomGroupRef?.current) return;
    const rootSvg = d3.select(svgRef.current);
    const zoomGroup = d3.select(zoomGroupRef.current);
    if (!data || !data.nodes || data.nodes.length === 0 || !width || width <= 10 || !height || height <= 50) {
        zoomGroup.selectAll("*").remove(); return;
    }

    // Define Parameters & Styles
    const nodeRadius = 7; const labelFontSize = 11; const labelXOffset = -(nodeRadius + 6);
    const hoverTransitionDuration = 100; const transitionDuration = 150;
    const styles = { // Style constants remain the same
        selectedStrokeWidth: 2.0, hoverStrokeWidth: 2.5, defaultStrokeWidth: 0.5,
        selectedStrokeColor: 'black', hoverStrokeColor: 'rgb(29, 78, 216)',
        selectedFillOpacity: 0.9, hoverFillOpacity: 1.0, defaultFillOpacity: 0.7,
        selectedFontWeight: 'bold', defaultFontWeight: 'normal', transitionDuration: transitionDuration
    };
    // Add Dimmed Opacity for arcs
    const dimmedArcOpacity = 0.1;

    // Build Node Map & Calculate Scales (remain the same)
    nodeMap.clear(); data.nodes.forEach((node, index) => nodeMap.set(node.id, { index: index, ...node }));
    const { yScale, colorScale, axisXPosition } = setupScales(data.nodes, width, height, nodeRadius);
    if (!yScale.domain || yScale.domain().length === 0) { zoomGroup.selectAll("*").remove(); return; }

    // Prepare Containers (remain the same)
    const arcsContainer = zoomGroup.selectAll("g.arcs-container").data([null]).join("g").attr("class", "arcs-container");
    const nodesContainer = zoomGroup.selectAll("g.nodes-container").data([null]).join("g").attr("class", "nodes-container");

    // --- Define Interaction Handlers (handleMouseOut needs refinement) ---
     const handleMouseOver = (event, d) => {
         hoveredNodeRef.current = d.id;
         if (onNodeHoverStart) onNodeHoverStart(d.id);
         // Highlight hovered node circle
         d3.select(event.currentTarget).select('circle').attr('r', nodeRadius + 2).style('fill-opacity', styles.hoverFillOpacity).style("stroke", styles.hoverStrokeColor).style("stroke-width", styles.hoverStrokeWidth);
         // Highlight connected arcs, dim others
         arcsContainer.selectAll('path.arc-path').transition("arcHover").duration(hoverTransitionDuration).style('stroke-opacity', link => (link.source === d.id || link.target === d.id) ? 0.9 : dimmedArcOpacity) // Use dimmed opacity for non-hovered
            .style('stroke-width', link => (link.source === d.id || link.target === d.id) ? 1.5 : 1);
     };

     const handleMouseOut = (event, d) => {
         if (hoveredNodeRef.current === d.id) { hoveredNodeRef.current = null; if (onNodeHoverEnd) onNodeHoverEnd(); }

         const isSelected = d.id === selectedNodeId;
         // Reset node circle style
         d3.select(event.currentTarget).select('circle').transition("hoverOff").duration(hoverTransitionDuration).attr('r', nodeRadius).style('fill-opacity', isSelected ? styles.selectedFillOpacity : styles.defaultFillOpacity).style("stroke", isSelected ? styles.selectedStrokeColor : d3.rgb(colorScale(d.book || 'Unknown')).darker(0.7)).style("stroke-width", isSelected ? styles.selectedStrokeWidth : styles.defaultStrokeWidth);

         // --- CORRECTED Arc Reset Logic ---
         const selectedNodeIsVerse = selectedNodeId ? /[v\.]\d+$/i.test(selectedNodeId) : false;
         arcsContainer.selectAll('path.arc-path').transition("arcHoverOff").duration(hoverTransitionDuration)
            // Set width based on whether the link involves the selected verse
            .style('stroke-width', link => selectedNodeIsVerse && (link.source === selectedNodeId || link.target === selectedNodeId) ? 1.5 : 1) // Use highlighted or default width
            // Set opacity based on whether a verse is selected AND whether the link involves it
            .style('stroke-opacity', link => {
                 if (selectedNodeIsVerse) {
                     return (link.source === selectedNodeId || link.target === selectedNodeId) ? 0.9 : dimmedArcOpacity; // Highlighted or dimmed
                 }
                 return 0.5; // Default opacity if no verse selected
             });
         // --- END Corrected Arc Reset ---
     };

     const handleClick = (event, d) => { if (onNodeSelect) onNodeSelect(d.id); event.stopPropagation(); };

    // --- Draw Elements ---
    drawAndUpdateArcs(arcsContainer, data.links, yScale, colorScale, axisXPosition, nodeMap, selectedNodeId); // Pass selectedNodeId
    drawAndUpdateNodes(nodesContainer, data.nodes, yScale, colorScale, nodeRadius, axisXPosition, labelFontSize, labelXOffset, { mouseover: handleMouseOver, mouseout: handleMouseOut, click: handleClick }, selectedNodeId, hoveredNodeRef.current, styles);

    // --- D3 Zoom Setup (remains the same) ---
    const handleZoom = (event) => { zoomGroup.attr('transform', event.transform); };
    if (!zoomBehaviorRef.current) { zoomBehaviorRef.current = d3.zoom().scaleExtent([0.1, 10]).translateExtent([[-width * 1, -height * 1], [width * 2, height * 2]]).on('zoom', handleZoom); }
    if (svgRef.current && zoomBehaviorRef.current) { rootSvg.call(zoomBehaviorRef.current).on("dblclick.zoom", null); }

    // Cleanup
    return () => { if (svgRef.current) d3.select(svgRef.current).on('.zoom', null); };

  }, [data, width, height, selectedNodeId, onNodeSelect, onNodeHoverStart, onNodeHoverEnd, svgRef]);

  // --- Effect for Zoom Reset (remains the same) ---
  useEffect(() => {
    if (resetZoomTrigger > 0 && svgRef.current && zoomBehaviorRef.current) {
      const rootSvg = d3.select(svgRef.current);
      rootSvg.transition().duration(500).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  }, [resetZoomTrigger, svgRef]);

  return <g ref={zoomGroupRef} id="zoom-pan-group"></g>;
}

export default ArcDiagram;