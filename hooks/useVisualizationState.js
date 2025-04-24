// utils/dataService.js (MVP v8.2 - Debug getBooks)

import { useState, useEffect, useCallback } from 'react';
import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from '@/utils/canonicalOrder';

// --- Module-level Caches ---
let bibleDataCache = null;
let referencesCache = null;
let bibleLookupMap = null;
let referencesLookupMap = null;
let isBibleProcessed = false;
let isReferencesProcessed = false;

// --- Parsing and Normalization Functions ---

// EXPORTED
export const parseReferenceId = (referenceId) => { /* ... robust implementation ... */
    if (!referenceId) return null; const cleanedId = referenceId.trim();
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i; const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i; const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex);
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }
    return null;
};

// EXPORTED (Used internally and potentially by other modules)
export const normalizeBookNameForText = (inputName) => {
    if (!inputName) return '';
    const cleanedName = inputName.trim();
    const lowerCaseCleaned = cleanedName.toLowerCase();
    // Comprehensive map - keys cover variants, values match canonicalOrder.js/BSB.json
    const map = {
        'gen': 'Genesis', 'exod': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deut': 'Deuteronomy',
        'josh': 'Joshua', 'judg': 'Judges', 'ruth': 'Ruth',
        '1sam': '1 Samuel', '1 samuel': '1 Samuel', '1sa': '1 Samuel',
        '2sam': '2 Samuel', '2 samuel': '2 Samuel', '2sa': '2 Samuel',
        '1kgs': '1 Kings', '1 kings': '1 Kings',
        '2kgs': '2 Kings', '2 kings': '2 Kings',
        '1chr': '1 Chronicles', '1 chronicles': '1 Chronicles', '1ch': '1 Chronicles',
        '2chr': '2 Chronicles', '2 chronicles': '2 Chronicles', '2ch': '2 Chronicles',
        'ezra': 'Ezra', 'neh': 'Nehemiah', 'est': 'Esther', 'job': 'Job',
        'ps': 'Psalms', 'psalm': 'Psalms', 'psa': 'Psalms',
        'prov': 'Proverbs', 'eccl': 'Ecclesiastes',
        'song': 'Song of Solomon', 'songofsolomon': 'Song of Solomon', 'song of solomon': 'Song of Solomon', 'sos': 'Song of Solomon',
        'isa': 'Isaiah', 'jer': 'Jeremiah', 'lam': 'Lamentations', 'ezek': 'Ezekiel', 'dan': 'Daniel',
        'hos': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obad': 'Obadiah', 'jonah': 'Jonah', 'mic': 'Micah',
        'nah': 'Nahum', 'hab': 'Habakkuk', 'zeph': 'Zephaniah', 'hag': 'Haggai', 'zech': 'Zechariah', 'mal': 'Malachi',
        'matt': 'Matthew', 'mark': 'Mark', 'mk': 'Mark', 'luke': 'Luke', 'lk': 'Luke', 'john': 'John', 'jn': 'John',
        'acts': 'Acts', 'rom': 'Romans',
        '1cor': '1 Corinthians', '1 corinthians': '1 Corinthians',
        '2cor': '2 Corinthians', '2 corinthians': '2 Corinthians',
        'gal': 'Galatians', 'eph': 'Ephesians',
        'phil': 'Philippians', 'col': 'Colossians',
        '1thess': '1 Thessalonians', '1 thessalonians': '1 Thessalonians', '1th': '1 Thessalonians',
        '2thess': '2 Thessalonians', '2 thessalonians': '2 Thessalonians', '2th': '2 Thessalonians',
        '1tim': '1 Timothy', '1 timothy': '1 Timothy',
        '2tim': '2 Timothy', '2 timothy': '2 Timothy',
        'titus': 'Titus', 'phlm': 'Philemon', 'heb': 'Hebrews', 'jas': 'James',
        '1pet': '1 Peter', '1 peter': '1 Peter',
        '2pet': '2 Peter', '2 peter': '2 Peter',
        '1jn': '1 John', '1john': '1 John', '1 john': '1 John',
        '2jn': '2 John', '2john': '2 John', '2 john': '2 John',
        '3jn': '3 John', '3john': '3 John', '3 john': '3 John',
        'jude': 'Jude',
        'rev': 'Revelation of John', 'revelation': 'Revelation of John'
    };
    const mappedName = map[lowerCaseCleaned];
    if (mappedName) return mappedName;
    for (const key in map) { if (lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) return map[key]; }
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};

// EXPORTED
export const normalizeBookNameForId = (inputName) => { /* ... comprehensive map ... */
     if (!inputName) return 'Unknown'; const cleanedName = inputName.replace(/[\s.]/g, '').toLowerCase();
     const map = { /* ... */ 'genesis': 'Genesis', 'revelation':'Revelation of John', '1samuel':'1 Samuel', 'songofsolomon':'Song of Solomon', /* ... */ };
     const normalized = map[cleanedName]; return normalized || normalizeBookNameForText(inputName) || inputName;
};

// EXPORTED
export const getNodeMetadata = (nodeId) => { /* ... */ };

// --- Loading Functions ---
export const loadBibleText = () => { /* ... As before ... */ };
export const loadAllReferences = () => { /* ... As before ... */ };

// --- Metadata Functions ---
// EXPORTED
export const getBooks = (bibleData) => {
    console.log("[getBooks] Called. bibleData valid:", !!bibleData?.books); // Log entry
    if (!bibleData || !bibleData.books || bibleData.books.length === 0) {
         console.error("[getBooks] Received invalid or empty bibleData.books");
         return []; // Return empty array if data is bad
    }
    try { // Add try-catch around the mapping/sorting
        const bookNames = bibleData.books.map(b => b.name);
        console.log("[getBooks] Raw book names from data (first 10):", bookNames.slice(0, 10));

        // Normalize names using the function intended for BSB.json names
        const canonicalNames = bookNames.map(name => normalizeBookNameForText(name));
        console.log("[getBooks] Normalized canonical names (first 10):", canonicalNames.slice(0, 10));

        // Ensure unique names *after* normalization
        const uniqueCanonicalNames = [...new Set(canonicalNames)];
        console.log(`[getBooks] Unique canonical names count: ${uniqueCanonicalNames.length} (Original: ${bookNames.length})`);

        // Sort using index lookup on the canonical names
        const sortedNames = uniqueCanonicalNames.sort((a, b) => {
            const indexA = getBookSortIndex(a); // getBookSortIndex expects the canonical name
            const indexB = getBookSortIndex(b);
            // Log if a name wasn't found in the canonical order map
            if (indexA === 999 && a !== 'Unknown') console.warn(`[getBooks] Sort index not found for normalized name: '${a}'`);
            if (indexB === 999 && b !== 'Unknown') console.warn(`[getBooks] Sort index not found for normalized name: '${b}'`);
            return indexA - indexB;
        });
        console.log("[getBooks] Returning sorted list (first 10):", sortedNames.slice(0,10));
        return sortedNames;
    } catch (error) {
        console.error("[getBooks] Error during processing:", error);
        return []; // Return empty array on error
    }
};
// EXPORTED
export const getChapters = (bibleData, bookName) => { /* ... As before ... */ };
// EXPORTED
export const getVersesForChapter = (bibleData, bookName, chapterNum) => { /* ... As before ... */ };


// --- Optimized Text Retrieval ---
// EXPORTED
export const getTextForReference = (bibleData, referenceId) => { /* ... As before ... */ };

// --- Optimized Connection Filtering ---
// EXPORTED
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => { /* ... As before ... */ };

// Helper (already present in previous full file post)
const createTempLookup = (bibleData) => { /* ... */ };