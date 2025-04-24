// utils/dataService.js (MVP v9.0 - Implementing Optimization Structure)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

// --- Module-level Caches ---
let bibleDataCache = null;
let referencesCache = null;
let bibleLookupMap = null; // Map<CanonBookNameForText, Map<ChapterNum, Map<VerseNum, VerseText>>>
let referencesLookupMap = null; // Map<SourcePrefix (e.g., Genesis1v), Link[]>
let isBibleProcessed = false;
let isReferencesProcessed = false;

// --- Parsing and Normalization Functions ---
// [Assume parseReferenceId, normalizeBookNameForText, normalizeBookNameForId are robustly defined and exported as needed]
export const parseReferenceId = (referenceId) => { /* ... */ };
export const normalizeBookNameForId = (inputName) => { /* ... */ };
const normalizeBookNameForText = (inputName) => { /* ... */ }; // Internal likely sufficient
export const getNodeMetadata = (nodeId) => { /* ... */ };

// --- Optimized Loading & Pre-processing Functions ---
export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache;
    console.time("Load/Preprocess Bible Text");
    try {
        bibleDataCache = bibleDataRaw;
        if (!isBibleProcessed) { // Process only once
            bibleLookupMap = new Map();
            // ** IMPLEMENTATION POINT 1: **
            // Populate bibleLookupMap efficiently from bibleDataCache
            // Example:
            bibleDataCache.books.forEach(book => {
                const chapterMap = new Map();
                const canonicalBookName = normalizeBookNameForText(book.name);
                book.chapters.forEach(chap => {
                    const verseMap = new Map();
                    chap.verses.forEach(v => verseMap.set(v.verse, v.text));
                    chapterMap.set(chap.chapter, verseMap);
                });
                bibleLookupMap.set(canonicalBookName, chapterMap);
            });
            isBibleProcessed = true;
            console.log("Bible lookup map populated.");
        }
        console.timeEnd("Load/Preprocess Bible Text");
        return bibleDataCache;
    } catch (error) { console.error("Error loading/processing Bible data:", error); isBibleProcessed = false; throw new Error("Failed to load Bible data."); }
};

export const loadAllReferences = () => {
    if (referencesCache) return referencesCache;
     console.time("Load/Preprocess References");
    try {
        if (!Array.isArray(allReferencesRaw)) throw new Error("references.json not valid array.");
        referencesCache = allReferencesRaw;
        if (!isReferencesProcessed) { // Process only once
            referencesLookupMap = new Map();
            // ** IMPLEMENTATION POINT 2: **
            // Populate referencesLookupMap efficiently from referencesCache
            // Example:
            referencesCache.forEach(link => {
                if (!link || !link.source) return;
                const parsedSource = parseReferenceId(link.source);
                if(parsedSource && parsedSource.verse !== null) {
                    const prefix = `${normalizeBookNameForId(parsedSource.book)}${parsedSource.chapter}v`;
                    if (!referencesLookupMap.has(prefix)) referencesLookupMap.set(prefix, []);
                    referencesLookupMap.get(prefix).push(link);
                }
            });
            isReferencesProcessed = true;
            console.log(`References lookup map populated with ${referencesLookupMap.size} prefixes.`);
        }
        console.timeEnd("Load/Preprocess References");
        return referencesCache;
    } catch (error) { console.error("Error loading/processing references data:", error); isReferencesProcessed = false; throw new Error("Failed to load references data."); }
};

// --- Metadata Functions ---
// (No changes needed from v8.1 - ensure they use correct normalization)
export const getBooks = (bibleData) => { /* ... */ };
export const getChapters = (bibleData, bookName) => { /* ... */ };
export const getVersesForChapter = (bibleData, bookName, chapterNum) => { /* ... Use bibleLookupMap if available ... */ };


// --- Optimized Text Retrieval ---
export const getTextForReference = (bibleData, referenceId) => { // bibleData potentially unused if map is reliable
    // ** IMPLEMENTATION POINT 3: **
    // Rewrite this function to use bibleLookupMap for fast lookups.
    // Handle errors and edge cases (book/chapter/verse not found in map).
    if (!bibleLookupMap) { loadBibleText(); } // Ensure processed
    if (!bibleLookupMap) return "Bible data not available/processed.";
    // ... (Rest of the optimized lookup logic from v6.0/v7.0 code) ...
    const parsedRef = parseReferenceId(referenceId); if (!parsedRef) return `Invalid ID: ${referenceId}`;
    const normalizedBookName = normalizeBookNameForText(parsedRef.book);
    try { const chapterMap = bibleLookupMap.get(normalizedBookName); if (!chapterMap) return `Book not found: ${normalizedBookName}`; const verseMap = chapterMap.get(parsedRef.chapter); if (!verseMap) return `Chapter not found: ${normalizedBookName} ${parsedRef.chapter}`; if (parsedRef.verse !== null) { /* Verse lookup */ } else { /* Chapter lookup */ } } catch(e) { /* error handling */ }
};

// --- Optimized Connection Filtering ---
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => { // allLinks potentially unused
     // ** IMPLEMENTATION POINT 4: **
     // Rewrite this function to use referencesLookupMap for fast initial filtering.
     // Keep the subsequent node derivation and canonical sorting logic.
    if (!referencesLookupMap) { loadAllReferences(); } // Ensure processed
    if (!referencesLookupMap) return { nodes: [], links: [] };
    if (!selectedBook || !selectedChapter) return null;
    // ... (Get originLinks from referencesLookupMap based on prefix) ...
    const normalizedBookForFiltering = normalizeBookNameForId(selectedBook);
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`;
    const originLinks = referencesLookupMap.get(sourcePrefix) || [];
    // ... (Rest of node derivation, aggregation based on viewMode, sorting - same as v8.1) ...
     if (originLinks.length === 0) return { nodes: [], links: [] }; let finalNodes = []; let finalLinks = []; const nodeMap = new Map(); const ensureNode = (id) => { /*...*/ }; if (viewMode === 'chapter') { /* Aggregate */ } else { /* Verse view */ } finalLinks = finalLinks.map(link => ({ ...link, value: 1 })); finalNodes = Array.from(nodeMap.values()); finalNodes.sort((a, b) => { /*...*/ }); return { nodes: finalNodes, links: finalLinks };
};