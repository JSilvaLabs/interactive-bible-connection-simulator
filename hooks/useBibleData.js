// hooks/useBibleData.js (Correct MVP v6.0 Version)
"use client";

import { useState, useEffect } from 'react';
// Import the actual data loading functions
import { loadBibleText, loadAllReferences, getBooks } from '@/utils/dataService';

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

        // Use setTimeout to allow initial render before potentially heavy data load
        const timer = setTimeout(() => {
            if (!isMounted) return;
            try {
                // Call the actual load functions which might do internal caching/processing
                const loadedBibleData = loadBibleText();
                const loadedReferences = loadAllReferences();

                if (!isMounted) return; // Check again after loading
                setBibleData(loadedBibleData);
                setAllReferencesData(loadedReferences);

                // Derive book list from the loaded Bible data
                const books = getBooks(loadedBibleData);
                setBookList(books);
                console.log("useBibleData: Data loaded successfully.");

            } catch (err) {
                console.error("useBibleData: Data loading failed:", err);
                 if (isMounted) setError(err.message || "Failed to load core data.");
            } finally {
                if (isMounted) setIsLoadingData(false);
            }
        }, 10); // Small delay

         return () => {
             isMounted = false; // Prevent state updates on unmount
             clearTimeout(timer);
         };
    }, []); // Empty dependency array means this runs only once on mount

    return { bibleData, allReferencesData, bookList, isLoadingData, error };
}