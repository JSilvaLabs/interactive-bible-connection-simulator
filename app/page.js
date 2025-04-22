// app/page.js (Refactored for MVP v6.0 - Uses Custom Hooks)
"use client";

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
    // Hook for loading primary data
    const { bibleData, allReferencesData, bookList, isLoadingData, error: dataError } = useBibleData();

    // Hook for managing selections, filtering, and interactions
    // Pass loaded data as dependencies for filtering logic within the hook
    const {
        selectedBook, selectedChapter, viewMode, chapterList, filteredConnectionData,
        selectedNodeId, hoveredNodeId, isFiltering,
        handleBookChange, handleChapterChange, handleToggleView, handleNodeSelect,
        handleNodeHoverStart, handleNodeHoverEnd
    } = useVisualizationState(bibleData, allReferencesData); // Pass data here

    // Hook for responsive dimensions
    const { dimensions } = useResponsiveDimensions();

    // --- Render Logic ---

    // Handle loading state from the data hook
    if (isLoadingData && !dataError) {
        return <div className="flex justify-center items-center min-h-screen">Loading Core Data...</div>;
    }

    // Handle error state from the data hook
    // TODO: Could add error state from useVisualizationState as well
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
                <div id="controls-area" className="flex flex-wrap gap-2 md:gap-4 mb-3 items-center justify-center">
                    {/* Use state and handlers directly from the hook */}
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
                </div>
            </div>

            {/* Main Content Area - Layout driven by Tailwind classes */}
             <div className="flex flex-col lg:flex-row w-full max-w-screen-xl gap-3 flex-grow min-h-0 px-2 pb-1">
                {/* Visualization Area */}
                <div className="w-full lg:w-[calc(100%-340px)] h-[60%] lg:h-full border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg flex justify-center items-center bg-white dark:bg-gray-900 relative overflow-hidden p-1">
                     {isFiltering && ( /* Filtering Loader - Uses state from hook */
                        <div className="absolute inset-0 bg-gray-600 bg-opacity-70 flex justify-center items-center z-20"><span className="text-white font-semibold text-lg animate-pulse">Loading...</span></div>
                     )}
                    <ArcDiagramContainer
                        data={filteredConnectionData} // From hook
                        isLoading={isFiltering || !selectedChapter} // From hook
                        width={dimensions.width} // From hook
                        height={dimensions.height} // From hook
                        onNodeSelect={handleNodeSelect} // Handler from hook
                        onNodeHoverStart={handleNodeHoverStart} // Handler from hook
                        onNodeHoverEnd={handleNodeHoverEnd} // Handler from hook
                    />
                </div>

                {/* Info Panels Area */}
                <div className="w-full lg:w-[340px] lg:max-w-[340px] flex-shrink-0 h-[40%] lg:h-full flex flex-col gap-3 lg:max-h-full overflow-hidden">
                     <div className="flex-1 min-h-0">
                        <MetadataPanel selectedNodeId={selectedNodeId} hoveredNodeId={hoveredNodeId} />
                     </div>
                     <div className="flex-1 min-h-0">
                         {/* Pass bibleData and loading state from useBibleData hook */}
                        <TextDisplayPanel selectedNodeId={selectedNodeId} hoveredNodeId={hoveredNodeId} bibleData={bibleData} isLoadingBibleData={isLoadingData} />
                     </div>
                     <div className="flex-1 min-h-0">
                         {/* Pass relevant state from useVisualizationState hook */}
                        <ReferenceListPanel selectedNodeId={selectedNodeId} connectionData={filteredConnectionData} isLoadingConnections={isFiltering} />
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