// hooks/useResponsiveDimensions.js (No changes for MVP v9.0)
"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to calculate and provide responsive dimensions
 * for a visualization container based on window size.
 */
export function useResponsiveDimensions(
    initialWidth = 600, // Default initial width
    initialHeight = 450 // Default initial height
) {
    const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });

    useEffect(() => {
        // Ensure this code only runs on the client where 'window' is available
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const isLargeScreen = windowWidth >= 1024; // lg breakpoint

                // Attempt to get actual heights of surrounding elements for more accuracy
                const headerElement = document.getElementById('main-header');
                const footerElement = document.getElementById('main-footer');
                const controlsElement = document.getElementById('controls-area');

                // Use estimated heights as fallbacks
                const headerHeight = headerElement?.offsetHeight || 60;
                const footerHeight = footerElement?.offsetHeight || 20;
                const controlsHeight = controlsElement?.offsetHeight || 50;
                const verticalPadding = 24;
                const horizontalPadding = 24;
                const gap = 12;

                // Calculate height available for the main content row/column
                const availableHeight = windowHeight - headerHeight - footerHeight - controlsHeight - verticalPadding - gap;

                let vizWidth, vizHeight;

                if (isLargeScreen) {
                    // Side-by-side layout
                    const infoPanelWidth = 340; // Defined in MainPage layout
                    const availableVizWidth = windowWidth - infoPanelWidth - gap - horizontalPadding;
                    vizWidth = Math.max(300, availableVizWidth);
                    vizHeight = Math.max(300, availableHeight);
                } else {
                    // Stacked layout (mobile)
                    const availableVizWidth = windowWidth - horizontalPadding;
                    vizWidth = Math.max(300, availableVizWidth);
                    const minPanelStackHeight = 300;
                    vizHeight = Math.max(250, availableHeight - minPanelStackHeight - gap);
                }

                // Optional: Clamp dimensions
                vizWidth = Math.min(vizWidth, 2000);
                vizHeight = Math.min(vizHeight, 1500);

                // Update state only if dimensions actually changed
                setDimensions(prevDims => {
                    if (prevDims.width === vizWidth && prevDims.height === vizHeight) {
                        return prevDims;
                    }
                    return { width: vizWidth, height: vizHeight };
                });
            };

            // Initial calculation
            handleResize();

            // Debounced resize handler
            let resizeTimer;
            const debouncedHandler = () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(handleResize, 150);
            };
            window.addEventListener('resize', debouncedHandler);

            // Cleanup listener on component unmount
            return () => {
                 clearTimeout(resizeTimer);
                 window.removeEventListener('resize', debouncedHandler);
            };
        }
    }, []); // Empty dependency array

    return { dimensions };
}