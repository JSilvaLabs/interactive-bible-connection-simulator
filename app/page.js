// app/page.js (MVP v6.0 - Refactored using Hooks)
"use client";

import React from 'react'; // Import React for JSX
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
    const { dimensions } = useResponsiveDimensions(); // Hook for responsive sizing
    const {
        selectedBook,
        selectedChapter,
        viewMode,
        chapterList,
        filteredConnectionData,
        selectedNodeId,
        hoveredNodeId,
        isFiltering,
        handleBookChange,
        handleChapterChange,
        handleToggleView,
        handleNodeSelect,
        handleNodeHoverStart,
        handleNodeHoverEnd
    } = useVisualizationState(bibleData, allReferencesData); // Pass loaded data to the state hook

    // --- Render Logic ---

    // Conditional rendering based on hook results is FINE here
    if (isLoadingData && !dataError) {
        return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>;
    }

    // Display error if data loading failed
    if (dataError) {
        return <div className="flex justify-center items-center min-h-screen text-red-500 p-4 text-center">Error: {dataError}</div>;
    }

    // Main application structure
    return (
        <main className="flex flex-col items-center h-screen max-h-screen p-3 md:p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 overflow-hidden">
            {/* Header Area */}
            <div id="main-header" className="flex-shrink-0 w-full max-w-screen-xl px-2">
                 <h1 className="text-xl sm:text-2xl font-bold mb-2 text-center">
                    Internal Bible Connection Simulator (MVP v6.0 - Refactored)
                </h1>
                {/* Controls Area */}
                <div id="controls-area" className="flex flex-wrap gap-2 md:gap-4 mb-3 items-center justify-center">
                    <ReferenceSelector
                        bookList={bookList} // From useBibleData
                        chapterList={chapterList} // From useVisualizationState
                        selectedBook={selectedBook} // From useVisualizationState
                        selectedChapter={selectedChapter} // From useVisualizationState
                        onBookChange={handleBookChange} // From useVisualizationState
                        onChapterChange={handleChapterChange} // From useVisualizationState
                        isDisabled={isLoadingData || isFiltering} // Use loading states
                    />
                    <ViewToggle
                        currentView={viewMode} // From useVisualizationState
                        onToggle={handleToggleView} // From useVisualizationState
                        disabled={!selectedChapter || isFiltering || isLoadingData} // Use state from hooks
                    />
                </div>
            </div>

            {/* Main Content Area - Responsive Layout */}
             <div className="flex flex-col lg:flex-row w-full max-w-screen-xl gap-3 flex-grow min-h-0 px-2 pb-1">
                {/* Visualization Area */}
                <div className="w-full lg:w-[calc(100%-340px)] h-[60%] lg:h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1">
                     {/* Filtering Loader Overlay */}
                     {isFiltering && (
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-20"><span className="text-white font-semibold text-lg animate-pulse">Loading...</span></div>
                     )}
                     {/* Arc Diagram Container */}
                    <ArcDiagramContainer
                        data={filteredConnectionData} // From useVisualizationState
                        isLoading={isFiltering || !selectedChapter} // Derived loading state
                        width={dimensions.width} // From useResponsiveDimensions
                        height={dimensions.height} // From useResponsiveDimensions
                        onNodeSelect={handleNodeSelect} // From useVisualizationState
                        onNodeHoverStart={handleNodeHoverStart} // From useVisualizationState
                        onNodeHoverEnd={handleNodeHoverEnd} // From useVisualizationState
                    />
                </div>

                {/* Info Panels Area - Side Column */}
                <div className="w-full lg:w-[340px] lg:max-w-[340px] flex-shrink-0 h-[40%] lg:h-full flex flex-col gap-3 lg:max-h-full overflow-hidden">
                    {/* Metadata Panel */}
                     <div className="flex-shrink-0">
                        <MetadataPanel
                            selectedNodeId={selectedNodeId} // From useVisualizationState
                            hoveredNodeId={hoveredNodeId}   // From useVisualizationState
                        />
                     </div>
                     {/* Text Panel */}
                     <div className="flex-1 min-h-0">
                        <TextDisplayPanel
                            selectedNodeId={selectedNodeId} // From useVisualizationState
                            hoveredNodeId={hoveredNodeId}   // From useVisualizationState
                            bibleData={bibleData}           // From useBibleData
                            isLoadingBibleData={isLoadingData} // From useBibleData
                        />
                     </div>
                      {/* Reference List Panel */}
                     <div className="flex-1 min-h-0">
                        <ReferenceListPanel
                             selectedNodeId={selectedNodeId} // From useVisualizationState
                             connectionData={filteredConnectionData} // From useVisualizationState
                             isLoadingConnections={isFiltering} // From useVisualizationState
                         />
                     </div>
                </div>
            </div>

            {/* Footer Area */}
            <footer id="main-footer" className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 py-1">
                MVP v6.0 | Developed by JSilvaLabs - Global Minister Education
            </footer>
        </main>
    );
}