"use client";

import { useState, useEffect, useCallback } from 'react';
import VisualizationContainer from '@/components/VisualizationContainer';
import ViewToggle from '@/components/ViewToggle';
import TextDisplayPanel from '@/components/TextDisplayPanel';
import ReferenceSelector from '@/components/ReferenceSelector'; // Import new component
import {
    loadBibleText,
    loadAllReferences,
    getBooks,
    getChapters,
    getConnectionsFor, // Assuming dataService exports this
    // getTextForReference is used by TextDisplayPanel internally based on this design
} from '@/utils/dataService';

export default function MainPage() {
    // --- State Declarations ---
    const [isLoadingData, setIsLoadingData] = useState(true); // For initial data load
    const [isFiltering, setIsFiltering] = useState(false); // For filtering connections
    const [error, setError] = useState(null); // For critical errors

    const [bibleData, setBibleData] = useState(null);
    const [allReferencesData, setAllReferencesData] = useState(null); // Holds all links

    const [bookList, setBookList] = useState([]);
    const [chapterList, setChapterList] = useState([]);

    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [viewMode, setViewMode] = useState('chapter'); // 'chapter' or 'verse' for filtered view

    const [filteredConnectionData, setFilteredConnectionData] = useState(null); // Data for ChordDiagram
    const [selectedNodeId, setSelectedNodeId] = useState(null); // Node clicked in diagram

    const [dimensions, setDimensions] = useState({ width: 600, height: 600 });

    // --- Data Loading Effect ---
    useEffect(() => {
        console.log("Initiating data load...");
        setIsLoadingData(true);
        setError(null);
        try {
            const loadedBibleData = loadBibleText();
            const loadedReferences = loadAllReferences();

            setBibleData(loadedBibleData);
            setAllReferencesData(loadedReferences);

            const books = getBooks(loadedBibleData);
            setBookList(books);
            console.log("Data loaded successfully.");
        } catch (err) {
            console.error("Data loading failed:", err);
            setError(err.message || "Failed to load core data.");
        } finally {
            setIsLoadingData(false);
        }
    }, []); // Run only once on mount

    // --- Filtering Effect ---
    // Use useCallback to memoize the filter function if it becomes complex
    const filterAndSetConnections = useCallback(() => {
        if (selectedBook && selectedChapter && allReferencesData) {
            console.log(`Filtering for: ${selectedBook} ${selectedChapter}, Mode: ${viewMode}`);
            setIsFiltering(true); // Indicate filtering start
            setSelectedNodeId(null); // Reset text panel selection
            try {
                // Simulate async filtering if it were heavy
                setTimeout(() => {
                    const filteredData = getConnectionsFor(allReferencesData, selectedBook, selectedChapter, viewMode);
                    setFilteredConnectionData(filteredData);
                    console.log("Filtering complete.", filteredData);
                    setIsFiltering(false); // Indicate filtering end
                 }, 50); // Small timeout to allow UI update for loading state
            } catch (err) {
                 console.error("Filtering failed:", err);
                 setError("Failed to filter connections.");
                 setFilteredConnectionData(null);
                 setIsFiltering(false);
            }
        } else {
            setFilteredConnectionData(null); // Clear diagram if selection is incomplete
             console.log("Selection incomplete, clearing diagram.");
        }
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Dependencies for filtering

    useEffect(() => {
        filterAndSetConnections();
    }, [filterAndSetConnections]); // Run filter when dependencies change

    // --- Resize Effect ---
    useEffect(() => {
        const handleResize = () => {
            const availableWidth = window.innerWidth < 1024 ? window.innerWidth * 0.95 : (window.innerWidth * 0.9) / 2 - 30; // Adjust for gaps/padding
            const size = Math.max(300, Math.min(availableWidth, window.innerHeight * 0.7));
            setDimensions({ width: size, height: size });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Event Handlers ---
    const handleBookChange = (bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null); // Reset chapter when book changes
        setFilteredConnectionData(null); // Clear diagram
        if (bibleData && bookName) {
            setChapterList(getChapters(bibleData, bookName));
        } else {
            setChapterList([]);
        }
    };

    const handleChapterChange = (chapterNum) => {
        setSelectedChapter(chapterNum);
        // Filtering is handled by the useEffect hook watching selectedChapter
    };

    const handleToggleView = () => {
        setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter'));
        // Filtering is handled by the useEffect hook watching viewMode
    };

    const handleNodeSelect = (nodeId) => {
        console.log("Node selected in diagram:", nodeId);
        setSelectedNodeId(nodeId); // Update state for TextDisplayPanel
    };

    // --- Render Logic ---
    if (isLoadingData) {
        return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
    }

    return (
        <main className="flex flex-col items-center min-h-screen p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-center">
                Internal Bible Connection Simulator (MVP)
            </h1>

            <div className="flex flex-wrap gap-4 mb-4 items-center justify-center w-full max-w-4xl">
                 <ReferenceSelector
                    bookList={bookList}
                    chapterList={chapterList}
                    selectedBook={selectedBook}
                    selectedChapter={selectedChapter}
                    onBookChange={handleBookChange}
                    onChapterChange={handleChapterChange}
                    isDisabled={!bibleData} // Disable if bible data hasn't loaded (shouldn't happen after loading state check)
                />
                {/* Keep toggle if needed for chapter/verse view OF THE FILTERED DATA */}
                {/* <ViewToggle currentView={viewMode} onToggle={handleToggleView} /> */}
            </div>


            {/* Layout container for Diagram and Text Panel */}
            <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-4 flex-grow h-[calc(100vh-200px)]"> {/* Adjust height calc as needed */}
                {/* Visualization Area */}
                <div className="w-full lg:w-1/2 h-full min-h-[350px] border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg overflow-hidden flex justify-center items-center bg-white dark:bg-gray-900 relative">
                     {/* Loading overlay for filtering */}
                     {isFiltering && (
                        <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-20">
                            <span className="text-white font-semibold">Loading Connections...</span>
                        </div>
                     )}
                    <VisualizationContainer
                        // Pass filtered data, loading state is handled internally too
                        data={filteredConnectionData}
                        isLoading={isFiltering || !selectedBook || !selectedChapter} // Pass filtering status
                        width={dimensions.width}
                        height={dimensions.height}
                        onNodeSelect={handleNodeSelect}
                    />
                </div>

                {/* Text Display Area */}
                <div className="w-full lg:w-1/2 h-full min-h-[300px]">
                    <TextDisplayPanel
                        selectedNodeId={selectedNodeId}
                        bibleData={bibleData}
                        isLoadingBibleData={isLoadingData} // Pass main data loading status
                    />
                </div>
            </div>

            <footer className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                MVP v1.0 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}