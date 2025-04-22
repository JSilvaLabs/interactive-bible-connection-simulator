"use client";

import { useState, useEffect, useCallback } from 'react';
import ArcDiagramContainer from '@/components/ArcDiagramContainer'; // Import ArcDiagramContainer
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
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [viewMode, setViewMode] = useState('chapter'); // Still relevant for filtering in dataService
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    // Dimensions state now applies to ArcDiagramContainer's SVG
    const [dimensions, setDimensions] = useState({ width: 800, height: 400 }); // Default more suited for Arc

    // --- Data Loading Effect ---
    useEffect(() => {
        // ... (Data loading logic remains the same as MVP v3.0) ...
        console.log("Initiating data load...");
        setIsLoadingData(true); setError(null); setBookList([]); setChapterList([]);
        try {
            const loadedBibleData = loadBibleText();
            const loadedReferences = loadAllReferences();
            setBibleData(loadedBibleData); setAllReferencesData(loadedReferences);
            const books = getBooks(loadedBibleData); setBookList(books);
            console.log("Data loaded successfully.");
        } catch (err) {
            console.error("Data loading failed:", err); setError(err.message || "Failed to load core data.");
        } finally { setIsLoadingData(false); }
    }, []);

    // --- Filtering Effect ---
    const filterAndSetConnections = useCallback(() => {
        // ... (Filtering logic remains the same as MVP v3.0, relies on updated dataService) ...
        if (selectedBook && selectedChapter && allReferencesData) {
            // console.log(`Filtering for: ${selectedBook} ${selectedChapter}, Mode: ${viewMode}`); // viewMode might be less relevant now
            setIsFiltering(true); setSelectedNodeId(null); setHoveredNodeId(null);
            requestAnimationFrame(() => {
                 try {
                    // getConnectionsFor now returns canonically sorted nodes needed for ArcDiagram
                    const filteredData = getConnectionsFor(allReferencesData, selectedBook, selectedChapter, viewMode);
                    setFilteredConnectionData(filteredData);
                    // console.log("Filtering complete.", filteredData);
                } catch (err) {
                     console.error("Filtering failed:", err); setError("Failed to filter connections."); setFilteredConnectionData(null);
                } finally { setIsFiltering(false); }
            });
        } else { setFilteredConnectionData(null); }
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]); // Keep viewMode if dataService uses it

    useEffect(() => {
        filterAndSetConnections();
    }, [filterAndSetConnections]);

    // --- Resize Effect ---
    useEffect(() => {
        const handleResize = () => {
             const isLargeScreen = window.innerWidth >= 1024;
             const infoPanelWidth = isLargeScreen ? 320 : 0; // Adjust width as needed
             const gap = isLargeScreen ? 16 : 0;
             const padding = 32;
             // Calculate width available for the SVG container
             const availableVizWidth = window.innerWidth - infoPanelWidth - gap - padding;
             // Arc diagrams often need width, height can be less critical
             const calculatedWidth = Math.max(400, availableVizWidth * 0.98); // Use most of the available width
             const calculatedHeight = Math.max(300, window.innerHeight * 0.5); // Adjust height as needed
            setDimensions({ width: calculatedWidth, height: calculatedHeight });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Event Handlers ---
    // ... (Handlers: handleBookChange, handleChapterChange, handleToggleView, handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd remain the same) ...
     const handleBookChange = (bookName) => {
        setSelectedBook(bookName); setSelectedChapter(null);
        setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []);
    };
    const handleChapterChange = (chapterNum) => { setSelectedChapter(chapterNum); };
    const handleToggleView = () => { setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter')); };
    const handleNodeSelect = (nodeId) => { console.log("Node selected:", nodeId); setSelectedNodeId(nodeId); setHoveredNodeId(null); };
    const handleNodeHoverStart = (nodeId) => { setHoveredNodeId(nodeId); };
    const handleNodeHoverEnd = () => { setHoveredNodeId(null); };


    // --- Render Logic ---
    if (isLoadingData && !error) { return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>; }
    if (error) { return <div className="flex justify-center items-center min-h-screen text-red-500 p-4 text-center">Error: {error}</div>; }

    return (
        // Adjusted overall layout padding and max-width slightly
        <main className="flex flex-col items-center h-screen max-h-screen p-3 md:p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header Area */}
            <div className="flex-shrink-0 w-full max-w-screen-xl px-2"> {/* Wider */}
                 <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                    Internal Bible Connection Simulator (MVP v4.0 - Arc)
                </h1>
                <div className="flex flex-wrap gap-2 md:gap-4 mb-3 items-center justify-center">
                    <ReferenceSelector /* props */
                        bookList={bookList} chapterList={chapterList} selectedBook={selectedBook} selectedChapter={selectedChapter}
                        onBookChange={handleBookChange} onChapterChange={handleChapterChange} isDisabled={isLoadingData || isFiltering}
                    />
                    <ViewToggle /* props - Still controls filtering mode in dataService */
                        currentView={viewMode} onToggle={handleToggleView} disabled={!selectedChapter || isFiltering || isLoadingData}
                    />
                </div>
            </div>

            {/* Main Content Area */}
             {/* Adjusted max-width, gap */}
             <div className="flex flex-col lg:flex-row w-full max-w-screen-xl gap-3 flex-grow min-h-0 px-2">
                {/* Visualization Area */}
                 {/* Adjusted width distribution */}
                <div className="w-full lg:w-[calc(100%-340px)] h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1">
                     {isFiltering && ( /* Filtering Loader */
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-20">
                            <span className="text-white font-semibold text-lg animate-pulse">Loading Connections...</span>
                        </div>
                     )}
                     {/* Render ArcDiagramContainer instead */}
                    <ArcDiagramContainer
                        data={filteredConnectionData}
                        isLoading={isFiltering || !selectedChapter}
                        width={dimensions.width}
                        height={dimensions.height}
                        onNodeSelect={handleNodeSelect}
                        onNodeHoverStart={handleNodeHoverStart} // Pass hover handlers
                        onNodeHoverEnd={handleNodeHoverEnd}
                    />
                </div>

                {/* Info Panels Area (Side Column) */}
                {/* Fixed width for side panel on larger screens */}
                <div className="w-full lg:w-[340px] lg:max-w-[340px] flex-shrink-0 h-full flex flex-col gap-3 lg:max-h-full">
                     <div className="flex-shrink-0"> {/* Metadata panel */}
                        <MetadataPanel selectedNodeId={selectedNodeId} hoveredNodeId={hoveredNodeId} />
                     </div>
                     {/* Allow Text and Ref List panels to share remaining space */}
                     <div className="flex-1 min-h-[150px]"> {/* Text panel */}
                        <TextDisplayPanel selectedNodeId={selectedNodeId} hoveredNodeId={hoveredNodeId} bibleData={bibleData} isLoadingBibleData={isLoadingData} />
                     </div>
                     <div className="flex-1 min-h-[150px]"> {/* Reference list panel */}
                        <ReferenceListPanel selectedNodeId={selectedNodeId} connectionData={filteredConnectionData} isLoadingConnections={isFiltering} />
                     </div>
                </div>
            </div>

            {/* Footer Area */}
            <footer className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 py-1">
                MVP v4.0 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}