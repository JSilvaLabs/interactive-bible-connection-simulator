// app/page.js (MVP v8.0 - Fix JSX Structure for Loader)
"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Import React
// Import custom hooks
import { useBibleData } from '@/hooks/useBibleData';
import { useVisualizationState } from '@/hooks/useVisualizationState';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions';

// Import UI Components
import ArcDiagramContainer from '@/components/ArcDiagramContainer';
import ViewToggle from '@/components/ViewToggle';
import TextDisplayPanel from '@/components/TextDisplayPanel';
import ReferenceSelector from '@/components/ReferenceSelector';
import ReferenceListPanel from '@/components/ReferenceListPanel';
// MetadataPanel import is removed

export default function MainPage() {
    // --- Consume Custom Hooks ---
    const { bibleData, allReferencesData, bookList, isLoadingData, error: dataError } = useBibleData();
    const { dimensions } = useResponsiveDimensions();
    const {
        selectedBook, selectedChapter, selectedVerse,
        viewMode, chapterList, verseList,
        filteredConnectionData, selectedNodeId, hoveredNodeId, isFiltering,
        handleBookChange, handleChapterChange, handleVerseChange,
        handleToggleView, handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd
    } = useVisualizationState(bibleData, allReferencesData);

    // --- Optional State for Zoom Reset ---
    const [resetZoomKey, setResetZoomKey] = useState(0);
    const triggerZoomReset = useCallback(() => { setResetZoomKey(k => k + 1); }, []);

    // --- Render Logic ---
    if (isLoadingData && !dataError) { return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>; }
    if (dataError) { return <div className="flex justify-center items-center min-h-screen text-red-500 p-4 text-center">Error: {dataError}</div>; }

    return (
        <main className="flex flex-col items-center h-screen max-h-screen p-3 md:p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header Area */}
            <div id="main-header" className="flex-shrink-0 w-full max-w-screen-xl px-2">
                 <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                    Bible Connections
                </h1>
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
                        isDisabled={isLoadingData || isFiltering}
                        viewMode={viewMode}
                    />
                    <ViewToggle
                        currentView={viewMode}
                        onToggle={handleToggleView}
                        disabled={!selectedChapter || isFiltering || isLoadingData}
                    />
                    <button
                        onClick={triggerZoomReset}
                        className="px-3 py-1 border rounded text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reset diagram zoom and pan"
                        disabled={isFiltering || !filteredConnectionData}
                    >
                        Reset Zoom
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
             <div className="flex flex-col lg:flex-row w-full max-w-screen-xl gap-3 flex-grow min-h-0 px-2 pb-1">
                {/* Visualization Area */}
                <div className="w-full lg:w-[calc(100%-340px)] h-[60%] lg:h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1">
                     {/* Filtering Loader Overlay - Rendered conditionally on top */}
                     {isFiltering && (
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-20">
                            <span className="text-white font-semibold text-lg animate-pulse">Loading...</span>
                        </div>
                     )}
                     {/* Arc Diagram Container - Always rendered */}
                    <ArcDiagramContainer
                        data={filteredConnectionData}
                        // isLoading prop tells container to show its *own* internal placeholder if needed
                        isLoading={isFiltering || !selectedChapter}
                        width={dimensions.width}
                        height={dimensions.height}
                        onNodeSelect={handleNodeSelect}
                        onNodeHoverStart={handleNodeHoverStart}
                        onNodeHoverEnd={handleNodeHoverEnd}
                        // resetZoomTrigger={resetZoomKey} // Pass if reset implemented in ArcDiagram
                    />
                </div> {/* End of Visualization Area div */}

                {/* Info Panels Area - MetadataPanel REMOVED */}
                <div className="w-full lg:w-[340px] lg:max-w-[340px] flex-shrink-0 h-[40%] lg:h-full flex flex-col gap-3 lg:max-h-full overflow-hidden">
                     {/* Text Panel takes up space */}
                     <div className="flex-1 min-h-0">
                        <TextDisplayPanel
                            selectedNodeId={selectedNodeId}
                            hoveredNodeId={hoveredNodeId}
                            bibleData={bibleData}
                            isLoadingBibleData={isLoadingData}
                        />
                     </div>
                      {/* Reference List Panel takes up space */}
                     <div className="flex-1 min-h-0">
                        <ReferenceListPanel
                             selectedNodeId={selectedNodeId}
                             connectionData={filteredConnectionData}
                             isLoadingConnections={isFiltering}
                         />
                     </div>
                </div>
            </div>

            {/* Footer Area */}
            <footer id="main-footer" className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 py-1">
                MVP v8.0 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}