// hooks/useResponsiveDimensions.js (MRP v1.14 - Simplify Desktop Height)
"use client";

import { useState, useEffect } from 'react';

/**
 * Custom hook to calculate responsive width and height.
 * Tries a simpler height logic for desktop.
 */
export function useResponsiveDimensions(
    initialWidth = 600,
    initialHeight = 600 // Use a square default initially
) {
    const [dimensions, setDimensions] = useState({ width: initialWidth, height: initialHeight });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight; // Use window height again for reference
                const isLargeScreen = windowWidth >= 1024;

                // --- Width Calculation (Unchanged) ---
                const horizontalPadding = 24; const gap = 12; let vizWidth;
                if (isLargeScreen) {
                    const infoPanelWidth = 340;
                    vizWidth = Math.max(300, windowWidth - infoPanelWidth - gap - horizontalPadding);
                } else {
                    vizWidth = Math.max(300, windowWidth - horizontalPadding);
                }
                vizWidth = Math.min(vizWidth, 2000);

                // --- Height Calculation (Simplified for Test) ---
                let vizHeight;
                if (isLargeScreen) {
                    // Desktop: Try using a height closer to window height minus estimated header/footer
                    // This is a *suggestion* for D3 scaling, flexbox still controls container.
                    const headerHeight = 70; const footerHeight = 30; const pageVPad = 24;
                    vizHeight = Math.max(400, windowHeight - headerHeight - footerHeight - pageVPad - gap); // Use more of available window height
                } else {
                    // Mobile: Keep the proportional height
                     vizHeight = Math.max(300, (windowHeight - 70 - 30 - 24) * 0.6); // Approx 60% of available flex height
                }
                vizHeight = Math.min(vizHeight, 1500); // Clamp max height

                setDimensions(prevDims => {
                    if (Math.abs(prevDims.width - vizWidth) < 5 && Math.abs(prevDims.height - vizHeight) < 5) return prevDims;
                    // console.log(`[useResponsiveDimensions] Updating dims: W=${vizWidth.toFixed(0)}, H=${vizHeight.toFixed(0)}`);
                    return { width: vizWidth, height: vizHeight };
                });
            };

            handleResize();
            let resizeTimer;
            const debouncedHandler = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(handleResize, 150); };
            window.addEventListener('resize', debouncedHandler);
            return () => { clearTimeout(resizeTimer); window.removeEventListener('resize', debouncedHandler); };
        }
    }, []);

    return { dimensions };
}