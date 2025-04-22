// hooks/useVisualizationState.js (Correct MVP v6.0 Version)
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import necessary functions from dataService
import { getConnectionsFor, getChapters } from '@/utils/dataService';

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

     // --- Effect to Set Default Selection (Moved from MainPage for encapsulation) ---
     useEffect(() => {
        // Set default only if bibleData is loaded and no book is selected yet
        if (bibleData && !selectedBook && !selectedChapter) {
            const books = getBooks(bibleData); // Need getBooks here or pass bookList
            if (books.length > 0) {
                const defaultBook = books[0];
                const defaultChapters = getChapters(bibleData, defaultBook);
                const defaultChapter = defaultChapters.length > 0 ? defaultChapters[0] : null;
                if (defaultBook && defaultChapter !== null) {
                    setSelectedBook(defaultBook);
                    setSelectedChapter(defaultChapter);
                    setChapterList(defaultChapters);
                     console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter}`);
                }
            }
        }
    }, [bibleData, selectedBook, selectedChapter]); // Run when bibleData is loaded or selection cleared


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
                        viewMode
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
                setIsFiltering(false); // Ensure reset if selection becomes incomplete
             }
        }
        return () => { isMounted = false; };
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]);

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null);
        setFilteredConnectionData(null); // Clear diagram immediately
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
    }, [bibleData]); // Recreate if bibleData changes

    const handleChapterChange = useCallback((chapterNum) => {
        setSelectedChapter(chapterNum);
    }, []);

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