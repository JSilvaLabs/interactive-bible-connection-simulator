"use client";

import { useState, useEffect, useCallback } from 'react';
import ArcDiagramContainer from '@/components/ArcDiagramContainer';
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
    const [viewMode, setViewMode] = useState('chapter');
    const [filteredConnectionData, setFilteredConnectionData] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [hoveredNodeId, setHoveredNodeId] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 450 }); // Initial dimensions

    // --- Data Loading & Default Selection Effect ---
    useEffect(() => {
        console.log("Initiating data load...");
        setIsLoadingData(true); setError(null); setBookList([]); setChapterList([]); setSelectedBook(null); setSelectedChapter(null);
        try {
            const loadedBibleData = loadBibleText();
            const loadedReferences = loadAllReferences();
            setBibleData(loadedBibleData); setAllReferencesData(loadedReferences);
            const books = getBooks(loadedBibleData); setBookList(books);

            // Set Default Selection
            if (books.length > 0) {
                const defaultBook = books[0]; // Genesis
                const defaultChapters = getChapters(loadedBibleData, defaultBook);
                const defaultChapter = defaultChapters.length > 0 ? defaultChapters[0] : null; // Chapter 1
                if (defaultBook && defaultChapter !== null) {
                    setSelectedBook(defaultBook); setSelectedChapter(defaultChapter); setChapterList(defaultChapters);
                    console.log(`Set default selection: ${defaultBook} ${defaultChapter}`);
                }
            }
            console.log("Data loaded successfully.");
        } catch (err) { console.error("Data loading failed:", err); setError(err.message || "Failed to load core data.");
        } finally { setIsLoadingData(false); }
    }, []);

    // --- Filtering Effect ---
    const filterAndSetConnections = useCallback(() => {
        if (selectedBook && selectedChapter && allReferencesData) {
            setIsFiltering(true); setSelectedNodeId(null); setHoveredNodeId(null);
            requestAnimationFrame(() => {
                 try {
                    const filteredData = getConnectionsFor(allReferencesData, selectedBook, selectedChapter, viewMode);
                    setFilteredConnectionData(filteredData);
                } catch (err) { console.error("Filtering failed:", err); setError("Failed to filter connections."); setFilteredConnectionData(null);
                } finally { setIsFiltering(false); }
            });
        } else { setFilteredConnectionData(null); }
    }, [selectedBook, selectedChapter, viewMode, allReferencesData]);

    useEffect(() => { filterAndSetConnections(); }, [filterAndSetConnections]);

    // --- Resize Effect (MVP v5.1 Responsive Logic) ---
    useEffect(() => {
        const handleResize = () => {
             const windowWidth = window.innerWidth;
             const windowHeight = window.innerHeight;
             const isLargeScreen = windowWidth >= 1024; // lg breakpoint

             // Estimate heights/widths needed for non-diagram areas
             const headerHeight = document.getElementById('main-header')?.offsetHeight || 60; // Get actual height if possible
             const footerHeight = document.getElementById('main-footer')?.offsetHeight || 20;
             const controlsHeight = document.getElementById('controls-area')?.offsetHeight || 50;
             const verticalPadding = 32; // p-4 top/bottom approx
             const horizontalPadding = 24; // px-3 approx
             const gap = 12; // gap-3

             const availableHeight = windowHeight - headerHeight - footerHeight - controlsHeight - verticalPadding - gap;

             let vizWidth, vizHeight;

             if (isLargeScreen) {
                 // Side-by-side layout
                 const infoPanelWidth = 340; // Fixed width for info column
                 const availableVizWidth = windowWidth - infoPanelWidth - gap - horizontalPadding;
                 vizWidth = Math.max(300, availableVizWidth);
                 vizHeight = Math.max(300, availableHeight); // Use full available height
             } else {
                 // Stacked layout (mobile)
                 const availableVizWidth = windowWidth - horizontalPadding;
                 // Allocate roughly 50-60% of available height to viz, rest to panels below
                 // Ensure minimum heights for both sections
                 const minPanelHeight = 300; // Min height for the panels section below
                 vizHeight = Math.max(250, availableHeight - minPanelHeight - gap); // Min height for viz
                 vizWidth = Math.max(300, availableVizWidth);
             }

            // Clamp dimensions if needed
             vizWidth = Math.min(vizWidth, 2000); // Max width example
             vizHeight = Math.min(vizHeight, 1500); // Max height example

            setDimensions({ width: vizWidth, height: vizHeight });
        };

        // Initial calculation + listener
        handleResize();
        // Use timeout to recalculate after initial render might affect header/footer height
        const timer = setTimeout(handleResize, 100);
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
             clearTimeout(timer);
             window.removeEventListener('resize', handleResize);
        }
    }, []); // Empty dependency array, relies on window object

    // --- Event Handlers (No change) ---
    const handleBookChange = (bookName) => { setSelectedBook(bookName); setSelectedChapter(null); setChapterList(bibleData && bookName ? getChapters(bibleData, bookName) : []); };
    const handleChapterChange = (chapterNum) => { setSelectedChapter(chapterNum); };
    const handleToggleView = () => { setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter')); };
    const handleNodeSelect = (nodeId) => { setSelectedNodeId(nodeId); setHoveredNodeId(null); };
    const handleNodeHoverStart = (nodeId) => { setHoveredNodeId(nodeId); };
    const handleNodeHoverEnd = () => { setHoveredNodeId(null); };

    // --- Render Logic ---
    if (isLoadingData && !error) { return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>; }
    if (error) { return <div className="flex justify-center items-center min-h-screen text-red-500 p-4 text-center">Error: {error}</div>; }

    return (
        // Apply fixed height and overflow control to main container
        <main className="flex flex-col items-center h-screen max-h-screen p-3 md:p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header Area */}
            <div id="main-header" className="flex-shrink-0 w-full max-w-screen-xl px-2">
                 <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                    Internal Bible Connection Simulator (MVP v5.1 - Resp.)
                </h1>
                 {/* Added ID for height calculation */}
                <div id="controls-area" className="flex flex-wrap gap-2 md:gap-4 mb-3 items-center justify-center">
                    <ReferenceSelector /* Pass props */ bookList={bookList} chapterList={chapterList} selectedBook={selectedBook} selectedChapter={selectedChapter} onBookChange={handleBookChange} onChapterChange={handleChapterChange} isDisabled={isLoadingData || isFiltering}/>
                    <ViewToggle /* Pass props */ currentView={viewMode} onToggle={handleToggleView} disabled={!selectedChapter || isFiltering || isLoadingData}/>
                </div>
            </div>

            {/* Main Content Area - Apply flex-grow and min-h-0 */}
             <div className="flex flex-col lg:flex-row w-full max-w-screen-xl gap-3 flex-grow min-h-0 px-2 pb-1">
                {/* Visualization Area - Use flex-grow on mobile, define height/width basis on large */}
                <div className="w-full h-[60%] lg:h-full lg:w-[calc(100%-340px)] border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1">
                     {isFiltering && ( /* Filtering Loader */
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-20"><span className="text-white font-semibold text-lg animate-pulse">Loading...</span></div>
                     )}
                    <ArcDiagramContainer /* Pass props */ data={filteredConnectionData} isLoading={isFiltering || !selectedChapter} width={dimensions.width} height={dimensions.height} onNodeSelect={handleNodeSelect} onNodeHoverStart={handleNodeHoverStart} onNodeHoverEnd={handleNodeHoverEnd} />
                </div>

                {/* Info Panels Area - Use flex-grow on mobile, fixed width and allow internal scroll on large */}
                <div className="w-full h-[40%] lg:h-full lg:w-[340px] lg:max-w-[340px] flex-shrink-0 flex flex-col gap-3 lg:max-h-full overflow-hidden">
                     {/* Give panels equal space within this column, allow internal scroll */}
                     <div className="flex-1 min-h-0"> <MetadataPanel selectedNodeId={selectedNodeId} hoveredNodeId={hoveredNodeId} /> </div>
                     <div className="flex-1 min-h-0"> <TextDisplayPanel selectedNodeId={selectedNodeId} hoveredNodeId={hoveredNodeId} bibleData={bibleData} isLoadingBibleData={isLoadingData} /> </div>
                     <div className="flex-1 min-h-0"> <ReferenceListPanel selectedNodeId={selectedNodeId} connectionData={filteredConnectionData} isLoadingConnections={isFiltering} /> </div>
                </div>
            </div>

            {/* Footer Area */}
            <footer id="main-footer" className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 py-1">
                MVP v5.1 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}