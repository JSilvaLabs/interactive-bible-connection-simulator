// hooks/useResponsiveDimensions.js (MRP v1.11 - Focus on Width)
"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to calculate responsive width for a visualization container.
 * Height is now less directly calculated from window, allowing flexbox more control.
 */
export function useResponsiveDimensions(
    initialWidth = 600, // Default initial width
    // Height is less critical now, use width as a basis or a large default
    initialHeight = 600 // Default initial height (or set equal to initialWidth)
) {
    const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });

    useEffect(() => {
        // Ensure this code only runs on the client where 'window' is available
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                const windowWidth = window.innerWidth;
                // Window height is less reliable for calculation in scrolling layouts
                // const windowHeight = window.innerHeight;
                const isLargeScreen = windowWidth >= 1024; // lg breakpoint

                // --- Width Calculation (remains mostly the same) ---
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

                // --- Height Calculation (Simplified) ---
                // Let's pass down a height related to the width to suggest an aspect ratio,
                // but the actual container height will be controlled by CSS/Flexbox.
                // Option A: Suggest aspect ratio (e.g., 4:3 or 1:1)
                const vizHeight = Math.max(300, vizWidth * 0.75); // Suggest 4:3 ratio

                // Option B: Pass a large fixed default - less ideal?
                // const vizHeight = 1000;

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