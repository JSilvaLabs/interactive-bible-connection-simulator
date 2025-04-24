// hooks/useVisualizationState.js (MVP v8.2 - Robust Default Selection)
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import necessary functions from dataService
import {
    getConnectionsFor,
    getChapters,
    getBooks, // Needed for default selection
    getVersesForChapter,
    normalizeBookNameForId, // Needed for default node ID
    normalizeBookNameForText // Potentially needed by getVersesForChapter if not imported there
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
            console.log("[Default Effect] Conditions met (bibleData valid, no selection), attempting to set default...");
            try {
                const books = getBooks(bibleData); // Call getBooks now that bibleData is confirmed valid
                console.log("[Default Effect] getBooks result (first 5):", books?.slice(0,5));

                if (books && books.length > 0) { // Check if getBooks returned a valid array
                    const defaultBook = "Genesis";
                    const defaultChapter = 5;

                    // Check if default book exists in the derived list (case-sensitive check might be needed depending on getBooks)
                    const canonicalDefaultBook = normalizeBookNameForText(defaultBook); // Ensure using canonical name for checks/gets
                    if (books.includes(canonicalDefaultBook)) {
                        const defaultChapters = getChapters(bibleData, canonicalDefaultBook); // Use canonical name
                        console.log(`[Default Effect] Chapters for ${canonicalDefaultBook}:`, defaultChapters);

                        if (defaultChapters && defaultChapters.includes(defaultChapter)) {
                            console.log(`[Default Effect] Setting state: Book=${canonicalDefaultBook}, Chapter=${defaultChapter}`);
                            setSelectedBook(canonicalDefaultBook); // Set canonical name
                            setSelectedChapter(defaultChapter);
                            setChapterList(defaultChapters);
                            const defaultVerses = getVersesForChapter(bibleData, canonicalDefaultBook, defaultChapter);
                            setVerseList(defaultVerses);
                            // Set default selected node ID using ID normalization
                            const defaultNodeId = `${normalizeBookNameForId(canonicalDefaultBook)}${defaultChapter}`;
                            setSelectedNodeId(defaultNodeId);
                            console.log(`[Default Effect] Default state SET. Node: ${defaultNodeId}, View: ${viewMode}`);
                        } else {
                            console.warn(`[Default Effect] Could not find default chapter ${defaultChapter} in ${canonicalDefaultBook}. Chapters available:`, defaultChapters);
                        }
                    } else {
                        console.warn(`[Default Effect] Default book ${canonicalDefaultBook} not found in derived book list:`, books);
                    }
                } else {
                     console.warn("[Default Effect] getBooks returned empty or invalid list.");
                }
            } catch (e) {
                console.error("[Default Effect] Error during default selection logic:", e);
            }
        } else {
             // console.log("[Default Effect] Conditions NOT met, skipping default set.");
        }
        // Depend only on bibleData. This effect should run once when bibleData is loaded.
        // Subsequent selections are handled by user interaction callbacks.
    }, [bibleData]); // Dependency on bibleData ensures it runs when data is ready


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true); setFilterError(null); setHoveredNodeId(null);
            // Reset node ID only if the filter params change, not just on any render
            // setSelectedNodeId(null); // Moved reset to handlers

            requestAnimationFrame(() => {
                if (!isMounted) return;
                try {
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
             if (isMounted) { setFilteredConnectionData(null); setIsFiltering(false); setFilterError(null); }
        }
        return () => { isMounted = false; };
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Correct dependencies

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null); setSelectedVerse(null);
        setFilteredConnectionData(null); setFilterError(null);
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
        setVerseList([]);
        setSelectedNodeId(null); // Reset selection
    }, [bibleData]);

    const handleChapterChange = useCallback((chapterNum) => {
        const newChapter = chapterNum ? parseInt(chapterNum, 10) : null;
        setSelectedChapter(newChapter);
        setSelectedVerse(null); setFilterError(null);
        setVerseList(bibleData && selectedBook && newChapter ? getVersesForChapter(bibleData, selectedBook, newChapter) : []);
        // Set selectedNodeId to the chapter ID
        if (selectedBook && newChapter !== null) {
            const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${newChapter}`;
            setSelectedNodeId(chapterNodeId); // Auto-select chapter node
        } else { setSelectedNodeId(null); }
    }, [bibleData, selectedBook]);

     const handleVerseChange = useCallback((verseNum) => {
        const newVerse = verseNum ? parseInt(verseNum, 10) : null;
        setSelectedVerse(newVerse);
        // Update selectedNodeId based on verse selection
        if (selectedBook && selectedChapter !== null) {
            if (newVerse !== null) {
                const verseNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}v${newVerse}`;
                setSelectedNodeId(verseNodeId); // Select specific verse node
            } else { // Verse deselected ("All Verses")
                const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`;
                setSelectedNodeId(chapterNodeId); // Revert selection to chapter node
            }
        } else { setSelectedNodeId(null); }
     }, [selectedBook, selectedChapter]);

    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => {
            const newMode = prevMode === 'chapter' ? 'verse' : 'chapter';
            // When toggling, reset selection to the chapter level node
            if (selectedBook && selectedChapter !== null) {
                 const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`;
                 setSelectedNodeId(chapterNodeId);
            } else { setSelectedNodeId(null); }
            setSelectedVerse(null); // Reset specific verse selection
            return newMode;
        });
    }, [selectedBook, selectedChapter]);

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

// Import necessary normalization function if used directly (e.g., for default Node ID construction)
import { normalizeBookNameForId, normalizeBookNameForText } from '@/utils/dataService';