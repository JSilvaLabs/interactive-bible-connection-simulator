// hooks/useResponsiveDimensions.js (MRP v1.14 - Simplify Desktop Height)
"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to calculate responsive width and a *more context-aware* height
 * for a visualization container.
 */
export function useResponsiveDimensions(
    initialWidth = 600,
    initialHeight = 600 // Use a square default initially
) {
    const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });

    useEffect(() => {
        // Ensure this code only runs on the client where 'window' is available
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight; // Use window height again for reference
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

                // --- Height Calculation (Simplified for Test) ---
                let vizHeight;
                if (isLargeScreen) {
                    // Desktop: Try using a height closer to window height minus estimated header/footer
                    // This is a *suggestion* for D3 scaling, flexbox still controls container.
                    const headerElement = document.getElementById('main-header');
                    const footerElement = document.getElementById('main-footer');
                    const headerHeight = headerElement?.offsetHeight || 70; // Adjusted estimate
                    const footerHeight = footerElement?.offsetHeight || 30; // Adjusted estimate
                    const pageVerticalPadding = 24; // p-2 md:p-3 -> ~16-24px
                    const desktopGap = 12; // gap-3
                    vizHeight = Math.max(400, windowHeight - headerHeight - footerHeight - pageVerticalPadding - desktopGap); // Use more of available window height
                } else {
                    // Mobile: Keep the proportional height based on available space
                    const headerElement = document.getElementById('main-header');
                    const footerElement = document.getElementById('main-footer');
                    const headerHeight = headerElement?.offsetHeight || 70; // Use estimates consistently
                    const footerHeight = footerElement?.offsetHeight || 30;
                    const pageVerticalPadding = 16; // p-2
                    const availableFlexHeight = windowHeight - headerHeight - footerHeight - pageVerticalPadding;
                     vizHeight = Math.max(300, availableFlexHeight * 0.6); // Approx 60% of available flex height
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