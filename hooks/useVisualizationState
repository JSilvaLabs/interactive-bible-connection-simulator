// hooks/useVisualizationState.js
"use client";

import { useState, useEffect, useCallback } from 'react';
import { getConnectionsFor, getChapters } from '@/utils/dataService';

/**
 * Custom hook to manage state related to user selections,
 * data filtering for visualization, and interaction callbacks.
 */
export function useVisualizationState(bibleData, allReferencesData) {
    // --- State for User Selections & View ---
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [viewMode, setViewMode] = useState('chapter'); // 'chapter' or 'verse'
    const [chapterList, setChapterList] = useState([]);

    // --- State for Derived/Filtered Data ---
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [isFiltering, setIsFiltering] = useState(false);

    // --- State for Diagram Interactions ---
    const [selectedNodeId, setSelectedNodeId] = useState(null); // Clicked node ID
    const [hoveredNodeId, setHoveredNodeId] = useState(null); // Hovered node ID

    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        // Only filter if we have the necessary data and selections
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true);
            setSelectedNodeId(null); // Reset selection when filter changes
            setHoveredNodeId(null);  // Reset hover when filter changes

            // Use rAF to allow UI update before potentially blocking filter logic
            requestAnimationFrame(() => {
                if (!isMounted) return;
                try {
                    // Call the potentially optimized dataService function
                    const filteredData = getConnectionsFor(
                        allReferencesData,
                        selectedBook,
                        selectedChapter,
                        viewMode
                    );
                    if (isMounted) setFilteredConnectionData(filteredData);
                } catch (err) {
                    console.error("useVisualizationState: Filtering failed:", err);
                    if (isMounted) setFilteredConnectionData(null); // Clear data on error
                    // Optionally bubble error up or set local error state
                } finally {
                    if (isMounted) setIsFiltering(false);
                }
            });
        } else {
            // Clear data if selection is incomplete
            setFilteredConnectionData(null);
            setIsFiltering(false); // Ensure filtering state is reset
        }
        return () => { isMounted = false; }; // Cleanup flag
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Dependencies

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null); // Reset chapter selection
        setFilteredConnectionData(null); // Clear diagram
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []); // Update chapter list
    }, [bibleData]); // Depends on bibleData for getChapters

    const handleChapterChange = useCallback((chapterNum) => {
        setSelectedChapter(chapterNum);
        // Filtering effect will run automatically due to state change
    }, []);

    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter'));
        // Filtering effect will run automatically due to state change
    }, []);

    const handleNodeSelect = useCallback((nodeId) => {
        setSelectedNodeId(nodeId);
        setHoveredNodeId(null); // Clear hover on click
    }, []);

    const handleNodeHoverStart = useCallback((nodeId) => {
        setHoveredNodeId(nodeId);
    }, []);

    const handleNodeHoverEnd = useCallback(() => {
        setHoveredNodeId(null);
    }, []);

    // --- Return State and Handlers ---
    return {
        // Selection State
        selectedBook,
        selectedChapter,
        viewMode,
        chapterList,
        // Derived Data State
        filteredConnectionData,
        isFiltering,
        // Interaction State
        selectedNodeId,
        hoveredNodeId,
        // Handlers
        handleBookChange,
        handleChapterChange,
        handleToggleView,
        handleNodeSelect,
        handleNodeHoverStart,
        handleNodeHoverEnd
    };
}