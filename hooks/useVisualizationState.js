// hooks/useVisualizationState.js (MVP v9.0 - Uses Optimized dataService)
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import potentially optimized functions from dataService
import {
    getConnectionsFor,
    getChapters,
    getBooks, // Still needed for default selection logic here
    getVersesForChapter
} from '@/utils/dataService';

export function useVisualizationState(bibleData, allReferencesData) {
    // --- State ---
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedVerse, setSelectedVerse] = useState(null);
    const [viewMode, setViewMode] = useState('chapter'); // Default to chapter
    const [chapterList, setChapterList] = useState([]);
    const [verseList, setVerseList] = useState([]);
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    const [filterError, setFilterError] = useState(null); // Optional: Local error state for filtering

     // --- Effect to Set Default Selection ---
     useEffect(() => {
        if (bibleData && bibleData.books && !selectedBook && !selectedChapter) {
            const books = getBooks(bibleData); // Use imported getBooks
            const defaultBook = "Genesis";
            const defaultChapter = 5;
            if (books && books.includes(defaultBook)) {
                const defaultChapters = getChapters(bibleData, defaultBook);
                if (defaultChapters && defaultChapters.includes(defaultChapter)) {
                    setSelectedBook(defaultBook);
                    setSelectedChapter(defaultChapter);
                    setChapterList(defaultChapters);
                    const defaultVerses = getVersesForChapter(bibleData, defaultBook, defaultChapter);
                    setVerseList(defaultVerses);
                    // Set default selected node ID
                    const defaultNodeId = `${normalizeBookNameForId(defaultBook)}${defaultChapter}`; // Requires normalizeBookNameForId
                    setSelectedNodeId(defaultNodeId);
                    console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter}, Node: ${defaultNodeId}, View: ${viewMode}`);
                }
            }
        }
        // We need normalizeBookNameForId here if constructing the defaultNodeId
        // Import it or handle differently if it causes issues being here vs dataService only
    }, [bibleData, selectedBook, selectedChapter, viewMode]);


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true);
            setFilterError(null); // Clear previous filter errors
            // Reset selections only if filter params change significantly? Maybe not needed.
            // setSelectedNodeId(null);
            // setHoveredNodeId(null);

            // Use rAF or setTimeout to prevent blocking UI thread immediately
            requestAnimationFrame(() => {
                if (!isMounted) return;
                try {
                    // *** Calls the potentially OPTIMIZED getConnectionsFor ***
                    const filteredData = getConnectionsFor(
                        allReferencesData, selectedBook, selectedChapter, viewMode
                    );
                     if (isMounted) setFilteredConnectionData(filteredData);
                } catch (err) {
                    console.error("useVisualizationState: Filtering failed:", err);
                     if (isMounted) {
                         setFilteredConnectionData(null);
                         setFilterError("Failed to load connections for this selection."); // Set specific error
                     }
                } finally {
                     if (isMounted) setIsFiltering(false);
                }
            });
        } else {
             // Clear data if selection is incomplete
             if (isMounted) {
                 setFilteredConnectionData(null);
                 setIsFiltering(false); // Reset filtering state
                 setFilterError(null); // Clear errors
             }
        }
        return () => { isMounted = false; };
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]);

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null); setSelectedVerse(null);
        setFilteredConnectionData(null); setFilterError(null); // Clear errors on change
        // Ensure bibleData is available before calling getChapters
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
        setVerseList([]);
        setSelectedNodeId(null);
    }, [bibleData]); // Ensure bibleData dependency

    const handleChapterChange = useCallback((chapterNum) => {
        const newChapter = chapterNum ? parseInt(chapterNum, 10) : null;
        setSelectedChapter(newChapter);
        setSelectedVerse(null); setFilterError(null);
        // Ensure bibleData and selectedBook are available
        setVerseList(bibleData && selectedBook && newChapter ? getVersesForChapter(bibleData, selectedBook, newChapter) : []);
        // Set selectedNodeId to the chapter ID
        if (selectedBook && newChapter !== null) {
            const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${newChapter}`; // Requires normalizer
            setSelectedNodeId(chapterNodeId);
        } else { setSelectedNodeId(null); }
    }, [bibleData, selectedBook]); // Add dependencies

     const handleVerseChange = useCallback((verseNum) => {
        const newVerse = verseNum ? parseInt(verseNum, 10) : null;
        setSelectedVerse(newVerse);
        // Update selectedNodeId based on verse selection
        if (selectedBook && selectedChapter !== null) {
            if (newVerse !== null) {
                const verseNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}v${newVerse}`; // Requires normalizer
                setSelectedNodeId(verseNodeId);
            } else { // Verse deselected, revert to chapter node
                const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`; // Requires normalizer
                setSelectedNodeId(chapterNodeId);
            }
        } else { setSelectedNodeId(null); }
     }, [selectedBook, selectedChapter]); // Add dependencies

    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => {
            const newMode = prevMode === 'chapter' ? 'verse' : 'chapter';
            // Reset selected node ID to chapter level when toggling modes
            if (selectedBook && selectedChapter !== null) {
                 const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`; // Requires normalizer
                 setSelectedNodeId(chapterNodeId);
            } else { setSelectedNodeId(null); }
            setSelectedVerse(null); // Reset specific verse selection
            return newMode;
        });
    }, [selectedBook, selectedChapter]); // Add dependencies

    const handleNodeSelect = useCallback((nodeId) => { setSelectedNodeId(nodeId); setHoveredNodeId(null); }, []);
    const handleNodeHoverStart = useCallback((nodeId) => { setHoveredNodeId(nodeId); }, []);
    const handleNodeHoverEnd = useCallback(() => { setHoveredNodeId(null); }, []);

    // --- Return State and Handlers ---
    return {
        selectedBook, selectedChapter, selectedVerse, viewMode, chapterList, verseList,
        filteredConnectionData, isFiltering, filterError, // Include filterError
        selectedNodeId, hoveredNodeId,
        handleBookChange, handleChapterChange, handleVerseChange, handleToggleView,
        handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd
    };
}

// Import necessary normalization function if it's needed *directly* within this hook's logic
// (Currently needed for setting default node ID and updating node ID in handlers)
// If dataService handles all ID construction, this might not be needed here.
import { normalizeBookNameForId } from '@/utils/dataService';