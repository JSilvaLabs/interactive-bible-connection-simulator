// hooks/useVisualizationState.js (MVP v8.2 - Debug Default Selection)
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import necessary functions from dataService
import {
    getConnectionsFor,
    getChapters,
    getBooks,
    getVersesForChapter,
    normalizeBookNameForId // Needed for default Node ID
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
        console.log(`[Default Effect] Running. bibleData valid: ${!!bibleData?.books}, selectedBook: ${selectedBook}, selectedChapter: ${selectedChapter}`); // Log entry and state

        // Set default only if bibleData is valid and no book/chapter is selected yet
        if (bibleData && bibleData.books && !selectedBook && !selectedChapter) {
            console.log("[Default Effect] Conditions met, attempting to set default...");
            try { // Add try-catch around the logic
                const books = getBooks(bibleData);
                console.log("[Default Effect] getBooks result (first 5):", books?.slice(0,5));
                const defaultBook = "Genesis";
                const defaultChapter = 5;

                // Check if default book exists in the derived list
                if (books && books.includes(defaultBook)) {
                    const defaultChapters = getChapters(bibleData, defaultBook);
                    console.log(`[Default Effect] Chapters for ${defaultBook}:`, defaultChapters);
                    // Check if default chapter exists for that book
                    if (defaultChapters && defaultChapters.includes(defaultChapter)) {
                        // --- Set State ---
                        // We are trying to set multiple states based on bibleData loading.
                        // This should ideally be safe within one effect.
                        console.log(`[Default Effect] Setting state: Book=${defaultBook}, Chapter=${defaultChapter}`);
                        setSelectedBook(defaultBook);
                        setSelectedChapter(defaultChapter);
                        setChapterList(defaultChapters); // Set chapter list for selector
                        const defaultVerses = getVersesForChapter(bibleData, defaultBook, defaultChapter);
                        setVerseList(defaultVerses);
                        // Set default selected node ID to the chapter
                        const defaultNodeId = `${normalizeBookNameForId(defaultBook)}${defaultChapter}`;
                        setSelectedNodeId(defaultNodeId);
                        console.log(`[Default Effect] State potentially set. Node: ${defaultNodeId}, View: ${viewMode}`);
                    } else {
                        console.warn(`[Default Effect] Could not find default chapter ${defaultChapter} in ${defaultBook}. Chapters available:`, defaultChapters);
                    }
                } else {
                    console.warn(`[Default Effect] Default book ${defaultBook} not found in book list or books array empty.`);
                }
            } catch (e) {
                console.error("[Default Effect] Error during default selection logic:", e);
                // Optionally set an error state here if needed
            }
        } else {
            console.log("[Default Effect] Conditions NOT met, skipping default set.");
        }
        // *** DEBUG: Simplify dependency array to ONLY bibleData to see if it triggers correctly ONCE data is loaded ***
        // This assumes selectedBook/Chapter are ONLY changed by user interaction after this runs.
    }, [bibleData]);
    // }, [bibleData, selectedBook, selectedChapter]); // Original dependencies


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        // Filter based on CHAPTER, regardless of selectedVerse for now
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true);
            setFilterError(null); // Clear previous filter errors
            // Reset selections only if filter params change significantly? Maybe not needed.
            // setSelectedNodeId(null); // We now set this based on selection, don't reset here
            // setHoveredNodeId(null);

            requestAnimationFrame(() => {
                if (!isMounted) return;
                try {
                    // console.log(`[Filter Effect] Calling getConnectionsFor: B=${selectedBook}, C=${selectedChapter}, M=${viewMode}`);
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
        return () => { isMounted = false; };
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Correct dependencies

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null); setSelectedVerse(null);
        setFilteredConnectionData(null); setFilterError(null);
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
        setVerseList([]);
        setSelectedNodeId(null); // Reset selected node ID
    }, [bibleData]);

    const handleChapterChange = useCallback((chapterNum) => {
        const newChapter = chapterNum ? parseInt(chapterNum, 10) : null;
        setSelectedChapter(newChapter);
        setSelectedVerse(null); setFilterError(null);
        setVerseList(bibleData && selectedBook && newChapter ? getVersesForChapter(bibleData, selectedBook, newChapter) : []);
        // Set selectedNodeId to the chapter ID
        if (selectedBook && newChapter !== null) {
            const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${newChapter}`;
            setSelectedNodeId(chapterNodeId);
        } else { setSelectedNodeId(null); }
    }, [bibleData, selectedBook]);

     const handleVerseChange = useCallback((verseNum) => {
        const newVerse = verseNum ? parseInt(verseNum, 10) : null;
        setSelectedVerse(newVerse);
        // Update selectedNodeId based on verse selection
        if (selectedBook && selectedChapter !== null) {
            if (newVerse !== null) {
                const verseNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}v${newVerse}`;
                setSelectedNodeId(verseNodeId);
            } else { // Verse deselected, revert to chapter node
                const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`;
                setSelectedNodeId(chapterNodeId);
            }
        } else { setSelectedNodeId(null); }
     }, [selectedBook, selectedChapter]);

    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => {
            const newMode = prevMode === 'chapter' ? 'verse' : 'chapter';
            // Reset selected node ID to the chapter level when toggling
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
        filteredConnectionData, isFiltering, filterError, // Expose filterError
        selectedNodeId, hoveredNodeId,
        handleBookChange, handleChapterChange, handleVerseChange, handleToggleView,
        handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd
    };
};