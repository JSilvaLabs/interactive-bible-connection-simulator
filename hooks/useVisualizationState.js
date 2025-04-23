// hooks/useVisualizationState.js (MVP v8.0 Update)
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import necessary functions from dataService
import { getConnectionsFor, getChapters, getBooks, getVersesForChapter } from '@/utils/dataService'; // Added getVersesForChapter

/**
 * Custom hook to manage state related to user selections,
 * data filtering for visualization, interaction callbacks,
 * and setting the initial default view (Genesis 5, Chapter Mode).
 */
export function useVisualizationState(bibleData, allReferencesData) {
    // --- State for User Selections & View ---
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedVerse, setSelectedVerse] = useState(null); // New state for selected verse
    const [viewMode, setViewMode] = useState('chapter'); // <<< MVP v8.0 Change: Default to chapter
    const [chapterList, setChapterList] = useState([]);
    const [verseList, setVerseList] = useState([]); // New state for verse list

    // --- State for Derived/Filtered Data ---
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [isFiltering, setIsFiltering] = useState(false);

    // --- State for Diagram Interactions ---
    const [selectedNodeId, setSelectedNodeId] = useState(null); // Clicked node ID
    const [hoveredNodeId, setHoveredNodeId] = useState(null); // Hovered node ID

     // --- Effect to Set Default Selection ---
     useEffect(() => {
        // Set default only if bibleData is loaded/valid and no book is selected yet
        if (bibleData && bibleData.books && !selectedBook && !selectedChapter) {
            const books = getBooks(bibleData); // Assumes getBooks is imported or available
            const defaultBook = "Genesis"; // Target Genesis
            const defaultChapter = 5;      // Target Chapter 5

            if (books && books.includes(defaultBook)) {
                const defaultChapters = getChapters(bibleData, defaultBook);
                if (defaultChapters && defaultChapters.includes(defaultChapter)) {
                    setSelectedBook(defaultBook);
                    setSelectedChapter(defaultChapter);
                    setChapterList(defaultChapters);
                    // Also populate verse list for the default chapter
                    const defaultVerses = getVersesForChapter(bibleData, defaultBook, defaultChapter);
                    setVerseList(defaultVerses);
                    console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter} (View Mode: ${viewMode})`);
                } else {
                     console.warn(`useVisState: Could not find default chapter ${defaultChapter} in ${defaultBook}`);
                }
            } else {
                 console.warn(`useVisState: Default book ${defaultBook} not found in book list.`);
            }
        }
    }, [bibleData, selectedBook, selectedChapter, viewMode]); // Add viewMode to potentially reset if needed?


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        // Filter based on CHAPTER, regardless of selectedVerse for now
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true);
            // Reset selections when filter changes to avoid showing stale info
            setSelectedNodeId(null);
            setHoveredNodeId(null);

            requestAnimationFrame(() => {
                if (!isMounted) return;
                try {
                    // Filtering is still based on chapter in this iteration
                    const filteredData = getConnectionsFor(
                        allReferencesData,
                        selectedBook,
                        selectedChapter,
                        viewMode // Pass viewMode (might affect aggregation in dataService)
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
        setSelectedVerse(null); // Reset verse
        setFilteredConnectionData(null);
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
        setVerseList([]); // Clear verse list
    }, [bibleData]);

    const handleChapterChange = useCallback((chapterNum) => {
        const newChapter = chapterNum ? parseInt(chapterNum, 10) : null;
        setSelectedChapter(newChapter);
        setSelectedVerse(null); // Reset verse when chapter changes
        // Populate verse list for the newly selected chapter
        setVerseList(bibleData && selectedBook && newChapter ? getVersesForChapter(bibleData, selectedBook, newChapter) : []);
    }, [bibleData, selectedBook]);

     // New handler for verse change
     const handleVerseChange = useCallback((verseNum) => {
        setSelectedVerse(verseNum ? parseInt(verseNum, 10) : null);
        // In this iteration, selecting a verse does NOT trigger a re-filter of connections.
        // It primarily updates the state for potential use in info panels or future filtering.
        // If immediate filtering were desired, this handler would need to trigger it.
        console.log("Selected Verse (UI State Only):", verseNum);
     }, []);

    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter'));
        // Filtering effect will run automatically due to viewMode change
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
        // Selection State
        selectedBook, selectedChapter, selectedVerse, // Include verse
        viewMode, chapterList, verseList, // Include verseList
        // Derived Data State
        filteredConnectionData, isFiltering,
        // Interaction State
        selectedNodeId, hoveredNodeId,
        // Handlers
        handleBookChange, handleChapterChange, handleVerseChange, // Include verse handler
        handleToggleView, handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd
    };
}

// Helper function (can be moved to dataService if preferred)
// Requires bibleData to be loaded
const getVersesForChapter = (bibleData, bookName, chapterNum) => {
    if (!bibleData || !bookName || !chapterNum) return [];
    // Assumes normalizeBookNameForText is available or logic is duplicated/imported
    // const normalizeBookNameForText = (name) => name; // Replace with actual import/logic
    const normalizedBook = normalizeBookNameForText(bookName);
    const book = bibleData.books?.find(b => normalizeBookNameForText(b.name) === normalizedBook);
    const chapter = book?.chapters?.find(c => c.chapter === chapterNum);
    return chapter?.verses?.map(v => v.verse).sort((a, b) => a - b) || [];
};

// Need to import or define normalizeBookNameForText if used within getVersesForChapter here
// Example using direct import (if exported from dataService)
import { normalizeBookNameForText } from '@/utils/dataService';