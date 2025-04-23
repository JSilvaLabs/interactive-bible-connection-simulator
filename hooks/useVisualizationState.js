// hooks/useVisualizationState.js (Corrected - Duplicate Function Removed)
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import necessary functions from dataService
// Ensure getBooks and getVersesForChapter are imported correctly
import { getConnectionsFor, getChapters, getBooks, getVersesForChapter, normalizeBookNameForText } from '@/utils/dataService';

/**
 * Custom hook to manage state related to user selections,
 * data filtering for visualization, interaction callbacks,
 * and setting the initial default view (Genesis 5, Chapter Mode).
 */
export function useVisualizationState(bibleData, allReferencesData) {
    // --- State for User Selections & View ---
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedVerse, setSelectedVerse] = useState(null);
    const [viewMode, setViewMode] = useState('chapter'); // Default to chapter view
    const [chapterList, setChapterList] = useState([]);
    const [verseList, setVerseList] = useState([]);

    // --- State for Derived/Filtered Data ---
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [isFiltering, setIsFiltering] = useState(false);

    // --- State for Diagram Interactions ---
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);

     // --- Effect to Set Default Selection ---
     useEffect(() => {
        // Set default only if bibleData is loaded/valid and no book is selected yet
        if (bibleData && bibleData.books && !selectedBook && !selectedChapter) {
            const books = getBooks(bibleData); // Use imported getBooks
            const defaultBook = "Genesis";
            const defaultChapter = 5;

            if (books && books.includes(defaultBook)) {
                const defaultChapters = getChapters(bibleData, defaultBook); // Use imported getChapters
                if (defaultChapters && defaultChapters.includes(defaultChapter)) {
                    setSelectedBook(defaultBook);
                    setSelectedChapter(defaultChapter);
                    setChapterList(defaultChapters);
                    // Populate verse list using imported getVersesForChapter
                    const defaultVerses = getVersesForChapter(bibleData, defaultBook, defaultChapter);
                    setVerseList(defaultVerses);
                    console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter} (View Mode: ${viewMode})`);
                } else {
                     console.warn(`useVisState: Could not find default chapter ${defaultChapter} in ${defaultBook}`);
                }
            } else {
                 console.warn(`useVisState: Default book ${defaultBook} not found in book list or book list empty.`);
            }
        }
    }, [bibleData, selectedBook, selectedChapter, viewMode]); // Dependencies


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true);
            setSelectedNodeId(null);
            setHoveredNodeId(null);

            requestAnimationFrame(() => {
                if (!isMounted) return;
                try {
                    // Call imported getConnectionsFor
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
                setIsFiltering(false);
             }
        }
        return () => { isMounted = false; };
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]);

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null);
        setSelectedVerse(null);
        setFilteredConnectionData(null);
        // Use imported getChapters
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
        setVerseList([]);
    }, [bibleData]); // Dependency needed

    const handleChapterChange = useCallback((chapterNum) => {
        const newChapter = chapterNum ? parseInt(chapterNum, 10) : null;
        setSelectedChapter(newChapter);
        setSelectedVerse(null);
        // Use imported getVersesForChapter
        setVerseList(bibleData && selectedBook && newChapter ? getVersesForChapter(bibleData, selectedBook, newChapter) : []);
    }, [bibleData, selectedBook]); // Dependencies needed

     const handleVerseChange = useCallback((verseNum) => {
        setSelectedVerse(verseNum ? parseInt(verseNum, 10) : null);
        // Does not trigger filtering in this iteration
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
        selectedBook, selectedChapter, selectedVerse,
        viewMode, chapterList, verseList,
        filteredConnectionData, isFiltering,
        selectedNodeId, hoveredNodeId,
        handleBookChange, handleChapterChange, handleVerseChange,
        handleToggleView, handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd
    };
}

// NO DUPLICATE FUNCTION DEFINITION HERE