// hooks/useVisualizationState.js (MVP v8.1 Update - Verse Selection Effect & Default Node)
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import necessary functions from dataService
import {
    getConnectionsFor,
    getChapters,
    getBooks,
    getVersesForChapter,
    normalizeBookNameForId // Needed for constructing default Node ID
} from '@/utils/dataService';

export function useVisualizationState(bibleData, allReferencesData) {
    // --- State ---
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedVerse, setSelectedVerse] = useState(null);
    const [viewMode, setViewMode] = useState('chapter'); // Default to chapter view
    const [chapterList, setChapterList] = useState([]);
    const [verseList, setVerseList] = useState([]);
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState(null); // Track selected node for panels
    const [hoveredNodeId, setHoveredNodeId] = useState(null);

     // --- Effect to Set Default Selection ---
     useEffect(() => {
        if (bibleData && bibleData.books && !selectedBook && !selectedChapter) {
            const books = getBooks(bibleData);
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
                    // *** MVP v8.1: Set default selectedNodeId to the chapter ID ***
                    const defaultNodeId = `${normalizeBookNameForId(defaultBook)}${defaultChapter}`;
                    setSelectedNodeId(defaultNodeId);
                    console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter}, Node: ${defaultNodeId}, View: ${viewMode}`);
                } else { console.warn(`useVisState: Could not find default chapter ${defaultChapter} in ${defaultBook}`); }
            } else { console.warn(`useVisState: Default book ${defaultBook} not found in book list or list empty.`); }
        }
    }, [bibleData, selectedBook, selectedChapter, viewMode]); // Re-run if data loads or selection cleared


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true);
            // Don't reset selectedNodeId here anymore, let handlers manage it
            // setSelectedNodeId(null);
            setHoveredNodeId(null);

            requestAnimationFrame(() => {
                if (!isMounted) return;
                try {
                    const filteredData = getConnectionsFor(allReferencesData, selectedBook, selectedChapter, viewMode);
                     if (isMounted) setFilteredConnectionData(filteredData);
                } catch (err) {
                    console.error("useVisualizationState: Filtering failed:", err);
                     if (isMounted) setFilteredConnectionData(null);
                } finally {
                     if (isMounted) setIsFiltering(false);
                }
            });
        } else {
             if (isMounted) { setFilteredConnectionData(null); setIsFiltering(false); }
        }
        return () => { isMounted = false; };
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]);

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null);
        setSelectedVerse(null);
        setFilteredConnectionData(null);
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
        setVerseList([]);
        setSelectedNodeId(null); // Reset selected node
    }, [bibleData]);

    const handleChapterChange = useCallback((chapterNum) => {
        const newChapter = chapterNum ? parseInt(chapterNum, 10) : null;
        setSelectedChapter(newChapter);
        setSelectedVerse(null); // Reset verse
        setVerseList(bibleData && selectedBook && newChapter ? getVersesForChapter(bibleData, selectedBook, newChapter) : []);
        // *** MVP v8.1: Set selectedNodeId to chapter ID ***
        if (selectedBook && newChapter !== null) {
            const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${newChapter}`;
            setSelectedNodeId(chapterNodeId);
        } else {
            setSelectedNodeId(null);
        }
    }, [bibleData, selectedBook]); // Add selectedBook dependency

     const handleVerseChange = useCallback((verseNum) => {
        const newVerse = verseNum ? parseInt(verseNum, 10) : null;
        setSelectedVerse(newVerse);
        // *** MVP v8.1: Update selectedNodeId based on verse selection ***
        if (selectedBook && selectedChapter !== null) {
            if (newVerse !== null) {
                // Construct and select verse ID
                const verseNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}v${newVerse}`;
                setSelectedNodeId(verseNodeId);
                console.log("Verse selected, Node ID:", verseNodeId);
            } else {
                // Verse deselected (e.g., "All Verses"), select the chapter node
                const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`;
                setSelectedNodeId(chapterNodeId);
                 console.log("Verse deselected, Node ID:", chapterNodeId);
            }
        } else {
             setSelectedNodeId(null); // Fallback safety
        }
     }, [selectedBook, selectedChapter]); // Add dependencies

    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => {
            const newMode = prevMode === 'chapter' ? 'verse' : 'chapter';
            // When switching view mode, reset selected node ID to the chapter level
            if (selectedBook && selectedChapter !== null) {
                 const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`;
                 setSelectedNodeId(chapterNodeId);
            } else {
                 setSelectedNodeId(null);
            }
            setSelectedVerse(null); // Also reset specific verse selection
            return newMode;
        });
    }, [selectedBook, selectedChapter]); // Add dependencies

    const handleNodeSelect = useCallback((nodeId) => {
        setSelectedNodeId(nodeId);
        setHoveredNodeId(null);
        // Optional: Update dropdowns if user clicks a node from a *different* chapter/verse?
        // For now, clicking only updates the selectedNodeId for panels.
    }, []);

    const handleNodeHoverStart = useCallback((nodeId) => { setHoveredNodeId(nodeId); }, []);
    const handleNodeHoverEnd = useCallback(() => { setHoveredNodeId(null); }, []);

    // --- Return State and Handlers ---
    return {
        selectedBook, selectedChapter, selectedVerse, viewMode, chapterList, verseList,
        filteredConnectionData, isFiltering, selectedNodeId, hoveredNodeId,
        handleBookChange, handleChapterChange, handleVerseChange, handleToggleView,
        handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd
    };
}