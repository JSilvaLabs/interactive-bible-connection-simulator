// hooks/useVisualizationState.js (MRP v1.1 - Remove Hover State)
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
    getConnectionsFor, getChapters, getBooks, getVersesForChapter,
    normalizeBookNameForId, normalizeBookNameForText
} from '@/utils/dataService';

export function useVisualizationState(bibleData, allReferencesData) {
    // --- State ---
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedVerse, setSelectedVerse] = useState(null);
    const [viewMode, setViewMode] = useState('chapter');
    const [chapterList, setChapterList] = useState([]);
    const [verseList, setVerseList] = useState([]);
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [isFiltering, setIsFiltering] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    // REMOVED: const [hoveredNodeId, setHoveredNodeId] = useState(null);
    const [filterError, setFilterError] = useState(null);

     // --- Effect to Set Default Selection ---
     useEffect(() => { /* ... same default selection logic ... */
        if (bibleData && bibleData.books && bibleData.books.length > 0 && !selectedBook && !selectedChapter) {
            try {
                const books = getBooks(bibleData);
                if (books && books.length > 0) {
                    const defaultBook = "Genesis"; const defaultChapter = 5;
                    if (books.includes(defaultBook)) {
                        const defaultChapters = getChapters(bibleData, defaultBook);
                        if (defaultChapters && defaultChapters.includes(defaultChapter)) {
                            setSelectedBook(defaultBook); setSelectedChapter(defaultChapter);
                            setChapterList(defaultChapters);
                            const defaultVerses = getVersesForChapter(bibleData, defaultBook, defaultChapter);
                            setVerseList(defaultVerses);
                            const defaultNodeId = `${normalizeBookNameForId(defaultBook)}${defaultChapter}`;
                            setSelectedNodeId(defaultNodeId);
                            console.log(`useVisState: Set default selection: ${defaultBook} ${defaultChapter}, Node: ${defaultNodeId}, View: ${viewMode}`);
                        } else { console.warn(`[Default Effect] Could not find default chapter ${defaultChapter} in ${defaultBook}`); }
                    } else { console.warn(`[Default Effect] Default book ${defaultBook} not found in list.`); }
                } else { console.warn("[Default Effect] getBooks returned empty list."); }
            } catch (e) { console.error("[Default Effect] Error during default selection logic:", e); }
        }
    }, [bibleData]); // Only depends on bibleData loading


    // --- Effect to Update Filtered Data ---
    useEffect(() => { /* ... same filtering logic ... */
        let isMounted = true;
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true); setFilterError(null); // REMOVED: setHoveredNodeId(null);
            requestAnimationFrame(() => {
                if (!isMounted) return;
                try {
                    const filteredData = getConnectionsFor(allReferencesData, selectedBook, selectedChapter, viewMode);
                    if (isMounted) setFilteredConnectionData(filteredData);
                } catch (err) { console.error("useVisualizationState: Filtering failed:", err); if (isMounted) { setFilteredConnectionData(null); setFilterError("Failed to load connections."); }
                } finally { if (isMounted) setIsFiltering(false); }
            });
        } else { if (isMounted) { setFilteredConnectionData(null); setIsFiltering(false); setFilterError(null); } }
        return () => { isMounted = false; };
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]);

    // --- Memoized Event Handlers ---
    const handleBookChange = useCallback((bookName) => { /* ... same logic ... */
        setSelectedBook(bookName); setSelectedChapter(null); setSelectedVerse(null);
        setFilteredConnectionData(null); setFilterError(null);
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
        setVerseList([]); setSelectedNodeId(null);
    }, [bibleData]);

    const handleChapterChange = useCallback((chapterNum) => { /* ... same logic ... */
        const newChapter = chapterNum ? parseInt(chapterNum, 10) : null;
        setSelectedChapter(newChapter); setSelectedVerse(null); setFilterError(null);
        setVerseList(bibleData && selectedBook && newChapter ? getVersesForChapter(bibleData, selectedBook, newChapter) : []);
        if (selectedBook && newChapter !== null) { const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${newChapter}`; setSelectedNodeId(chapterNodeId); } else { setSelectedNodeId(null); }
    }, [bibleData, selectedBook]);

     const handleVerseChange = useCallback((verseNum) => { /* ... same logic ... */
        const newVerse = verseNum ? parseInt(verseNum, 10) : null;
        setSelectedVerse(newVerse);
        if (selectedBook && selectedChapter !== null) {
            if (newVerse !== null) { const verseNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}v${newVerse}`; setSelectedNodeId(verseNodeId); }
            else { const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`; setSelectedNodeId(chapterNodeId); }
        } else { setSelectedNodeId(null); }
     }, [selectedBook, selectedChapter]);

    const handleToggleView = useCallback(() => { /* ... same logic ... */
        setViewMode(prevMode => {
            const newMode = prevMode === 'chapter' ? 'verse' : 'chapter';
            if (selectedBook && selectedChapter !== null) { const chapterNodeId = `${normalizeBookNameForId(selectedBook)}${selectedChapter}`; setSelectedNodeId(chapterNodeId); }
            else { setSelectedNodeId(null); }
            setSelectedVerse(null); return newMode;
        });
    }, [selectedBook, selectedChapter]);

    // Only handle node selection now
    const handleNodeSelect = useCallback((nodeId) => { setSelectedNodeId(nodeId); }, []);
    // REMOVED: const handleNodeHoverStart = useCallback((nodeId) => { setHoveredNodeId(nodeId); }, []);
    // REMOVED: const handleNodeHoverEnd = useCallback(() => { setHoveredNodeId(null); }, []);

    // --- Return State and Handlers ---
    return {
        selectedBook, selectedChapter, selectedVerse, viewMode, chapterList, verseList,
        filteredConnectionData,
        isLoadingConnections: isFiltering, // Renamed for clarity in consumer
        filterError,
        selectedNodeId, // Still needed for selection highlighting
        // REMOVED: hoveredNodeId,
        handleBookChange, handleChapterChange, handleVerseChange, handleToggleView,
        handleNodeSelect
        // REMOVED: handleNodeHoverStart, handleNodeHoverEnd
    };
}