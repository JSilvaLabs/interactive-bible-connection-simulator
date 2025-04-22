"use client";

import { useState, useEffect, useCallback } from 'react';
import VisualizationContainer from '@/components/VisualizationContainer';
import ViewToggle from '@/components/ViewToggle';
import TextDisplayPanel from '@/components/TextDisplayPanel';
import ReferenceSelector from '@/components/ReferenceSelector';
import ReferenceListPanel from '@/components/ReferenceListPanel'; // Import new panel
import {
    loadBibleText,
    loadAllReferences,
    getBooks,
    getChapters,
    getConnectionsFor,
} from '@/utils/dataService';

export default function MainPage() {
    // --- State Declarations ---
    const [isLoadingData, setIsLoadingData] = useState(true); // For initial data load
    const [isFiltering, setIsFiltering] = useState(false); // For filtering connections
    const [error, setError] = useState(null);

    const [bibleData, setBibleData] = useState(null);
    const [allReferencesData, setAllReferencesData] = useState(null); // Holds all links

    const [bookList, setBookList] = useState([]);
    const [chapterList, setChapterList] = useState([]);

    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [viewMode, setViewMode] = useState('chapter'); // 'chapter' or 'verse'

    const [filteredConnectionData, setFilteredConnectionData] = useState(null); // Data for ChordDiagram
    const [selectedNodeId, setSelectedNodeId] = useState(null); // Node clicked in diagram

    const [dimensions, setDimensions] = useState({ width: 600, height: 600 }); // Visualization dimensions

    // --- Data Loading Effect ---
    useEffect(() => {
        console.log("Initiating data load...");
        setIsLoadingData(true);
        setError(null);
        setBookList([]); // Clear lists initially
        setChapterList([]);
        try {
            const loadedBibleData = loadBibleText();
            const loadedReferences = loadAllReferences();

            setBibleData(loadedBibleData);
            setAllReferencesData(loadedReferences);

            // Use canonical book order from service
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
    const filterAndSetConnections = useCallback(() => {
        if (selectedBook && selectedChapter && allReferencesData) {
            console.log(`Filtering for: ${selectedBook} ${selectedChapter}, Mode: ${viewMode}`);
            setIsFiltering(true);
            setSelectedNodeId(null); // Reset diagram selection on filter change
            // Debounce or delay slightly to allow UI update
            const timer = setTimeout(() => {
                try {
                    const filteredData = getConnectionsFor(allReferencesData, selectedBook, selectedChapter, viewMode);
                    setFilteredConnectionData(filteredData);
                    console.log("Filtering complete.", filteredData);
                } catch (err) {
                     console.error("Filtering failed:", err);
                     setError("Failed to filter connections.");
                     setFilteredConnectionData(null);
                } finally {
                    setIsFiltering(false);
                }
            }, 50); // Short delay
             return () => clearTimeout(timer); // Cleanup timer on re-run
        } else {
            setFilteredConnectionData(null); // Clear diagram if selection is incomplete
        }
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Dependencies

    useEffect(() => {
        filterAndSetConnections();
    }, [filterAndSetConnections]);

    // --- Resize Effect ---
    useEffect(() => {
        const handleResize = () => {
             // Determine available width for the visualization column
             // Consider gaps and potentially fixed width for text/ref panels
             const isLargeScreen = window.innerWidth >= 1024; // lg breakpoint
             const sidePanelWidth = isLargeScreen ? 400 : 0; // Approx width of right column
             const gap = isLargeScreen ? 16 : 0; // Gap between columns
             const padding = 32; // Approx horizontal padding of main container (p-4 * 2)
             const availableVizWidth = window.innerWidth - sidePanelWidth - gap - padding;

            // Calculate size for square aspect ratio, fitting within height constraints too
            const size = Math.max(300, Math.min(availableVizWidth * 0.9, window.innerHeight * 0.65)); // Adjust multiplier/max height
            setDimensions({ width: size, height: size });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Event Handlers ---
    const handleBookChange = (bookName) => {
        setSelectedBook(bookName);
        setSelectedChapter(null);
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
        // Filtering runs via useEffect
    };

    const handleChapterChange = (chapterNum) => {
        setSelectedChapter(chapterNum);
        // Filtering runs via useEffect
    };

    const handleToggleView = () => {
        setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter'));
        // Filtering runs via useEffect
    };

    const handleNodeSelect = (nodeId) => {
        console.log("Node selected in diagram:", nodeId);
        setSelectedNodeId(nodeId); // Update state for Text/Reference panels
    };

    // --- Render Logic ---
    if (isLoadingData && !error) { // Show loading only if no error yet
        return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center min-h-screen text-red-500 p-4 text-center">Error: {error}</div>;
    }

    return (
        <main className="flex flex-col items-center h-screen max-h-screen p-4 md:p-6 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header Area */}
            <div className="flex-shrink-0 w-full max-w-6xl">
                 <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-center">
                    Internal Bible Connection Simulator (MVP v2.0)
                </h1>
                <div className="flex flex-wrap gap-4 mb-4 items-center justify-center">
                    <ReferenceSelector
                        bookList={bookList}
                        chapterList={chapterList}
                        selectedBook={selectedBook}
                        selectedChapter={selectedChapter}
                        onBookChange={handleBookChange}
                        onChapterChange={handleChapterChange}
                        isDisabled={isLoadingData} // Disable during initial load
                    />
                    {/* Enable toggle only when a chapter is selected */}
                    <ViewToggle
                        currentView={viewMode}
                        onToggle={handleToggleView}
                        disabled={!selectedChapter || isFiltering} // Disable if no chapter or currently filtering
                    />
                </div>
            </div>

            {/* Main Content Area (Diagram + Info Panels) */}
             <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-4 flex-grow min-h-0"> {/* min-h-0 prevents flex blowout */}
                {/* Visualization Area */}
                <div className="w-full lg:w-2/3 xl:w-3/4 h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden">
                     {/* Loading overlay for filtering */}
                     {isFiltering && (
                        <div className="absolute inset-0 bg-gray-500 bg-opacity-70 flex justify-center items-center z-20">
                            <span className="text-white font-semibold text-lg animate-pulse">Loading Connections...</span>
                        </div>
                     )}
                    <VisualizationContainer
                        data={filteredConnectionData}
                        isLoading={isFiltering || !selectedChapter} // Loading if filtering or no chapter selected
                        width={dimensions.width}
                        height={dimensions.height}
                        onNodeSelect={handleNodeSelect}
                    />
                </div>

                {/* Info Panels Area (Side Column) */}
                <div className="w-full lg:w-1/3 xl:w-1/4 h-full flex flex-col gap-4">
                     {/* Use full height potentially */}
                    <div className="flex-1 min-h-[200px]"> {/* Ensure minimum height */}
                        <TextDisplayPanel
                            selectedNodeId={selectedNodeId}
                            bibleData={bibleData}
                            isLoadingBibleData={isLoadingData}
                        />
                     </div>
                     <div className="flex-1 min-h-[200px]"> {/* Ensure minimum height */}
                        <ReferenceListPanel
                             selectedNodeId={selectedNodeId}
                             connectionData={filteredConnectionData}
                             isLoadingConnections={isFiltering}
                         />
                     </div>
                </div>
            </div>

            {/* Footer Area */}
            <footer className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                MVP v2.0 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}