// app/page.js (MRP v1.4 - Pass viewMode to ArcDiagramContainer)
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
import AboutModal from '@/components/AboutModal'; // Import the modal

export default function MainPage() {
    // --- Hooks ---
    const { bibleData, allReferencesData, bookList, isLoadingData: isLoadingCoreData, error: dataError } = useBibleData();
    const { dimensions } = useResponsiveDimensions();
    const {
        selectedBook, selectedChapter, selectedVerse, viewMode, chapterList, verseList,
        filteredConnectionData, selectedNodeId,
        isLoadingConnections, filterError,
        handleBookChange, handleChapterChange, handleVerseChange, handleToggleView,
        handleNodeSelect
    } = useVisualizationState(bibleData, allReferencesData);

    // --- Local State ---
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [resetZoomKey, setResetZoomKey] = useState(0);

    // --- Callbacks ---
    const triggerZoomReset = useCallback(() => { setResetZoomKey(k => k + 1); }, []);
    const openAboutModal = useCallback(() => { setIsAboutModalOpen(true); }, []);
    const closeAboutModal = useCallback(() => { setIsAboutModalOpen(false); }, []);

    // --- Derived State ---
    const isProcessing = isLoadingCoreData || isLoadingConnections;

    // --- Render Logic ---
    if (isLoadingCoreData && !dataError) {
        return <div className="flex justify-center items-center min-h-screen p-4 text-center text-lg text-gray-600 dark:text-gray-400">Loading Bible Data...</div>;
    }
    if (dataError) {
        return <div className="flex flex-col justify-center items-center min-h-screen p-4 text-center text-red-600 dark:text-red-400"><h1 className="text-xl font-semibold mb-2">Error Loading Data</h1><p className="text-sm">{dataError}</p><p className="mt-4 text-xs">Please try refreshing the page.</p></div>;
    }

    return (
        // Using a React Fragment to wrap main and modal
        <>
            <main className="flex flex-col h-screen max-h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {/* Header Area */}
                <header id="main-header" className="flex-shrink-0 w-full p-2 md:p-3 shadow-md bg-white dark:bg-gray-800 z-20">
                    <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                         {/* Multi-line Title */}
                         <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center sm:text-left">
                            <div>Bible</div>
                            <div>Connections</div>
                            <div>Explorer</div>
                         </h1>
                        <div id="controls-area" className="flex flex-wrap gap-2 items-center justify-center sm:justify-end">
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
                             <button
                                onClick={openAboutModal}
                                className="px-3 py-1 border rounded text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                title="About this application"
                             >
                                About
                             </button>
                        </div>
                    </div>
                    {/* Display Filtering Errors Below Controls */}
                    {filterError && (
                         <div className="max-w-screen-xl mx-auto text-center text-red-500 dark:text-red-400 text-xs pt-1">{filterError}</div>
                     )}
                </header>

                {/* Main Content Area */}
                 <div className="flex flex-col lg:flex-row w-full max-w-screen-xl mx-auto gap-3 flex-grow min-h-0 p-2 md:p-3">
                    {/* Visualization Area */}
                     <div className="w-full lg:flex-1 h-[60vh] lg:h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1 viz-container">
                         {isLoadingConnections && (
                            <div className="absolute inset-0 bg-gray-500 bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-60 flex justify-center items-center z-10 rounded-lg"><span className="text-white dark:text-gray-200 font-semibold text-lg animate-pulse p-4 bg-gray-700 dark:bg-gray-600 rounded shadow-xl">Loading Connections...</span></div>
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
                                viewMode={viewMode} // <-- Pass viewMode PROP HERE
                            />
                         ) : ( <div className="text-gray-500 dark:text-gray-400">Calculating size...</div> )}
                    </div>

                    {/* Info Panels Area */}
                     <aside className="w-full lg:w-[340px] lg:max-w-[340px] flex-shrink-0 h-[40vh] lg:h-full flex flex-col gap-3 overflow-hidden">
                         <div className="flex-1 min-h-0">
                             <TextDisplayPanel
                                selectedNodeId={selectedNodeId}
                                bibleData={bibleData}
                                isLoadingBibleData={isLoadingCoreData}
                                viewMode={viewMode} // Pass viewMode prop
                            />
                         </div>
                         <div className="flex-1 min-h-0">
                            <ReferenceListPanel
                                selectedNodeId={selectedNodeId}
                                connectionData={filteredConnectionData}
                                isLoadingConnections={isLoadingConnections}
                            />
                         </div>
                    </aside>
                </div>

                {/* Footer Area */}
                <footer id="main-footer" className="flex-shrink-0 py-1 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    {/* Update version number as needed */}
                    MRP v1.2 | Developed by JSilvaLabs - Global Minister Education
                </footer>
            </main>

             {/* Conditionally render the modal outside the main layout */}
             {isAboutModalOpen && <AboutModal onClose={closeAboutModal} />}
        </>
    );
}