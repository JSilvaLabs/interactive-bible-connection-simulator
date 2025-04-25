// app/page.js (MRP v1.5 - Refine Panel Heights for Scrolling)
"use client";

import React, { useState, useCallback, memo } from 'react';
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
import AboutModal from '@/components/AboutModal';

export default function MainPage() {
    // --- Hooks, State, Callbacks ---
    const { bibleData, allReferencesData, bookList, isLoadingData: isLoadingCoreData, error: dataError } = useBibleData();
    const { dimensions } = useResponsiveDimensions();
    const {
        selectedBook, selectedChapter, selectedVerse, viewMode, chapterList, verseList,
        filteredConnectionData, selectedNodeId, isLoadingConnections, filterError,
        handleBookChange, handleChapterChange, handleVerseChange, handleToggleView, handleNodeSelect
     } = useVisualizationState(bibleData, allReferencesData);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [resetZoomKey, setResetZoomKey] = useState(0);
    const triggerZoomReset = useCallback(() => { setResetZoomKey(k => k + 1); }, []);
    const openAboutModal = useCallback(() => { setIsAboutModalOpen(true); }, []);
    const closeAboutModal = useCallback(() => { setIsAboutModalOpen(false); }, []);
    const isProcessing = isLoadingCoreData || isLoadingConnections;


    // --- Render Logic (Loading/Error states remain the same) ---
    if (isLoadingCoreData && !dataError) {
         return <div className="flex justify-center items-center min-h-screen p-4 text-center text-lg text-gray-600 dark:text-gray-400">Loading Bible Data...</div>;
     }
    if (dataError) {
         return <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center text-red-600 dark:text-red-400"><h1 className="text-xl font-semibold mb-2">Error Loading Data</h1><p className="text-sm">{dataError}</p><p className="mt-4 text-xs">Please try refreshing the page.</p></div>;
    }

    return (
        <>
            {/* Allow scrolling on main element */}
            <main className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {/* Header Area */}
                <header id="main-header" className="flex-shrink-0 w-full p-2 md:p-3 shadow-md bg-white dark:bg-gray-800 z-20 sticky top-0">
                    <div className="max-w-screen-xl mx-auto flex flex-col gap-2">
                        {/* Top Row: Title */}
                        <div className="flex justify-between items-center w-full">
                             <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
                                Bible Connections
                             </h1>
                        </div>
                        {/* Control Rows Area */}
                        <div id="controls-area" className="w-full flex flex-col sm:flex-row sm:flex-wrap gap-2 items-center justify-center sm:justify-start">
                             {/* Row 1 (Mobile) / Part 1 (Desktop): Selectors */}
                             <div className="w-full sm:w-auto flex flex-wrap gap-2 justify-center sm:justify-start">
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
                                    isDisabled={isProcessing}
                                    viewMode={viewMode}
                                />
                             </div>
                             {/* Row 2 (Mobile) / Part 2 (Desktop): Buttons */}
                             <div className="w-full sm:w-auto flex flex-wrap gap-2 justify-center sm:justify-start">
                                <ViewToggle
                                    currentView={viewMode}
                                    onToggle={handleToggleView}
                                    disabled={!selectedChapter || isProcessing}
                                />
                                <button
                                    onClick={triggerZoomReset}
                                    className="px-3 py-1 border rounded text-xs bg-gray-200 dark:bg-gray-600 hover:enabled:bg-gray-300 dark:hover:enabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Reset diagram zoom and pan"
                                    disabled={isProcessing || !filteredConnectionData?.nodes?.length}
                                    aria-disabled={isProcessing || !filteredConnectionData?.nodes?.length}
                                >
                                    Reset View
                                </button>
                             </div>
                        </div>
                    </div>
                    {/* Error display */}
                    {filterError && (
                        <div className="max-w-screen-xl mx-auto text-center text-red-500 dark:text-red-400 text-xs pt-1">{filterError}</div>
                     )}
                </header>

                {/* Main Content Area - Flex-grow allows footer to be pushed down */}
                 {/* Use default block layout for mobile stacking, lg:flex-row for desktop */}
                 <div className="w-full max-w-screen-xl mx-auto flex-grow flex flex-col lg:flex-row gap-3 p-2 md:p-3">
                    {/* Visualization Area */}
                     {/* Define height for mobile, allow flex basis for desktop */}
                     <div className="w-full h-[60vh] lg:h-auto lg:flex-1 border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1 viz-container">
                         {isLoadingConnections && (
                            <div className="absolute inset-0 bg-gray-500 bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-60 flex justify-center items-center z-10 rounded-lg"><span className="text-white dark:text-gray-200 font-semibold text-lg animate-pulse p-4 bg-gray-700 dark:bg-gray-600 rounded shadow-xl">Loading...</span></div>
                         )}
                         {dimensions.width > 0 && dimensions.height > 0 ? (
                             <ArcDiagramContainer
                                data={filteredConnectionData}
                                isLoading={isLoadingCoreData || isLoadingConnections || !selectedChapter}
                                width={dimensions.width}
                                height={dimensions.height}
                                selectedNodeId={selectedNodeId}
                                onNodeSelect={handleNodeSelect}
                                resetZoomTrigger={resetZoomKey}
                                viewMode={viewMode}
                            />
                         ) : ( <div className="text-gray-500 dark:text-gray-400">Calculating size...</div> )}
                    </div>

                    {/* Info Panels Area */}
                     {/* Define fixed width only for desktop, stack below on mobile */}
                     {/* Reduced gap for mobile, keep larger gap for lg screens */}
                     <aside className="w-full lg:w-[340px] lg:max-w-[340px] flex-shrink-0 flex flex-col gap-2 lg:gap-3">
                         {/* Removed min-h, rely on internal panel scrolling & flex */}
                         <div className="lg:flex-1">
                             <TextDisplayPanel
                                selectedNodeId={selectedNodeId}
                                bibleData={bibleData}
                                isLoadingBibleData={isLoadingCoreData}
                                viewMode={viewMode}
                            />
                         </div>
                         <div className="lg:flex-1">
                            <ReferenceListPanel
                                selectedNodeId={selectedNodeId}
                                connectionData={filteredConnectionData}
                                isLoadingConnections={isLoadingConnections}
                                onNodeSelect={handleNodeSelect} // Pass handler
                            />
                         </div>
                    </aside>
                </div>

                {/* Footer Area */}
                <footer id="main-footer" className="flex-shrink-0 w-full mt-auto py-2 px-3 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 z-10">
                    {/* Moved About button here */}
                    <button onClick={openAboutModal} className="text-blue-600 dark:text-blue-400 hover:underline mx-2">About</button> |
                    <span className="mx-2">MRP v1.4 | Developed by JSilvaLabs - Global Minister Education</span>
                </footer>
            </main>

             {/* Modal */}
             {isAboutModalOpen && <AboutModal onClose={closeAboutModal} />}
        </>
    );
}