// app/page.js (MRP v1.13 - Simplify Viz Container Height)
"use client";

import React, { useState, useCallback, memo } from 'react';
// Import custom hooks
import { useBibleData } from '@/hooks/useBibleData';
import { useVisualizationState } from '@/hooks/useVisualizationState';
import { useResponsiveDimensions } from '@/hooks/useResponsiveDimensions'; // Use updated hook
import PptxGenJS from 'pptxgenjs';

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
    const { dimensions } = useResponsiveDimensions(); // Use updated hook
    const {
        selectedBook, selectedChapter, selectedVerse, viewMode, chapterList, verseList,
        filteredConnectionData, selectedNodeId, isLoadingConnections, filterError,
        handleBookChange, handleChapterChange, handleVerseChange, handleToggleView, handleNodeSelect
     } = useVisualizationState(bibleData, allReferencesData);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [resetZoomKey, setResetZoomKey] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const triggerZoomReset = useCallback(() => { setResetZoomKey(k => k + 1); }, []);
    const openAboutModal = useCallback(() => { setIsAboutModalOpen(true); }, []);
    const closeAboutModal = useCallback(() => { setIsAboutModalOpen(false); }, []);
    const isProcessing = isLoadingCoreData || isLoadingConnections;

    const exportToPowerPoint = useCallback(async () => {
        if (!filteredConnectionData || !bibleData) return;
        
        setIsExporting(true);
        try {
            const pptx = new PptxGenJS();
            
            // Slide 1: Title
            const titleSlide = pptx.addSlide();
            titleSlide.addText('Bible Connections Visualization', {
                x: 1,
                y: 1,
                w: '90%',
                h: 1,
                fontSize: 44,
                align: 'center',
                color: '363636'
            });

            // Slide 2: Selection Details
            const selectionSlide = pptx.addSlide();
            selectionSlide.addText('Selected Reference', {
                x: 0.5,
                y: 0.5,
                w: '90%',
                fontSize: 32,
                color: '363636'
            });
            
            const detailsText = [
                `Book: ${selectedBook}`,
                `Chapter: ${selectedChapter}`,
                selectedVerse ? `Verse: ${selectedVerse}` : ''
            ].filter(Boolean).join('\n');

            selectionSlide.addText(detailsText, {
                x: 0.5,
                y: 1.5,
                w: '90%',
                fontSize: 24,
                color: '666666'
            });

            // Slide 3: Visualization
            const vizSlide = pptx.addSlide();
            vizSlide.addText('Connection Visualization', {
                x: 0.5,
                y: 0.5,
                w: '90%',
                fontSize: 32,
                color: '363636'
            });

            // Get the SVG element
            const svgElement = document.querySelector('.viz-container svg');
            if (svgElement) {
                const svgData = new XMLSerializer().serializeToString(svgElement);
                const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
                vizSlide.addImage({
                    data: `data:image/svg+xml;base64,${svgBase64}`,
                    x: 0.5,
                    y: 1.5,
                    w: '90%',
                    h: '70%'
                });
            }

            // Generate and download the presentation
            const fileName = `Bible_Connections_${selectedBook}_${selectedChapter}${selectedVerse ? `_${selectedVerse}` : ''}_${new Date().toISOString().split('T')[0]}.pptx`;
            await pptx.writeFile({ fileName });
        } catch (error) {
            console.error('Error generating PowerPoint:', error);
            alert('Error generating PowerPoint file. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }, [filteredConnectionData, bibleData, selectedBook, selectedChapter, selectedVerse]);

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
                        <div id="controls-area" className="w-full flex flex-wrap gap-y-2 gap-x-4 items-center justify-center sm:justify-start">
                             {/* Group 1: Selectors */}
                             <div className="flex-shrink-0">
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
                             {/* Group 2: Buttons */}
                             <div className="flex flex-wrap gap-2 justify-center sm:justify-start flex-shrink-0">
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
                                    onClick={exportToPowerPoint}
                                    className="px-3 py-1 border rounded text-xs bg-blue-500 text-white hover:enabled:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Export to PowerPoint"
                                    disabled={isProcessing || !filteredConnectionData?.nodes?.length || isExporting}
                                    aria-disabled={isProcessing || !filteredConnectionData?.nodes?.length || isExporting}
                                >
                                    {isExporting ? 'Exporting...' : 'Export PPT'}
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
                     {/* Removed h-[60vh], rely on lg:flex-1 */}
                     <div className="w-full lg:flex-1 border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1 viz-container">
                         {isLoadingConnections && (
                            <div className="absolute inset-0 bg-gray-500 bg-opacity-50 dark:bg-gray-800 dark:bg-opacity-60 flex justify-center items-center z-10 rounded-lg"><span className="text-white dark:text-gray-200 font-semibold text-lg animate-pulse p-4 bg-gray-700 dark:bg-gray-600 rounded shadow-xl">Loading...</span></div>
                         )}
                         {/* Pass dimensions from hook. Container height now set by flexbox */}
                         {dimensions.width > 0 && dimensions.height > 0 ? (
                             <ArcDiagramContainer
                                data={filteredConnectionData}
                                isLoading={isLoadingCoreData || isLoadingConnections || !selectedChapter}
                                width={dimensions.width} // Calculated width
                                height={dimensions.height} // Revised height calculation from hook
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
                         {/* Let flex determine height on desktop, panels scroll internally */}
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
                    <span className="mx-2">MRP v1.13 | Developed by JSilvaLabs - Global Minister Education</span> {/* Updated version */}
                </footer>
            </main>

             {/* Modal */}
             {isAboutModalOpen && <AboutModal onClose={closeAboutModal} />}
        </>
    );
}