// app/page.js (MVP v8.2 - Using Hooks, Corrected JSX)
"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
// Import custom hooks
import { useBibleData } from '@/hooks/useBibleData';
import { useVisualizationState } from '@/hooks/useVisualizationState'; // Uses the hook
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';

// Import UI Components
import ArcDiagramContainer from '@/components/ArcDiagramContainer';
import ViewToggle from '@/components/ViewToggle';
import TextDisplayPanel from '@/components/TextDisplayPanel';
import ReferenceSelector from '@/components/ReferenceSelector';
import ReferenceListPanel from '@/components/ReferenceListPanel';
// MetadataPanel was removed

// Optional Memoized Components (uncomment after profiling if needed)
// const MemoizedArcDiagramContainer = memo(ArcDiagramContainer);
// const MemoizedTextDisplayPanel = memo(TextDisplayPanel);
// const MemoizedReferenceListPanel = memo(ReferenceListPanel);
// const MemoizedReferenceSelector = memo(ReferenceSelector);

export default function MainPage() {
    // --- Consume Custom Hooks ---
    const { bibleData, allReferencesData, bookList, isLoadingData, error: dataError } = useBibleData();
    const { dimensions } = useResponsiveDimensions();
    // All selection/filtering state and handlers come from this hook now
    const {
        selectedBook, selectedChapter, selectedVerse,
        viewMode, chapterList, verseList,
        filteredConnectionData, selectedNodeId, hoveredNodeId, isFiltering, filterError,
        handleBookChange, handleChapterChange, handleVerseChange,
        handleToggleView, handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd
    } = useVisualizationState(bibleData, allReferencesData); // Pass loaded data

    // --- Optional State for Zoom Reset ---
    const [resetZoomKey, setResetZoomKey] = useState(0);
    const triggerZoomReset = useCallback(() => { setResetZoomKey(k => k + 1); }, []);

    // --- Render Logic ---
    if (isLoadingData && !dataError) { return <div className="flex justify-center items-center min-h-screen p-4 text-center">Loading Core Data...</div>; }
    if (dataError) { return <div className="flex justify-center items-center min-h-screen text-red-600 dark:text-red-400 p-4 text-center">Error loading core data: {dataError}</div>; }

    // Determine overall loading state for UI disabling
    const isLoading = isLoadingData || isFiltering;

    return (
        <main className="flex flex-col items-center h-screen max-h-screen p-3 md:p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header Area */}
            <div id="main-header" className="flex-shrink-0 w-full max-w-screen-xl px-2">
                 <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                    Bible Connections
                </h1>
                {/* Controls Area */}
                <div id="controls-area" className="flex flex-wrap gap-2 md:gap-4 mb-3 items-center justify-center">
                    <ReferenceSelector
                        bookList={bookList}
                        chapterList={chapterList}
                        verseList={verseList}
                        selectedBook={selectedBook}
                        selectedChapter={selectedChapter}
                        selectedVerse={selectedVerse}
                        onBookChange={handleBookChange}
                        onChapterChange={handleChapterChange}
                        onVerseChange={handleVerseChange}
                        isDisabled={isLoading} // Use combined loading state
                        viewMode={viewMode}
                    />
                    <ViewToggle
                        currentView={viewMode}
                        onToggle={handleToggleView}
                        disabled={!selectedChapter || isLoading} // Use combined loading state
                    />
                    <button
                        onClick={triggerZoomReset}
                        className="px-3 py-1 border rounded text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reset diagram zoom and pan"
                        disabled={isFiltering || !filteredConnectionData || !filteredConnectionData.nodes || filteredConnectionData.nodes.length === 0}
                    >
                        Reset Zoom
                    </button>
                </div>
                 {/* Display filtering error near controls */}
                 {filterError && (
                    <div className="text-center text-red-500 dark:text-red-400 text-sm mb-2">{filterError}</div>
                 )}
            </div>

            {/* Main Content Area */}
             <div className="flex flex-col lg:flex-row w-full max-w-screen-xl gap-3 flex-grow min-h-0 px-2 pb-1">
                {/* Visualization Area */}
                <div className="w-full lg:w-[calc(100%-340px)] h-[60%] lg:h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1">
                     {/* Filtering Loader Overlay - Placed first to appear on top */}
                     {isFiltering && (
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-20">
                            <span className="text-white font-semibold text-lg animate-pulse">Loading...</span>
                        </div>
                     )}
                     {/* Arc Diagram Container - Rendered independently */}
                    <ArcDiagramContainer // Use ArcDiagramContainer, potentially memoized version
                        data={filteredConnectionData}
                        // Pass the isFiltering state (or !selectedChapter) to indicate loading/placeholder needed
                        isLoading={isFiltering || !selectedChapter}
                        width={dimensions.width}
                        height={dimensions.height}
                        selectedNodeId={selectedNodeId} // Pass selectedNodeId for highlighting
                        onNodeSelect={handleNodeSelect}
                        onNodeHoverStart={handleNodeHoverStart}
                        onNodeHoverEnd={handleNodeHoverEnd}
                        resetZoomTrigger={resetZoomKey}
                    />
                </div> {/* End of Visualization Area div */}

                {/* Info Panels Area */}
                <div className="w-full lg:w-[340px] lg:max-w-[340px] flex-shrink-0 h-[40%] lg:h-full flex flex-col gap-3 lg:max-h-full overflow-hidden">
                     {/* Text Panel */}
                     <div className="flex-1 min-h-0">
                        {/* Use TextDisplayPanel, potentially memoized */}
                        <TextDisplayPanel
                            selectedNodeId={selectedNodeId}
                            hoveredNodeId={hoveredNodeId}
                            bibleData={bibleData}
                            isLoadingBibleData={isLoadingData} // Pass core data loading status
                        />
                     </div>
                      {/* Reference List Panel */}
                     <div className="flex-1 min-h-0">
                         {/* Use ReferenceListPanel, potentially memoized */}
                        <ReferenceListPanel
                             selectedNodeId={selectedNodeId}
                             connectionData={filteredConnectionData}
                             isLoadingConnections={isFiltering} // Pass filtering status
                         />
                     </div>
                </div>
            </div>

            {/* Footer Area */}
            <footer id="main-footer" className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 py-1">
                {/* Update version for footer */}
                MVP v8.2 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}