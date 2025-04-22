"use client";

import { useState, useEffect, useCallback } from 'react';
import VisualizationContainer from '@/components/VisualizationContainer';
import ViewToggle from '@/components/ViewToggle';
import TextDisplayPanel from '@/components/TextDisplayPanel';
import ReferenceSelector from '@/components/ReferenceSelector';
import ReferenceListPanel from '@/components/ReferenceListPanel';
import MetadataPanel from '@/components/MetadataPanel'; // Import new panel
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
    const [viewMode, setViewMode] = useState('chapter'); // 'chapter' or 'verse'

    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null); // Clicked node
    const [hoveredNodeId, setHoveredNodeId] = useState(null); // Hovered node

    const [dimensions, setDimensions] = useState({ width: 600, height: 600 });

    // --- Data Loading Effect ---
    useEffect(() => {
        console.log("Initiating data load...");
        setIsLoadingData(true);
        setError(null);
        setBookList([]);
        setChapterList([]);
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
    }, []);

    // --- Filtering Effect ---
    const filterAndSetConnections = useCallback(() => {
        if (selectedBook && selectedChapter && allReferencesData) {
            console.log(`Filtering for: ${selectedBook} ${selectedChapter}, Mode: ${viewMode}`);
            setIsFiltering(true);
            setSelectedNodeId(null);
            setHoveredNodeId(null); // Clear hover on filter change
            // Use requestAnimationFrame or setTimeout for smoother UI update
            requestAnimationFrame(() => {
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
            });
        } else {
            setFilteredConnectionData(null); // Clear diagram
        }
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]);

    useEffect(() => {
        filterAndSetConnections();
    }, [filterAndSetConnections]);

    // --- Resize Effect ---
    useEffect(() => {
        const handleResize = () => {
             const isLargeScreen = window.innerWidth >= 1024;
             const infoPanelWidth = isLargeScreen ? 320 : 0; // Approx width for right column
             const gap = isLargeScreen ? 16 : 0;
             const padding = 32;
             const availableVizWidth = window.innerWidth - infoPanelWidth - gap - padding;
             const size = Math.max(300, Math.min(availableVizWidth * 0.95, window.innerHeight * 0.6)); // Adjust constraints
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
    };

    const handleChapterChange = (chapterNum) => {
        setSelectedChapter(chapterNum);
    };

    const handleToggleView = () => {
        setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter'));
    };

    const handleNodeSelect = (nodeId) => {
        console.log("Node selected:", nodeId);
        setSelectedNodeId(nodeId);
        setHoveredNodeId(null); // Clear hover when clicking
    };

    const handleNodeHoverStart = (nodeId) => {
        // console.log("Node hover start:", nodeId); // Can be noisy
        setHoveredNodeId(nodeId);
    };

    const handleNodeHoverEnd = () => {
        // console.log("Node hover end");
        setHoveredNodeId(null);
    };

    // --- Render Logic ---
    if (isLoadingData && !error) {
        return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>;
    }
    if (error) {
        return <div className="flex justify-center items-center min-h-screen text-red-500 p-4 text-center">Error: {error}</div>;
    }

    return (
        <main className="flex flex-col items-center h-screen max-h-screen p-4 md:p-6 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header Area */}
            <div className="flex-shrink-0 w-full max-w-7xl px-4"> {/* Wider max-width */}
                 <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-center">
                    Internal Bible Connection Simulator (MVP v3.0)
                </h1>
                <div className="flex flex-wrap gap-4 mb-4 items-center justify-center">
                    <ReferenceSelector
                        bookList={bookList}
                        chapterList={chapterList}
                        selectedBook={selectedBook}
                        selectedChapter={selectedChapter}
                        onBookChange={handleBookChange}
                        onChapterChange={handleChapterChange}
                        isDisabled={isLoadingData || isFiltering} // Disable during initial load OR filtering
                    />
                    <ViewToggle
                        currentView={viewMode}
                        onToggle={handleToggleView}
                        disabled={!selectedChapter || isFiltering || isLoadingData} // Disable if no chapter, filtering, or initial load
                    />
                </div>
            </div>

            {/* Main Content Area */}
             <div className="flex flex-col lg:flex-row w-full max-w-7xl gap-4 flex-grow min-h-0 px-4"> {/* Wider max-width */}
                {/* Visualization Area */}
                <div className="w-full lg:w-2/3 xl:w-3/4 h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-2">
                     {isFiltering && ( /* Filtering Loader Overlay */
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-20">
                            <span className="text-white font-semibold text-lg animate-pulse">Loading Connections...</span>
                        </div>
                     )}
                    <VisualizationContainer
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
                <div className="w-full lg:w-1/3 xl:w-1/4 h-full flex flex-col gap-4 lg:max-h-full"> {/* Allow scrolling within this column */}
                     <div className="flex-shrink-0"> {/* Metadata panel doesn't need to grow */}
                        <MetadataPanel
                             selectedNodeId={selectedNodeId}
                             hoveredNodeId={hoveredNodeId}
                         />
                     </div>
                     <div className="flex-1 min-h-[150px]"> {/* Text panel can grow */}
                        <TextDisplayPanel
                            selectedNodeId={selectedNodeId}
                            hoveredNodeId={hoveredNodeId} // Pass hover ID (panel decides how to use it)
                            bibleData={bibleData}
                            isLoadingBibleData={isLoadingData}
                        />
                     </div>
                     <div className="flex-1 min-h-[150px]"> {/* Reference list panel can grow */}
                        <ReferenceListPanel
                             selectedNodeId={selectedNodeId} // Only show list for selected node
                             connectionData={filteredConnectionData}
                             isLoadingConnections={isFiltering}
                         />
                     </div>
                </div>
            </div>

            {/* Footer Area */}
            <footer className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 py-2">
                MVP v3.0 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}