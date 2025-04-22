// hooks/useBibleData.js - TEMPORARY DEBUGGING VERSION
"use client";

import { useState, useEffect } from 'react';

export function useBibleData() {
    console.log("DEBUG: Using SIMPLIFIED useBibleData hook.");
    // Immediately return default/empty data and indicate loading is finished.
    // This bypasses the actual file loading during the build.
    return {
        bibleData: { translation: "Mock", books: [] }, // Minimal valid structure
        allReferencesData: [], // Empty array
        bookList: [],
        isLoadingData: false, // Pretend loading is done
        error: null
    };
}