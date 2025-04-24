// hooks/useVisualizationState.js (MVP v8.3 - Add finally Log)
"use client";

import { useState, useEffect, useCallback } from 'react';
// Import necessary functions from dataService
import {
    getConnectionsFor,
    getChapters,
    getBooks,
    getVersesForChapter,
    normalizeBookNameForId, // Needed for constructing node IDs
    normalizeBookNameForText // Needed by getVersesForChapter if defined locally
} from '@/utils/dataService';

// Helper function moved here from dataService temporarily for direct access if needed
// Ensure this matches the version in dataService or remove if import works reliably
const getVersesForChapterLocal = (bibleData, bookName, chapterNum) => {
    if (!bibleData || !bookName || !chapterNum) return [];
    try {
        const canonicalBook = normalizeBookNameForText(bookName);
        // Assume bibleLookupMap might not be ready, use raw data if available
        const book = bibleData.books?.find(b => normalizeBookNameForText(b.name) === canonicalBook);
        const chapter = book?.chapters?.find(c => c.chapter === chapterNum);
        return chapter?.verses?.map(v => v.verse).sort((a, b) => a - b) || [];
    } catch (error) {
        console.error(`Error getting verses for ${bookName} ${chapterNum}:`, error);
    }
    return [];
};


export function useVisualizationState(bibleData, allReferencesData) {
    // --- State ---
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedVerse, setSelectedVerse] = useState(null);
    const [viewMode, setViewMode] = useState('chapter');
    const [chapterList, setChapterList] = useState([]);
    const [verseList, setVerseList] = useState([]);
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [isFiltering, setIsFiltering] = useState(false); // Default should be false
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    const [filterError, setFilterError] = useState(null);

     // --- Effect to Set Default Selection ---
     useEffect(() => {
        // console.log(`[Default Effect] Running. bibleData valid: ${!!bibleData?.books}, selectedBook: ${selectedBook}, selectedChapter: ${selectedChapter}`);
        if (bibleData && bibleData.books && bibleData.books.length > 0 && !selectedBook && !selectedChapter) {
            // console.log("[Default Effect] Conditions met, attempting to set default...");
            try {
                const books = getBooks(bibleData);
                if (books && books.length > 0) {
                    const defaultBook = "Genesis"; const defaultChapter = 5;
                    if (books.includes(defaultBook)) {
                        const defaultChapters = getChapters(bibleData, defaultBook);
                        if (defaultChapters && defaultChapters.includes(defaultChapter)) {
                            setSelectedBook(defaultBook); setSelectedChapter(defaultChapter); setChapterList(defaultChapters);
                            // Use the local helper or imported one
                            const defaultVerses = getVersesForChapterLocal(bibleData, defaultBook, defaultChapter);
                            setVerseList(defaultVerses);
                            const defaultNodeId = `${normalizeBookNameForId(defaultBook)}${defaultChapter}`;
                            setSelectedNodeId(defaultNodeId);
                            console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter}, Node: ${defaultNodeId}, View: ${viewMode}`);
                        } else { console.warn(`[Default Effect] Could not find default chapter ${defaultChapter} in ${defaultBook}`); }
                    } else { console.warn(`[Default Effect] Default book ${defaultBook} not found in list.`); }
                } else { console.warn("[Default Effect] getBooks returned empty list."); }
            } catch (e) { console.error("[Default Effect] Error during default selection logic:", e); }
        }
    }, [bibleData]); // Depend only on bibleData


    // --- Effect to Update Filtered Data ---
    useEffect(() => {
        let isMounted = true;
        if (selectedBook && selectedChapter && allReferencesData) {
            // console.log(`[Filter Effect] Triggered for ${selectedBook} ${selectedChapter} - Mode ${viewMode}`);
            setIsFiltering(true); // Set filtering BEFORE async operation
            setFilterError(null);
            setHoveredNodeId(null); // Reset hover always

            requestAnimationFrame(() => { // Allow state update to render
                if (!isMounted) return;
                try {
                    // console.log(`[Filter Effect] Calling getConnectionsFor...`);
                    const filteredData = getConnectionsFor(allReferencesData, selectedBook, selectedChapter, viewMode);
                     if (isMounted) {
                        // console.log(`[Filter Effect] Setting filtered data: nodes=${filteredData?.nodes?.length}, links=${filteredData?.links?.length}`);
                        setFilteredConnectionData(filteredData);
                     }
                } catch (err) {
                    console.error("useVisualizationState: Filtering failed:", err);
                     if (isMounted) { setFilteredConnectionData(null); setFilterError("Failed to load connections."); }
                } finally {
                     if (isMounted) {
                         console.log("[Filter Effect] Setting isFiltering to false."); // <<< ADDED LOG HERE
                         setIsFiltering(false);
                     }
                }
            });
        } else {
             // If selection is incomplete, ensure filtering is false and data is null
             if(isFiltering) setIsFiltering(false); // Reset if selection cleared while filtering
             if(filteredConnectionData !== null) setFilteredConnectionData(null);
             if(filterError !== null) setFilterError(null);
             // console.log("[Filter Effect] Selection incomplete, ensuring filter state reset.");
        }
        return () => { isMounted = false; }; // Cleanup flag
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Dependencies

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => {
        setSelectedBook(bookName); setSelectedChapter(null); setSelectedVerse(null);
        setFilteredConnectionData(null); setFilterError(null); setSelectedNodeId(null); // Reset node ID
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []); setVerseList([]);
    }, [bibleData]);

    const handleChapterChange = useCallback((chapterNum) => {
        const newChapter = chapterNum ? parseInt(chapterNum, 10) : null;
        setSelectedChapter(newChapter); setSelectedVerse(null); setFilterError(null);
        setVerseList(bibleData && selectedBook && newChapter ? getVersesForChapterLocal(bibleData, selectedBook, newChapter) : []); // Use local helper
        if (selectedBook && newChapter !== null) { const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${newChapter}`; setSelectedNodeId(chapterNodeId); } else { setSelectedNodeId(null); }
    }, [bibleData, selectedBook]); // Add selectedBook dependency

     const handleVerseChange = useCallback((verseNum) => {
        const newVerse = verseNum ? parseInt(verseNum, 10) : null;
        setSelectedVerse(newVerse);
        if (selectedBook && selectedChapter !== null) {
            if (newVerse !== null) { const verseNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}v${newVerse}`; setSelectedNodeId(verseNodeId); }
            else { const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`; setSelectedNodeId(chapterNodeId); }
        } else { setSelectedNodeId(null); }
     }, [selectedBook, selectedChapter]);

    const handleToggleView = useCallback(() => {
        setViewMode(prevMode => { const newMode = prevMode === 'chapter' ? 'verse' : 'chapter'; if (selectedBook && selectedChapter !== null) { const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`; setSelectedNodeId(chapterNodeId); } else { setSelectedNodeId(null); } setSelectedVerse(null); return newMode; });
    }, [selectedBook, selectedChapter]);

    const handleNodeSelect = useCallback((nodeId) => { setSelectedNodeId(nodeId); setHoveredNodeId(null); }, []);
    const handleNodeHoverStart = useCallback((nodeId) => { setHoveredNodeId(nodeId); }, []);
    const handleNodeHoverEnd = useCallback(() => { setHoveredNodeId(null); }, []);

    // --- Return State and Handlers ---
    return { selectedBook, selectedChapter, selectedVerse, viewMode, chapterList, verseList, filteredConnectionData, isFiltering, filterError, selectedNodeId, hoveredNodeId, handleBookChange, handleChapterChange, handleVerseChange, handleToggleView, handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd };
}

// Added local helper function for getVersesForChapter to ensure availability
// Make sure normalizeBookNameForText is also defined or imported if needed by this helper
// (It's imported below, which is fine)
const getVersesForChapter = (bibleData, bookName, chapterNum) => {
    if (!bibleData || !bookName || !chapterNum) return [];
    try {
        const canonicalBook = normalizeBookNameForText(bookName); // Need this function
        const book = bibleData.books?.find(b => normalizeBookNameForText(b.name) === canonicalBook); // Use text normalization
        const chapter = book?.chapters?.find(c => c.chapter === chapterNum);
        return chapter?.verses?.map(v => v.verse).sort((a, b) => a - b) || [];
    } catch (error) { console.error(`Error getting verses for ${bookName} ${chapterNum}:`, error); }
    return [];
};

// Import needed normalization functions IF they are used within local helpers above
import { normalizeBookNameForText } from '@/utils/dataService';