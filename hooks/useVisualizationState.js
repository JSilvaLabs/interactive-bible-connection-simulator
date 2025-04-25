// hooks/useVisualizationState.js (MRP v1.5 - Add Missing Import)
"use client";

import { useState, useEffect, useCallback } from 'react';
// --- ADD getNodeMetadata to the import ---
import {
    getConnectionsFor, getChapters, getBooks, getVersesForChapter,
    normalizeBookNameForId, normalizeBookNameForText,
    getNodeMetadata // <-- IMPORT ADDED HERE
} from '@/utils/dataService';

export function useVisualizationState(bibleData, allReferencesData) {
    // --- State ---
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedVerse, setSelectedVerse] = useState(null);
    const [viewMode, setViewMode] = useState('verse'); // Default to verse view
    const [chapterList, setChapterList] = useState([]);
    const [verseList, setVerseList] = useState([]);
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [filterError, setFilterError] = useState(null);

     // --- Effect to Set Default Selection ---
     useEffect(() => {
        // console.log(`[Default Effect] Running. bibleData valid: ${!!bibleData?.books}, selectedBook: ${selectedBook}, selectedChapter: ${selectedChapter}, selectedVerse: ${selectedVerse}`);

        // Set default only if bibleData is loaded/valid and no book/chapter/verse is selected yet
        if (bibleData && bibleData.books && bibleData.books.length > 0 && !selectedBook && !selectedChapter && !selectedVerse) {
            // console.log("[Default Effect] Conditions met, attempting to set default...");
            try {
                const books = getBooks(bibleData);
                if (books && books.length > 0) {
                    const defaultBook = "Genesis";
                    const defaultChapter = 1;
                    const defaultVerse = 1;

                    if (books.includes(defaultBook)) {
                        const defaultChapters = getChapters(bibleData, defaultBook);
                        if (defaultChapters && defaultChapters.includes(defaultChapter)) {
                             const defaultVerses = getVersesForChapter(bibleData, defaultBook, defaultChapter);
                             if (defaultVerses && defaultVerses.includes(defaultVerse)) {
                                // --- Set State ---
                                setSelectedBook(defaultBook);
                                setSelectedChapter(defaultChapter);
                                setSelectedVerse(defaultVerse);
                                setChapterList(defaultChapters);
                                setVerseList(defaultVerses);
                                const defaultNodeId = `${normalizeBookNameForId(defaultBook)}${defaultChapter}v${defaultVerse}`;
                                setSelectedNodeId(defaultNodeId);
                                console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter}:${defaultVerse}, Node: ${defaultNodeId}, View: ${viewMode}`);
                            } else { console.warn(`[Default Effect] Could not find default verse ${defaultVerse} in ${defaultBook} ${defaultChapter}`); }
                        } else { console.warn(`[Default Effect] Could not find default chapter ${defaultChapter} in ${defaultBook}`); }
                    } else { console.warn(`[Default Effect] Default book ${defaultBook} not found in list.`); }
                } else { console.warn("[Default Effect] getBooks returned empty list."); }
            } catch (e) { console.error("[Default Effect] Error during default selection logic:", e); }
        }
    // Depend on bibleData and also check if selections are already made
    }, [bibleData, selectedBook, selectedChapter, selectedVerse, viewMode]);


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true); setFilterError(null);
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
             if (isMounted) { setFilteredConnectionData(null); setIsFiltering(false); setFilterError(null); }
        }
        return () => { isMounted = false; };
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Correct dependencies

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null); // Reset chapter
        setSelectedVerse(null); // Reset verse
        setFilteredConnectionData(null); // Clear data
        setFilterError(null);
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
        setVerseList([]); // Clear verse list
        setSelectedNodeId(null); // Clear selected node
    }, [bibleData]); // Dependency: bibleData for getChapters

    const handleChapterChange = useCallback((chapterNum) => {
        const newChapter = chapterNum ? parseInt(chapterNum, 10) : null;
        setSelectedChapter(newChapter);
        setSelectedVerse(null); // Reset verse on chapter change
        setFilterError(null);
        setVerseList(bibleData && selectedBook && newChapter ? getVersesForChapter(bibleData, selectedBook, newChapter) : []);
        // Update selectedNodeId based on chapter selection
        if (selectedBook && newChapter !== null) {
            const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${newChapter}`;
            setSelectedNodeId(chapterNodeId); // Default to chapter node ID
        } else {
            setSelectedNodeId(null);
        }
    }, [bibleData, selectedBook]); // Dependencies: bibleData, selectedBook

     const handleVerseChange = useCallback((verseNum) => {
        const newVerse = verseNum ? parseInt(verseNum, 10) : null;
        setSelectedVerse(newVerse);
        // Update selectedNodeId based on verse selection
        if (selectedBook && selectedChapter !== null) {
            if (newVerse !== null) {
                const verseNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}v${newVerse}`;
                setSelectedNodeId(verseNodeId);
            } else { // Verse dropdown set to "-- Verse --" or similar
                const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`;
                setSelectedNodeId(chapterNodeId); // Fallback to chapter node ID
            }
        } else {
            setSelectedNodeId(null);
        }
     }, [selectedBook, selectedChapter]); // Dependencies: selectedBook, selectedChapter

    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => {
            const newMode = prevMode === 'chapter' ? 'verse' : 'chapter';
            // When toggling, always reset selected node to the CHAPTER level ID
            if (selectedBook && selectedChapter !== null) {
                 const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`;
                 setSelectedNodeId(chapterNodeId);
            } else { setSelectedNodeId(null); }
            // Clear selected verse when switching TO chapter view or if no chapter selected
            setSelectedVerse(null);
            return newMode;
        });
    }, [selectedBook, selectedChapter]); // Dependencies: selectedBook, selectedChapter

    // handleNodeSelect now uses getNodeMetadata correctly
    const handleNodeSelect = useCallback((nodeId) => {
        setSelectedNodeId(nodeId); // Always update the selected node ID first
        const metadata = getNodeMetadata(nodeId); // Use imported function

        // Attempt to sync dropdowns if the node ID is parseable and known
        if (metadata && metadata.book && metadata.chapter && metadata.book !== 'Unknown') {
             // Only perform full dropdown state update if book or chapter is different
             if (metadata.book !== selectedBook || metadata.chapter !== selectedChapter) {
                // console.log(`Node click changed context from ${selectedBook} ${selectedChapter} to ${metadata.book} ${metadata.chapter}`);
                // Need bibleData to update lists
                if (bibleData) {
                    const bookChapters = getChapters(bibleData, metadata.book);
                    const chapterVerses = getVersesForChapter(bibleData, metadata.book, metadata.chapter);
                    setChapterList(bookChapters);
                    setVerseList(chapterVerses);
                } else {
                    // Clear lists if bibleData isn't ready (edge case)
                    setChapterList([]);
                    setVerseList([]);
                }
                 // Update the book and chapter state
                 setSelectedBook(metadata.book);
                 setSelectedChapter(metadata.chapter);
             } else {
                // console.log(`Node click within same chapter (${metadata.book} ${metadata.chapter})`);
             }
             // Always update selected verse based on the clicked node type
             setSelectedVerse(metadata.verse);
        } else {
             // If click was on something unparseable, maybe just clear verse?
             // console.log(`Clicked node ${nodeId} could not be fully parsed or book unknown.`);
             // Optionally clear verse if click is ambiguous?
             // setSelectedVerse(null);
        }
    }, [selectedBook, selectedChapter, bibleData]); // Add bibleData dependency

    // --- Return State and Handlers ---
    return {
        selectedBook, selectedChapter, selectedVerse, viewMode, chapterList, verseList,
        filteredConnectionData,
        isLoadingConnections: isFiltering, // Renamed for clarity in consumer
        filterError,
        selectedNodeId, // Still needed for selection highlighting
        handleBookChange, handleChapterChange, handleVerseChange, handleToggleView,
        handleNodeSelect
    };
}