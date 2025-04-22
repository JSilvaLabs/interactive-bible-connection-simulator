"use client";

import { useState, useEffect, useCallback } from 'react';
import ArcDiagramContainer from '@/components/ArcDiagramContainer'; // Use Arc container
import ViewToggle from '@/components/ViewToggle';
import TextDisplayPanel from '@/components/TextDisplayPanel';
import ReferenceSelector from '@/components/ReferenceSelector';
import ReferenceListPanel from '@/components/ReferenceListPanel';
import MetadataPanel from '@/components/MetadataPanel';
import {
    loadBibleText,
    loadAllReferences,
    getBooks,
    getChapters,
    getConnectionsFor,
} from '@/utils/dataService';

export default function MainPage() {
    // --- State Declarations ---
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [error, setError] = useState(null);
    const [bibleData, setBibleData] = useState(null);
    const [allReferencesData, setAllReferencesData] = useState(null);
    const [bookList, setBookList] = useState([]);
    const [chapterList, setChapterList] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null); // Start null, set default later
    const [selectedChapter, setSelectedChapter] = useState(null); // Start null, set default later
    const [viewMode, setViewMode] = useState('chapter');
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 }); // Adjust default dimensions if needed

    // --- Data Loading & Default Selection Effect ---
    useEffect(() => {
        console.log("Initiating data load...");
        setIsLoadingData(true);
        setError(null);
        setBookList([]); setChapterList([]); setSelectedBook(null); setSelectedChapter(null); // Reset selections
        try {
            const loadedBibleData = loadBibleText();
            const loadedReferences = loadAllReferences();
            setBibleData(loadedBibleData);
            setAllReferencesData(loadedReferences);
            const books = getBooks(loadedBibleData);
            setBookList(books);

            // --- MVP v5.0: Set Default Selection ---
            if (books.length > 0) {
                const defaultBook = books[0]; // First canonical book (Genesis)
                const defaultChapters = getChapters(loadedBibleData, defaultBook);
                const defaultChapter = defaultChapters.length > 0 ? defaultChapters[0] : null; // Chapter 1

                if (defaultBook && defaultChapter !== null) {
                    setSelectedBook(defaultBook);
                    setSelectedChapter(defaultChapter);
                    setChapterList(defaultChapters); // Populate chapter dropdown for the default book
                    console.log(`Set default selection: ${defaultBook} ${defaultChapter}`);
                    // Note: The filtering useEffect will automatically trigger now
                } else {
                     console.log(`Could not set default chapter for default book: ${defaultBook}`);
                }
            } else {
                 console.warn("Book list is empty after loading data.");
            }
            // --- End Default Selection ---

            console.log("Data loaded successfully.");
        } catch (err) {
            console.error("Data loading failed:", err);
            setError(err.message || "Failed to load core data.");
        } finally {
            setIsLoadingData(false);
        }
    }, []); // Run only once on mount

    // --- Filtering Effect (No change needed here) ---
    const filterAndSetConnections = useCallback(() => {
        if (selectedBook && selectedChapter && allReferencesData) {
            // console.log(`Filtering for: ${selectedBook} ${selectedChapter}, Mode: ${viewMode}`);
            setIsFiltering(true); setSelectedNodeId(null); setHoveredNodeId(null);
            requestAnimationFrame(() => {
                 try {
                    const filteredData = getConnectionsFor(allReferencesData, selectedBook, selectedChapter, viewMode);
                    setFilteredConnectionData(filteredData);
                    // console.log("Filtering complete.", filteredData);
                } catch (err) {
                     console.error("Filtering failed:", err); setError("Failed to filter connections."); setFilteredConnectionData(null);
                } finally { setIsFiltering(false); }
            });
        } else { setFilteredConnectionData(null); }
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]);

    useEffect(() => {
        filterAndSetConnections();
    }, [filterAndSetConnections]);

    // --- Resize Effect (Adjust for Vertical Layout) ---
    useEffect(() => {
        const handleResize = () => {
             const isLargeScreen = window.innerWidth >= 1024;
             // Allocate more width to info panels if needed, or keep fixed
             const infoPanelWidth = isLargeScreen ? 340 : 0;
             const gap = isLargeScreen ? 16 : 0;
             const padding = 24; // Adjusted padding slightly
             // Width for the SVG container
             const availableVizWidth = window.innerWidth - infoPanelWidth - gap - padding;
             // Height for the SVG container - use available vertical space minus header/footer
             const headerFooterHeight = 100; // Estimate height of header/footer elements
             const availableVizHeight = window.innerHeight - headerFooterHeight - padding;

             const calculatedWidth = Math.max(300, availableVizWidth * 0.98); // Use most width
             const calculatedHeight = Math.max(400, availableVizHeight); // Use most height

            setDimensions({ width: calculatedWidth, height: calculatedHeight });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Event Handlers (No change needed) ---
     const handleBookChange = (bookName) => {
        setSelectedBook(bookName); setSelectedChapter(null);
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
    };
    const handleChapterChange = (chapterNum) => { setSelectedChapter(chapterNum); };
    const handleToggleView = () => { setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter')); };
    const handleNodeSelect = (nodeId) => { setSelectedNodeId(nodeId); setHoveredNodeId(null); };
    const handleNodeHoverStart = (nodeId) => { setHoveredNodeId(nodeId); };
    const handleNodeHoverEnd = () => { setHoveredNodeId(null); };

    // --- Render Logic ---
    if (isLoadingData && !error) { return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>; }
    if (error) { return <div className="flex justify-center items-center min-h-screen text-red-500 p-4 text-center">Error: {error}</div>; }

    return (
        <main className="flex flex-col items-center h-screen max-h-screen p-3 md:p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header Area */}
            <div className="flex-shrink-0 w-full max-w-screen-xl px-2">
                 <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                    Internal Bible Connection Simulator (MVP v5.0 - Vert Arc)
                </h1>
                <div className="flex flex-wrap gap-2 md:gap-4 mb-3 items-center justify-center">
                    <ReferenceSelector /* Pass props */
                        bookList={bookList} chapterList={chapterList} selectedBook={selectedBook} selectedChapter={selectedChapter}
                        onBookChange={handleBookChange} onChapterChange={handleChapterChange} isDisabled={isLoadingData || isFiltering}
                    />
                    <ViewToggle /* Pass props */
                        currentView={viewMode} onToggle={handleToggleView} disabled={!selectedChapter || isFiltering || isLoadingData}
                    />
                </div>
            </div>

            {/* Main Content Area */}
             <div className="flex flex-col lg:flex-row w-full max-w-screen-xl gap-3 flex-grow min-h-0 px-2">
                {/* Visualization Area */}
                <div className="w-full lg:w-[calc(100%-340px)] h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1">
                     {isFiltering && ( /* Filtering Loader */
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-20">
                            <span className="text-white font-semibold text-lg animate-pulse">Loading Connections...</span>
                        </div>
                     )}
                    {/* Use ArcDiagramContainer */}
                    <ArcDiagramContainer
                        data={filteredConnectionData}
                        isLoading={isFiltering || !selectedChapter}
                        width={dimensions.width}
                        height={dimensions.height}
                        onNodeSelect={handleNodeSelect}
                        onNodeHoverStart={handleNodeHoverStart}
                        onNodeHoverEnd={handleNodeHoverEnd}
                    />
                </div>

                {/* Info Panels Area */}
                <div className="w-full lg:w-[340px] lg:max-w-[340px] flex-shrink-0 h-full flex flex-col gap-3 lg:max-h-full">
                     <div className="flex-shrink-0"> {/* Metadata */}
                        <MetadataPanel selectedNodeId={selectedNodeId} hoveredNodeId={hoveredNodeId} />
                     </div>
                     <div className="flex-1 min-h-[150px]"> {/* Text */}
                        <TextDisplayPanel selectedNodeId={selectedNodeId} hoveredNodeId={hoveredNodeId} bibleData={bibleData} isLoadingBibleData={isLoadingData} />
                     </div>
                     <div className="flex-1 min-h-[150px]"> {/* References */}
                        <ReferenceListPanel selectedNodeId={selectedNodeId} connectionData={filteredConnectionData} isLoadingConnections={isFiltering} />
                     </div>
                </div>
            </div>

            {/* Footer Area */}
            <footer className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 py-1">
                MVP v5.0 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}