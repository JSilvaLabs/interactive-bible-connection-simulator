// hooks/useBibleData.js (MVP v9.0)
"use client";

import { useState, useEffect } from 'react';
// Import potentially optimized dataService functions
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
        setIsLoadingData(true); setError(null); setBookList([]);

        const timer = setTimeout(() => { // Ensure initial render happens first
            if (!isMounted) return;
            try {
                // These might now trigger internal pre-processing in dataService
                const loadedBibleData = loadBibleText();
                const loadedReferences = loadAllReferences();

                if (!isMounted) return;
                setBibleData(loadedBibleData);
                setAllReferencesData(loadedReferences);
                const books = getBooks(loadedBibleData); // Uses potentially optimized dataService
                setBookList(books);
                console.log("useBibleData: Data loaded successfully.");

            } catch (err) {
                console.error("useBibleData: Data loading failed:", err);
                 if (isMounted) setError(err.message || "Failed to load core data.");
            } finally {
                if (isMounted) setIsLoadingData(false);
            }
        }, 10);

         return () => { isMounted = false; clearTimeout(timer); };
    }, []);

    return { bibleData, allReferencesData, bookList, isLoadingData, error };
}