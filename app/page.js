// app/page.js (MVP v6.0 / v7.0 - Refactored, Uses Hooks, Comment Fix)
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
import MetadataPanel from '@/components/MetadataPanel';

export default function MainPage() {
    // --- Consume Custom Hooks ---
    // Hooks MUST be called unconditionally at the top level of the component.
    const { bibleData, allReferencesData, bookList, isLoadingData, error: dataError } = useBibleData();
    const { dimensions } = useResponsiveDimensions();
    const {
        selectedBook, selectedChapter, viewMode, chapterList, filteredConnectionData,
        selectedNodeId, hoveredNodeId, isFiltering,
        handleBookChange, handleChapterChange, handleToggleView, handleNodeSelect,
        handleNodeHoverStart, handleNodeHoverEnd
    } = useVisualizationState(bibleData, allReferencesData); // Pass data dependencies

    // --- Optional State for Zoom Reset ---
    const [resetZoomKey, setResetZoomKey] = useState(0);
    const triggerZoomReset = useCallback(() => {
        setResetZoomKey(prevKey => prevKey + 1);
        console.log("Zoom reset triggered.");
    }, []);
    // --- End Optional State ---


    // --- Render Logic ---

    // Conditional rendering for loading/error states
    if (isLoadingData && !dataError) {
        return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>;
    }
    if (dataError) {
        return <div className="flex justify-center items-center min-h-screen text-red-500 p-4 text-center">Error: {dataError}</div>;
    }

    // Main application structure
    return (
        <main className="flex flex-col items-center h-screen max-h-screen p-3 md:p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header Area */}
            <div id="main-header" className="flex-shrink-0 w-full max-w-screen-xl px-2">
                 <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                    {/* Update title for current version */}
                    Internal Bible Connection Simulator (MVP v7.0)
                </h1>
                {/* Controls Area */}
                <div id="controls-area" className="flex flex-wrap gap-2 md:gap-4 mb-3 items-center justify-center">
                    <ReferenceSelector
                        bookList={bookList}
                        chapterList={chapterList}
                        selectedBook={selectedBook}
                        selectedChapter={selectedChapter}
                        onBookChange={handleBookChange}
                        onChapterChange={handleChapterChange}
                        isDisabled={isLoadingData || isFiltering}
                    />
                    <ViewToggle
                        currentView={viewMode}
                        onToggle={handleToggleView}
                        disabled={!selectedChapter || isFiltering || isLoadingData}
                    />
                    {/* Optional Reset Zoom Button */}
                    <button
                        onClick={triggerZoomReset}
                        className="px-3 py-1 border rounded text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reset diagram zoom and pan"
                        disabled={isFiltering || !filteredConnectionData} // Disable if filtering or no data
                    >
                        Reset Zoom
                    </button>
                </div>
            </div>

            {/* Main Content Area - Apply flex-grow and min-h-0 */}
             <div className="flex flex-col lg:flex-row w-full max-w-screen-xl gap-3 flex-grow min-h-0 px-2 pb-1">
                {/* Visualization Area */}
                <div className="w-full lg:w-[calc(100%-340px)] h-[60%] lg:h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1">
                     {/* Filtering Loader Overlay - Comment moved outside */}
                     {isFiltering && (
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-20">
                            <span className="text-white font-semibold text-lg animate-pulse">Loading...</span>
                        </div>
                     )}
                    <ArcDiagramContainer
                        data={filteredConnectionData}
                        isLoading={isFiltering || !selectedChapter}
                        width={dimensions.width}
                        height={dimensions.height}
                        onNodeSelect={handleNodeSelect}
                        onNodeHoverStart={handleNodeHoverStart}
                        onNodeHoverEnd={handleNodeHoverEnd}
                        // resetZoomTrigger={resetZoomKey} // Pass the key down if implementing reset
                    />
                </div>

                {/* Info Panels Area - Side Column */}
                <div className="w-full lg:w-[340px] lg:max-w-[340px] flex-shrink-0 h-[40%] lg:h-full flex flex-col gap-3 lg:max-h-full overflow-hidden">
                     {/* Metadata Panel */}
                     <div className="flex-shrink-0">
                        <MetadataPanel
                            selectedNodeId={selectedNodeId}
                            hoveredNodeId={hoveredNodeId}
                        />
                     </div>
                     {/* Text Panel */}
                     <div className="flex-1 min-h-0">
                        <TextDisplayPanel
                            selectedNodeId={selectedNodeId}
                            hoveredNodeId={hoveredNodeId}
                            bibleData={bibleData}
                            isLoadingBibleData={isLoadingData}
                        />
                     </div>
                      {/* Reference List Panel */}
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
                {/* Update footer version */}
                MVP v7.0 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}