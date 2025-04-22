// hooks/useVisualizationState.js
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import necessary functions from dataService
// Ensure getBooks is imported alongside getChapters and getConnectionsFor
import { getConnectionsFor, getChapters, getBooks } from '@/utils/dataService';

/**
 * Custom hook to manage state related to user selections,
 * data filtering for visualization, and interaction callbacks.
 * Also handles setting the default selection after data loads.
 */
export function useVisualizationState(bibleData, allReferencesData) { // Takes loaded data as input
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

     // --- Effect to Set Default Selection ---
     useEffect(() => {
        // Set default only if bibleData is loaded/valid and no book is selected yet
        // This prevents resetting selection if user navigates back/forth or data reloads
        if (bibleData && bibleData.books && !selectedBook && !selectedChapter) {
            // Call getBooks (needs to be imported)
            const books = getBooks(bibleData);
            if (books && books.length > 0) {
                const defaultBook = books[0]; // First canonical book
                // Call getChapters (needs to be imported)
                const defaultChapters = getChapters(bibleData, defaultBook);
                const defaultChapter = defaultChapters.length > 0 ? defaultChapters[0] : null; // Chapter 1

                if (defaultBook && defaultChapter !== null) {
                    // Set state managed by this hook
                    setSelectedBook(defaultBook);
                    setSelectedChapter(defaultChapter);
                    setChapterList(defaultChapters); // Populate chapter list for the selector
                     console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter}`);
                } else {
                     console.warn(`useVisState: Could not find chapters for default book: ${defaultBook}`);
                }
            } else {
                 console.warn("useVisState: Book list derived from bibleData is empty.");
            }
        }
        // Run this effect when bibleData becomes available, or if selection is cleared
    }, [bibleData, selectedBook, selectedChapter]);


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        // Only filter if we have the necessary data and selections
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true);
            setSelectedNodeId(null); // Reset node selection when filter changes
            setHoveredNodeId(null);  // Reset hover when filter changes

            requestAnimationFrame(() => { // Allow UI update before filtering
                if (!isMounted) return;
                try {
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
                    // Consider setting an error state specific to filtering
                } finally {
                     if (isMounted) setIsFiltering(false);
                }
            });
        } else {
            // Clear data if selection is incomplete
             if (isMounted) {
                setFilteredConnectionData(null);
                setIsFiltering(false); // Ensure reset
             }
        }
        return () => { isMounted = false; }; // Cleanup flag
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Dependencies

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null); // Reset chapter selection
        setFilteredConnectionData(null); // Clear diagram immediately
         // Update chapter list using getChapters (already imported)
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
    }, [bibleData]); // Dependency on bibleData

    const handleChapterChange = useCallback((chapterNum) => {
        setSelectedChapter(chapterNum);
        // Filtering effect runs automatically
    }, []);

    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter'));
        // Filtering effect runs automatically
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