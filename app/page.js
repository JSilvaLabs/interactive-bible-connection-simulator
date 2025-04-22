"use client"; // Required for useState hook

import { useState, useEffect } from 'react';
import VisualizationContainer from '@/components/VisualizationContainer';
import ViewToggle from '@/components/ViewToggle';

// Import static data directly
import chapterData from '@/data/chapterData.json';
import verseData from '@/data/verseData.json';

export default function MainPage() {
  const [viewMode, setViewMode] = useState('chapter'); // 'chapter' or 'verse'
  const [currentData, setCurrentData] = useState(chapterData);
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 }); // Initial dimensions

  // Update data when viewMode changes
  useEffect(() => {
    if (viewMode === 'chapter') {
      setCurrentData(chapterData);
    } else {
      setCurrentData(verseData);
    }
  }, [viewMode]);

  // Handle resizing (basic example - more robust solution might use ResizeObserver)
   useEffect(() => {
    const handleResize = () => {
      // Simple example: maintain aspect ratio, adjust based on window width
      const containerWidth = window.innerWidth > 960 ? 900 : window.innerWidth * 0.9;
      setDimensions({ width: containerWidth, height: containerWidth });
    };

    // Set initial size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const handleToggleView = () => {
    setViewMode(prevMode => (prevMode === 'chapter' ? 'verse' : 'chapter'));
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">
        Internal Bible Connection Simulator (POC)
      </h1>

      <div className="mb-4">
        <ViewToggle currentView={viewMode} onToggle={handleToggleView} />
      </div>

      <div className="w-full max-w-4xl aspect-square border border-gray-300 dark:border-gray-700 shadow-lg rounded-lg overflow-hidden bg-white dark:bg-gray-800">
         {/* Pass the dynamically calculated dimensions */}
        <VisualizationContainer data={currentData} width={dimensions.width} height={dimensions.height} />
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Developed by JSilvaLabs - Global Minister Education
      </footer>
    </main>
  );
}