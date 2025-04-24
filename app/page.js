// app/page.js (MVP v9.0 - Corrected JSX Structure AGAIN)
"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
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

// Optional Memoized Components
// const MemoizedArcDiagramContainer = memo(ArcDiagramContainer);
// const MemoizedTextDisplayPanel = memo(TextDisplayPanel);
// const MemoizedReferenceListPanel = memo(ReferenceListPanel);

export default function MainPage() {
    // --- Consume Custom Hooks ---
    const { bibleData, allReferencesData, bookList, isLoadingData, error: dataError } = useBibleData();
    const { dimensions } = useResponsiveDimensions();
    const {
        selectedBook, selectedChapter, selectedVerse,
        viewMode, chapterList, verseList,
        filteredConnectionData, selectedNodeId, hoveredNodeId, isFiltering, filterError,
        handleBookChange, handleChapterChange, handleVerseChange,
        handleToggleView, handleNodeSelect, handleNodeHoverStart, handleNodeHoverEnd
    } = useVisualizationState(bibleData, allReferencesData);

    const [resetZoomKey, setResetZoomKey] = useState(0);
    const triggerZoomReset = useCallback(() => { setResetZoomKey(k => k + 1); }, []);

    // --- Render Logic ---
    if (isLoadingData && !dataError) { return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>; }
    if (dataError) { return <div className="flex justify-center items-center min-h-screen text-red-600 dark:text-red-400 p-4 text-center">Error loading core data: {dataError}</div>; }

    return (
        <main className="flex flex-col items-center h-screen max-h-screen p-3 md:p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header Area */}
            <div id="main-header" className="flex-shrink-0 w-full max-w-screen-xl px-2">
                 <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                    Bible Connections
                </h1>
                <div id="controls-area" className="flex flex-wrap gap-2 md:gap-4 mb-3 items-center justify-center">
                    <ReferenceSelector bookList={bookList} chapterList={chapterList} verseList={verseList} selectedBook={selectedBook} selectedChapter={selectedChapter} selectedVerse={selectedVerse} onBookChange={handleBookChange} onChapterChange={handleChapterChange} onVerseChange={handleVerseChange} isDisabled={isLoadingData || isFiltering} viewMode={viewMode}/>
                    <ViewToggle currentView={viewMode} onToggle={handleToggleView} disabled={!selectedChapter || isFiltering || isLoadingData} />
                    <button onClick={triggerZoomReset} /* ... Reset Button ... */ > Reset Zoom </button>
                </div>
                 {filterError && ( <div className="text-center text-red-500 dark:text-red-400 text-sm mb-2">{filterError}</div> )}
            </div>

            {/* Main Content Area */}
             <div className="flex flex-col lg:flex-row w-full max-w-screen-xl gap-3 flex-grow min-h-0 px-2 pb-1">
                {/* Visualization Area */}
                 {/* CORRECTED STRUCTURE: Loader and Container are SIBLINGS */}
                <div className="w-full lg:w-[calc(100%-340px)] h-[60%] lg:h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1">
                     {/* Filtering Loader Overlay - Placed first to appear on top */}
                     {isFiltering && (
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-20">
                            <span className="text-white font-semibold text-lg animate-pulse">Loading...</span>
                        </div>
                     )}
                     {/* Arc Diagram Container - Rendered independently */}
                    <ArcDiagramContainer // Or MemoizedArcDiagramContainer
                        data={filteredConnectionData}
                        isLoading={isFiltering || !selectedChapter} // Pass combined loading state
                        width={dimensions.width}
                        height={dimensions.height}
                        selectedNodeId={selectedNodeId}
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
                         {/* Use MemoizedTextDisplayPanel if memoizing */}
                        <TextDisplayPanel selectedNodeId={selectedNodeId} hoveredNodeId={hoveredNodeId} bibleData={bibleData} isLoadingBibleData={isLoadingData} />
                     </div>
                      {/* Reference List Panel */}
                     <div className="flex-1 min-h-0">
                         {/* Use MemoizedReferenceListPanel if memoizing */}
                        <ReferenceListPanel selectedNodeId={selectedNodeId} connectionData={filteredConnectionData} isLoadingConnections={isFiltering} />
                     </div>
                </div>
            </div>

            {/* Footer Area */}
            <footer id="main-footer" className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 py-1">
                MVP v9.0 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}