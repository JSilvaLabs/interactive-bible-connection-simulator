// hooks/useVisualizationState.js (MVP v8.3 - Cleaned, Imports Verified)
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import necessary functions from dataService
// Ensure ALL needed functions, including normalizers used in handlers/effects, are listed here ONCE.
import {
    getConnectionsFor,
    getChapters,
    getBooks,
    getVersesForChapter,
    normalizeBookNameForId, // Needed for constructing node IDs
    normalizeBookNameForText // Needed for getting chapters/verses by display name if bibleData keys use it
} from '@/utils/dataService';

/**
 * Custom hook to manage state related to user selections,
 * data filtering for visualization, interaction callbacks,
 * and setting the initial default view (Genesis 5, Chapter Mode).
 */
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
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    const [filterError, setFilterError] = useState(null);

     // --- Effect to Set Default Selection ---
     useEffect(() => {
        // console.log(`[Default Effect] Running. bibleData valid: ${!!bibleData?.books}, selectedBook: ${selectedBook}, selectedChapter: ${selectedChapter}`);

        // Set default only if bibleData is loaded/valid and no book/chapter is selected yet
        if (bibleData && bibleData.books && bibleData.books.length > 0 && !selectedBook && !selectedChapter) {
            // console.log("[Default Effect] Conditions met, attempting to set default...");
            try {
                const books = getBooks(bibleData); // Uses imported function
                // console.log("[Default Effect] getBooks result (first 5):", books?.slice(0,5));

                if (books && books.length > 0) {
                    const defaultBook = "Genesis"; // Target canonical name
                    const defaultChapter = 5;

                    // Check if default book exists in the canonically sorted list
                    if (books.includes(defaultBook)) {
                        const defaultChapters = getChapters(bibleData, defaultBook); // Use canonical name
                        // console.log(`[Default Effect] Chapters for ${defaultBook}:`, defaultChapters);
                        if (defaultChapters && defaultChapters.includes(defaultChapter)) {
                            // --- Set State ---
                            setSelectedBook(defaultBook);
                            setSelectedChapter(defaultChapter);
                            setChapterList(defaultChapters);
                            const defaultVerses = getVersesForChapter(bibleData, defaultBook, defaultChapter); // Use canonical name
                            setVerseList(defaultVerses);
                            // Set default selected node ID using ID normalization
                            const defaultNodeId = `${normalizeBookNameForId(defaultBook)}${defaultChapter}`; // Use ID norm for node ID
                            setSelectedNodeId(defaultNodeId);
                            console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter}, Node: ${defaultNodeId}, View: ${viewMode}`);
                        } else { console.warn(`[Default Effect] Could not find default chapter ${defaultChapter} in ${defaultBook}`); }
                    } else { console.warn(`[Default Effect] Default book ${defaultBook} not found in list.`); }
                } else { console.warn("[Default Effect] getBooks returned empty list."); }
            } catch (e) { console.error("[Default Effect] Error during default selection logic:", e); }
        }
    // Depend only on bibleData. This effect should run once when bibleData is loaded.
    }, [bibleData]); // Removed selectedBook, selectedChapter from deps


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true); setFilterError(null); setHoveredNodeId(null);
            requestAnimationFrame(() => { // Use rAF for smoother UI update
                if (!isMounted) return;
                try {
                    // console.log(`[Filter Effect] Calling getConnectionsFor: B=${selectedBook}, C=${selectedChapter}, M=${viewMode}`);
                    // Pass canonical selectedBook name; getConnectionsFor uses normalizeBookNameForId internally for prefix
                    const filteredData = getConnectionsFor(allReferencesData, selectedBook, selectedChapter, viewMode);
                     if (isMounted) setFilteredConnectionData(filteredData);
                } catch (err) {
                    console.error("useVisualizationState: Filtering failed:", err);
                     if (isMounted) { setFilteredConnectionData(null); setFilterError("Failed to load connections."); }
                } finally {
                     if (isMounted) setIsFiltering(false);
                }
            });
        } else {
             // Clear data if selection is incomplete
             if (isMounted) { setFilteredConnectionData(null); setIsFiltering(false); setFilterError(null); }
        }
        return () => { isMounted = false; }; // Cleanup flag
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Correct dependencies

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => { // bookName received is already canonical from getBooks list
        setSelectedBook(bookName);
        setSelectedChapter(null); setSelectedVerse(null);
        setFilteredConnectionData(null); setFilterError(null);
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []); // Use canonical name
        setVerseList([]);
        setSelectedNodeId(null);
    }, [bibleData]);

    const handleChapterChange = useCallback((chapterNum) => {
        const newChapter = chapterNum ? parseInt(chapterNum, 10) : null;
        setSelectedChapter(newChapter);
        setSelectedVerse(null); setFilterError(null);
        setVerseList(bibleData && selectedBook && newChapter ? getVersesForChapter(bibleData, selectedBook, newChapter) : []); // Use canonical selectedBook
        // Set selectedNodeId to the chapter ID using ID normalizer on canonical selectedBook
        if (selectedBook && newChapter !== null) {
            const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${newChapter}`;
            setSelectedNodeId(chapterNodeId);
        } else { setSelectedNodeId(null); }
    }, [bibleData, selectedBook]); // Depends on canonical selectedBook

     const handleVerseChange = useCallback((verseNum) => {
        const newVerse = verseNum ? parseInt(verseNum, 10) : null;
        setSelectedVerse(newVerse);
        // Update selectedNodeId based on verse selection using ID normalizer on canonical selectedBook
        if (selectedBook && selectedChapter !== null) {
            if (newVerse !== null) {
                const verseNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}v${newVerse}`;
                setSelectedNodeId(verseNodeId);
            } else { // Verse deselected ("All Verses")
                const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`;
                setSelectedNodeId(chapterNodeId);
            }
        } else { setSelectedNodeId(null); }
     }, [selectedBook, selectedChapter]); // Depends on canonical selectedBook/selectedChapter

    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => {
            const newMode = prevMode === 'chapter' ? 'verse' : 'chapter';
            // Reset selected node ID to the chapter level using ID normalizer on canonical selectedBook
            if (selectedBook && selectedChapter !== null) {
                 const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`;
                 setSelectedNodeId(chapterNodeId);
            } else { setSelectedNodeId(null); }
            setSelectedVerse(null);
            return newMode;
        });
    }, [selectedBook, selectedChapter]); // Depends on canonical selectedBook/selectedChapter

    const handleNodeSelect = useCallback((nodeId) => { setSelectedNodeId(nodeId); setHoveredNodeId(null); }, []);
    const handleNodeHoverStart = useCallback((nodeId) => { setHoveredNodeId(nodeId); }, []);
    const handleNodeHoverEnd = useCallback(() => { setHoveredNodeId(null); }, []);

    // --- Return State and Handlers ---
    return {
        selectedBook, selectedChapter, selectedVerse, viewMode, chapterList, verseList,
        filteredConnectionData, isFiltering, filterError,
        selectedNodeId, hoveredNodeId,
        handleBookChange, handleChapterChange, handleVerseChange, handleToggleView,
        handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd
    };
}

// No helper function definition here - rely on import