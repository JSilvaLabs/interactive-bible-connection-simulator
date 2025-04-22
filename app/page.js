"use client";

import { useState, useEffect } from 'react';
import VisualizationContainer from '@/components/VisualizationContainer';
import ViewToggle from '@/components/ViewToggle';
import TextDisplayPanel from '@/components/TextDisplayPanel'; // Import new component
import { loadChapterData, loadVerseData, loadBibleText } from '@/utils/dataService'; // Import data loading functions

export default function MainPage() {
  const [viewMode, setViewMode] = useState('chapter'); // 'chapter' or 'verse'
  const [connectionData, setConnectionData] = useState(null);
  const [bibleData, setBibleData] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null); // State for selected node
  const [isLoading, setIsLoading] = useState(true); // Loading state for bible text
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 }); // Smaller default

   // Effect for loading data on mount
  useEffect(() => {
    setIsLoading(true); // Start loading
    try {
        // Load connection data based on initial view mode
        setConnectionData(viewMode === 'chapter' ? loadChapterData() : loadVerseData());
        // Load Bible text data
        setBibleData(loadBibleText());
    } catch (error) {
        console.error("Failed to load initial data:", error);
        // Handle error state appropriately
    } finally {
        setIsLoading(false); // Finish loading
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  // Effect for updating connection data when viewMode changes
  useEffect(() => {
    // Only run if not initial load (isLoading is false)
    if (!isLoading) {
        if (viewMode === 'chapter') {
            setConnectionData(loadChapterData());
        } else {
            setConnectionData(loadVerseData());
        }
         // Reset selection when view mode changes
        setSelectedNodeId(null);
    }
  }, [viewMode, isLoading]);

  // Effect for handling window resize
   useEffect(() => {
    const handleResize = () => {
      // Adjust logic to fit layout with text panel
      const availableWidth = window.innerWidth < 1024 ? window.innerWidth * 0.9 : (window.innerWidth * 0.9) / 2; // Allocate roughly half width on large screens
      const size = Math.max(300, Math.min(availableWidth, window.innerHeight * 0.7)); // Ensure min size, limit by height
      setDimensions({ width: size, height: size });
    };
    handleResize(); // Initial size calculation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Handler for toggling view
  const handleToggleView = () => {
    setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter'));
  };

  // Handler for node selection from ChordDiagram
  const handleNodeSelect = (nodeId) => {
    setSelectedNodeId(nodeId);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-6 lg:p-8 bg-gray-100 dark:bg-gray-800">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">
        Internal Bible Connection Simulator (Prototype)
      </h1>

      <div className="mb-4">
        {isLoading ? (
             <span className="text-gray-500 dark:text-gray-400">Loading...</span>
        ) : (
            <ViewToggle currentView={viewMode} onToggle={handleToggleView} />
        )}
      </div>

      {/* Layout container for Diagram and Text Panel */}
      <div className="flex flex-col lg:flex-row w-full max-w-6xl gap-4 flex-grow h-[calc(100vh-150px)]">
         {/* Visualization Area */}
         <div className="w-full lg:w-1/2 h-full min-h-[350px] border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg overflow-hidden flex justify-center items-center bg-white dark:bg-gray-900">
            <VisualizationContainer
                data={connectionData}
                width={dimensions.width}
                height={dimensions.height}
                onNodeSelect={handleNodeSelect} // Pass the handler
             />
         </div>

         {/* Text Display Area */}
         <div className="w-full lg:w-1/2 h-full min-h-[300px]">
             <TextDisplayPanel
                selectedNodeId={selectedNodeId}
                bibleData={bibleData}
             />
         </div>
      </div>

      <footer className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
        Prototype v1.0 | Developed by JSilvaLabs - Global Minister Education
      </footer>
    </main>
  );
}