// hooks/useResponsiveDimensions.js
"use client"; // Directive required for hooks using useState/useEffect/window

import { useState, useEffect } from 'react';

/**
 * Custom hook to calculate and provide responsive dimensions
 * for a visualization container based on window size.
 */
export function useResponsiveDimensions(
    initialWidth = 600, // Default initial width
    initialHeight = 450 // Default initial height
) {
    // Initialize state with potentially server-safe defaults or initial values
    const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });

    useEffect(() => {
        // Ensure this code only runs on the client where 'window' is available
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const isLargeScreen = windowWidth >= 1024; // lg breakpoint (Tailwind default)

                // Attempt to get actual heights of surrounding elements for more accuracy
                // Fallback to estimates if elements aren't found immediately
                const headerElement = document.getElementById('main-header');
                const footerElement = document.getElementById('main-footer');
                const controlsElement = document.getElementById('controls-area');

                // Use estimated heights as fallbacks
                const headerHeight = headerElement?.offsetHeight || 60;
                const footerHeight = footerElement?.offsetHeight || 20;
                const controlsHeight = controlsElement?.offsetHeight || 50;
                const verticalPadding = 24; // Approximating p-3 top/bottom
                const horizontalPadding = 24; // Approximating px-3 left/right
                const gap = 12; // gap-3

                // Calculate height available for the main content row/column
                const availableHeight = windowHeight - headerHeight - footerHeight - controlsHeight - verticalPadding - gap;

                let vizWidth, vizHeight;

                if (isLargeScreen) {
                    // --- Side-by-side layout (Large Screens) ---
                    // Estimate fixed width of info panels column
                    const infoPanelWidth = 340; // Width defined in MainPage layout
                    // Calculate width available for visualization container
                    const availableVizWidth = windowWidth - infoPanelWidth - gap - horizontalPadding;
                    // Use calculated available width, ensuring minimum
                    vizWidth = Math.max(300, availableVizWidth);
                    // Use calculated available height, ensuring minimum
                    vizHeight = Math.max(300, availableHeight);
                } else {
                    // --- Stacked layout (Small Screens) ---
                    // Visualization takes full available width
                    const availableVizWidth = windowWidth - horizontalPadding;
                    vizWidth = Math.max(300, availableVizWidth);
                    // Estimate minimum height needed for info panels below
                    const minPanelStackHeight = 300; // Adjust as needed
                    // Allocate remaining available height to visualization, ensuring minimum
                    vizHeight = Math.max(250, availableHeight - minPanelStackHeight - gap); // Min height for viz
                }

                // Optional: Clamp dimensions to reasonable maximums
                vizWidth = Math.min(vizWidth, 2000);
                vizHeight = Math.min(vizHeight, 1500);

                // Update state only if dimensions actually changed to avoid unnecessary re-renders
                setDimensions(prevDims => {
                    if (prevDims.width === vizWidth && prevDims.height === vizHeight) {
                        return prevDims;
                    }
                    // console.log("Resized dimensions:", { width: vizWidth, height: vizHeight }); // Debugging resize
                    return { width: vizWidth, height: vizHeight };
                });
            };

            // Initial calculation
            handleResize();

            // Debounced resize handler
            let resizeTimer;
            const debouncedHandler = () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(handleResize, 150); // Delay recalculation slightly
            };

            // Add event listener
            window.addEventListener('resize', debouncedHandler);

            // Cleanup listener on component unmount
            return () => {
                 clearTimeout(resizeTimer);
                 window.removeEventListener('resize', debouncedHandler);
            };
        }
    }, []); // Empty dependency array ensures this effect runs only once on the client after mount

    return { dimensions };
}