// hooks/useResponsiveDimensions.js (MRP v1.13 - Revised Height Calc)
"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to calculate responsive width and a *more context-aware* height
 * for a visualization container.
 */
export function useResponsiveDimensions(
    initialWidth = 600,
    initialHeight = 450 // Reset default
) {
    const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });

    useEffect(() => {
        // Ensure this code only runs on the client where 'window' is available
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const isLargeScreen = windowWidth >= 1024; // lg breakpoint

                // --- Width Calculation (Unchanged) ---
                const horizontalPadding = 24; // Estimate padding in page.js
                const gap = 12; // Estimate gap in page.js
                let vizWidth;

                if (isLargeScreen) {
                    // Desktop: Calculate width based on available space next to panels
                    const infoPanelWidth = 340; // Defined in MainPage layout
                    const availableVizWidth = windowWidth - infoPanelWidth - gap - horizontalPadding;
                    vizWidth = Math.max(300, availableVizWidth);
                } else {
                    // Mobile: Calculate width based on full window width minus padding
                    const availableVizWidth = windowWidth - horizontalPadding;
                    vizWidth = Math.max(300, availableVizWidth);
                }
                vizWidth = Math.min(vizWidth, 2000); // Clamp max width

                // --- Height Calculation (Revised) ---
                // Estimate heights of elements *outside* the main flex container
                const headerElement = document.getElementById('main-header');
                const footerElement = document.getElementById('main-footer');
                const headerHeight = headerElement?.offsetHeight || 70; // Adjusted estimate based on content/padding
                const footerHeight = footerElement?.offsetHeight || 30; // Adjusted estimate
                const pageVerticalPadding = 24; // Padding of the flex container in page.js (p-2 md:p-3 -> ~16-24px)

                // Calculate available height for the main flex container (viz + panels)
                const availableFlexHeight = windowHeight - headerHeight - footerHeight - pageVerticalPadding;

                let vizHeight;
                if (isLargeScreen) {
                    // Desktop: Diagram container takes flex height minus gap/padding
                    // Let's assume minimal padding impact within the flex item
                    vizHeight = Math.max(300, availableFlexHeight); // Let it take available flex height
                } else {
                    // Mobile: Diagram container takes a large portion (e.g., 60%) of flex height
                    // Panels stack below and take roughly 40% + gap
                    // This allows for scrolling page while suggesting a large diagram height
                    vizHeight = Math.max(300, availableFlexHeight * 0.6); // Suggest 60% height
                }

                vizHeight = Math.min(vizHeight, 1500); // Clamp max height

                // Update state only if dimensions actually changed significantly
                setDimensions(prevDims => {
                    if (Math.abs(prevDims.width - vizWidth) < 5 && Math.abs(prevDims.height - vizHeight) < 5) {
                        return prevDims; // Avoid minor fluctuations
                    }
                    // console.log(`[useResponsiveDimensions] Updating dims: W=${vizWidth.toFixed(0)}, H=${vizHeight.toFixed(0)}`);
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
    }, []); // Empty dependency array ensures it runs once on mount + resizes

    return { dimensions };
}