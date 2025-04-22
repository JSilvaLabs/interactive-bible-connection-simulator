// hooks/useBibleData.js
"use client"; // Hooks used in client components need this

import { useState, useEffect } from 'react';
// Assuming synchronous load is acceptable for now
import { loadBibleText, loadAllReferences, getBooks } from '@/utils/dataService';

/**
 * Custom hook to load and manage primary Bible and reference data.
 */
export function useBibleData() {
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [bibleData, setBibleData] = useState(null);
    const [allReferencesData, setAllReferencesData] = useState(null);
    const [bookList, setBookList] = useState([]);

    useEffect(() => {
        let isMounted = true;
        console.log("useBibleData: Initiating data load...");
        setIsLoadingData(true);
        setError(null);
        setBookList([]); // Clear previous list

        // Use setTimeout to ensure initial state is set before loading potentially large files
        const timer = setTimeout(() => {
            if (!isMounted) return;
            try {
                // Critical: loadBibleText/loadAllReferences might perform internal optimizations/caching now
                const loadedBibleData = loadBibleText();
                const loadedReferences = loadAllReferences();

                if (!isMounted) return; // Check after loading
                setBibleData(loadedBibleData);
                setAllReferencesData(loadedReferences);

                const books = getBooks(loadedBibleData); // Assumes getBooks uses loadedBibleData
                setBookList(books);
                console.log("useBibleData: Data loaded successfully.");

            } catch (err) {
                console.error("useBibleData: Data loading failed:", err);
                 if (isMounted) setError(err.message || "Failed to load core data.");
            } finally {
                if (isMounted) setIsLoadingData(false);
            }
        }, 10); // Short delay for initial render

        return () => {
            isMounted = false; // Prevent state updates on unmount
            clearTimeout(timer);
        };
    }, []); // Empty dependency array means this runs only once on mount

    return { bibleData, allReferencesData, bookList, isLoadingData, error };
}