// hooks/useVisualizationState.js (MVP v6.1 Update - Default to Verse View)
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import necessary functions from dataService
import { getConnectionsFor, getChapters, getBooks } from '@/utils/dataService'; // Ensure getBooks is imported

/**
 * Custom hook to manage state related to user selections,
 * data filtering for visualization, interaction callbacks,
 * and setting the initial default view (Genesis 1, Verse Mode).
 */
export function useVisualizationState(bibleData, allReferencesData) { // Takes loaded data as input
    // --- State for User Selections & View ---
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [viewMode, setViewMode] = useState('verse'); // <<< MVP v6.1 Change: Default to verse
    const [chapterList, setChapterList] = useState([]);

    // --- State for Derived/Filtered Data ---
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [isFiltering, setIsFiltering] = useState(false);

    // --- State for Diagram Interactions ---
    const [selectedNodeId, setSelectedNodeId] = useState(null); // Clicked node ID
    const [hoveredNodeId, setHoveredNodeId] = useState(null); // Hovered node ID

     // --- Effect to Set Default Selection (Runs when bibleData loads) ---
     useEffect(() => {
        // Only set default if bibleData is valid and no selection has been made yet
        if (bibleData && bibleData.books && !selectedBook && !selectedChapter) {
            const books = getBooks(bibleData); // Use imported getBooks
            if (books && books.length > 0) {
                // Default to first canonical book (Genesis)
                const defaultBook = books[0];
                const defaultChapters = getChapters(bibleData, defaultBook);
                // Default to chapter 1
                const defaultChapter = defaultChapters?.includes(1) ? 1 : (defaultChapters?.[0] || null);

                if (defaultBook && defaultChapter !== null) {
                    setSelectedBook(defaultBook);
                    setSelectedChapter(defaultChapter);
                    setChapterList(defaultChapters); // Populate chapter list for the selector
                     console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter} (View Mode: ${viewMode})`);
                } else {
                     console.warn(`useVisState: Could not find chapter 1 (or any chapter) for default book: ${defaultBook}`);
                }
            } else {
                 console.warn("useVisState: Book list derived from bibleData is empty.");
            }
        }
        // This effect depends on bibleData. It should only run once bibleData is loaded,
        // or if the selections get reset to null somehow.
    }, [bibleData, selectedBook, selectedChapter]); // Dependencies ensure it reacts to data load and resets


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true);
            setSelectedNodeId(null);
            setHoveredNodeId(null);

            requestAnimationFrame(() => { // Allow UI update before filtering
                if (!isMounted) return;
                try {
                    const filteredData = getConnectionsFor(
                        allReferencesData,
                        selectedBook,
                        selectedChapter,
                        viewMode // Pass the current viewMode
                    );
                     if (isMounted) setFilteredConnectionData(filteredData);
                } catch (err) {
                    console.error("useVisualizationState: Filtering failed:", err);
                     if (isMounted) setFilteredConnectionData(null);
                } finally {
                     if (isMounted) setIsFiltering(false);
                }
            });
        } else {
             if (isMounted) {
                setFilteredConnectionData(null);
                setIsFiltering(false);
             }
        }
        return () => { isMounted = false; };
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Filter runs when these change

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null);
        setFilteredConnectionData(null);
        // Update chapter list using getChapters (already imported)
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
    }, [bibleData]);

    const handleChapterChange = useCallback((chapterNum) => {
        setSelectedChapter(chapterNum);
    }, []);

    // Toggles between 'verse' and 'chapter' view modes
    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter'));
    }, []);

    const handleNodeSelect = useCallback((nodeId) => {
        setSelectedNodeId(nodeId);
        setHoveredNodeId(null);
    }, []);

    const handleNodeHoverStart = useCallback((nodeId) => {
        setHoveredNodeId(nodeId);
    }, []);

    const handleNodeHoverEnd = useCallback(() => {
        setHoveredNodeId(null);
    }, []);

    // --- Return State and Handlers ---
    return {
        selectedBook, selectedChapter, viewMode, chapterList, filteredConnectionData,
        selectedNodeId, hoveredNodeId, isFiltering,
        handleBookChange, handleChapterChange, handleToggleView, handleNodeSelect,
        handleNodeHoverStart, handleNodeHoverEnd
    };
}