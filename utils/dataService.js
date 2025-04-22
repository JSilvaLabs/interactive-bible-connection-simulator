// utils/dataService.js (MVP v7.0 - Implementing Optimizations)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

// --- Module-level Caches ---
let bibleDataCache = null;
let referencesCache = null;
let bibleLookupMap = null; // Optimized: Map<CanonBookName, Map<ChapterNum, Map<VerseNum, VerseText>>>
let referencesLookupMap = null; // Optimized: Map<SourcePrefix (e.g., Genesis1v), Link[]>

// --- Parsing & Normalization ---
// [Keep the robust parseReferenceId, normalizeBookNameForText, normalizeBookNameForId functions from previous steps]
export const parseReferenceId = (referenceId) => { /* ... robust implementation ... */
    if (!referenceId) return null; const cleanedId = referenceId.trim();
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i; const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i; const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex);
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }
    return null;
};
const normalizeBookNameForText = (inputName) => { /* ... robust implementation ... */
    if (!inputName) return ''; const cleanedName = inputName.trim(); const lowerCaseCleaned = cleanedName.toLowerCase();
    const map = { 'gen': 'Genesis', /*...*/ 'rev': 'Revelation of John'};
    for (const key in map) { if (lowerCaseCleaned === key || lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) return map[key]; }
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};
export const normalizeBookNameForId = (inputName) => { /* ... robust implementation ... */
     if (!inputName) return 'Unknown'; const cleanedName = inputName.replace(/\s/g, '').toLowerCase();
     const map = { 'genesis': 'Genesis', /*...*/ 'revelation':'Revelation of John'};
     const normalized = map[cleanedName];
     return normalized || normalizeBookNameForText(inputName) || inputName; // Use canonical name!
};
export const getNodeMetadata = (nodeId) => { /* ... robust implementation ... */
     if (!nodeId) return null; const parsed = parseReferenceId(nodeId);
     if (!parsed) return { rawId: nodeId };
     return { book: normalizeBookNameForText(parsed.book), chapter: parsed.chapter, verse: parsed.verse };
};


// --- Optimized Loading & Pre-processing Functions ---
export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache; // Return raw data cache
    console.time("Load/Preprocess Bible Text"); // Start timing
    try {
        bibleDataCache = bibleDataRaw;
        // Build the lookup map if it doesn't exist
        if (!bibleLookupMap) {
            bibleLookupMap = new Map();
            bibleDataCache.books.forEach(book => {
                const chapterMap = new Map();
                // Use canonical name from BSB.json for the map key
                const canonicalBookName = normalizeBookNameForText(book.name); // Use Text Normalizer
                book.chapters.forEach(chap => {
                    const verseMap = new Map();
                    chap.verses.forEach(v => { verseMap.set(v.verse, v.text); });
                    chapterMap.set(chap.chapter, verseMap);
                });
                bibleLookupMap.set(canonicalBookName, chapterMap);
            });
             console.log("Bible lookup map created.");
        }
        console.timeEnd("Load/Preprocess Bible Text"); // End timing
        return bibleDataCache;
    } catch (error) { console.error("Error loading/processing Bible data:", error); throw new Error("Failed to load Bible data."); }
};

export const loadAllReferences = () => {
    if (referencesCache) return referencesCache; // Return raw data cache
     console.time("Load/Preprocess References");
    try {
        if (!Array.isArray(allReferencesRaw)) throw new Error("references.json not array.");
        referencesCache = allReferencesRaw;
        // Build the references lookup map if it doesn't exist
        if (!referencesLookupMap) {
            referencesLookupMap = new Map();
            referencesCache.forEach(link => {
                if (!link || !link.source) return;
                const parsedSource = parseReferenceId(link.source);
                // Group by source verse prefix (BookChv) using ID-normalized book name
                if(parsedSource && parsedSource.verse !== null) {
                    const prefix = `${normalizeBookNameForId(parsedSource.book)}${parsedSource.chapter}v`; // e.g., Genesis1v
                    if (!referencesLookupMap.has(prefix)) { referencesLookupMap.set(prefix, []); }
                    referencesLookupMap.get(prefix).push(link);
                }
                 // Add other prefix handling if needed
            });
             console.log(`References lookup map created with ${referencesLookupMap.size} prefixes.`);
        }
        console.timeEnd("Load/Preprocess References");
        return referencesCache;
    } catch (error) { console.error("Error loading/processing references data:", error); throw new Error("Failed to load references data."); }
};

// --- Metadata Functions (Remain the same) ---
export const getBooks = (bibleData) => { /* ... */ };
export const getChapters = (bibleData, bookName) => { /* ... */ };

// --- Optimized Text Retrieval ---
export const getTextForReference = (bibleData, referenceId) => { // bibleData arg may become optional
    if (!bibleLookupMap) { loadBibleText(); } // Ensure map is built
    if (!bibleLookupMap) return "Bible data not available/processed.";
    if (!referenceId) return "Select node...";

    const parsedRef = parseReferenceId(referenceId);
    if (!parsedRef) return `Invalid ID: ${referenceId}`;
    const normalizedBookName = normalizeBookNameForText(parsedRef.book);

    try {
        const chapterMap = bibleLookupMap.get(normalizedBookName);
        if (!chapterMap) return `Book not found [Map]: ${normalizedBookName}`;
        const verseMap = chapterMap.get(parsedRef.chapter);
        if (!verseMap) return `Chapter not found [Map]: ${normalizedBookName} ${parsedRef.chapter}`;

        if (parsedRef.verse !== null) { /* Verse lookup */
            const text = verseMap.get(parsedRef.verse);
            return text ? `${normalizedBookName} ${parsedRef.chapter}:${parsedRef.verse}\n${text.trim()}` : `Verse not found [Map]: ${referenceId}`;
        } else { /* Chapter lookup */
            const chapterHeader = `${normalizedBookName} ${parsedRef.chapter}\n--------------------\n`;
            const versesText = Array.from(verseMap.entries()).sort(([vA], [vB]) => vA - vB)
                .map(([vNum, vText]) => `${vNum} ${vText.trim()}`).join('\n\n');
            return chapterHeader + versesText;
        }
    } catch(error) { console.error(`Error in getTextForReference for ${referenceId}:`, error); return `Error looking up text.`; }
};

// --- Optimized Connection Filtering ---
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => { // allLinks arg may become optional
     if (!referencesLookupMap) { loadAllReferences(); } // Ensure map is built
     if (!referencesLookupMap) return { nodes: [], links: [] };
     if (!selectedBook || !selectedChapter) return null;

     const normalizedBookForFiltering = normalizeBookNameForId(selectedBook);
     // Use ID normalization for map key lookup
     const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`;

    // --- Use Optimized Map for Filtering ---
    const originLinks = referencesLookupMap.get(sourcePrefix) || [];

    if (originLinks.length === 0) return { nodes: [], links: [] };

    // --- (Rest of the logic: Aggregation/Node Derivation/Sorting remains the same as MVP v5.0) ---
    let finalNodes = []; let finalLinks = []; const nodeMap = new Map();
    const ensureNode = (id) => { /* ... */ }; // (Keep implementation)
    if (viewMode === 'chapter') { /* ... Aggregate originLinks ... */ } else { /* ... Use originLinks directly ... */ }
    finalLinks = finalLinks.map(link => ({ ...link, value: 1 })); // Ensure value is 1
    finalNodes = Array.from(nodeMap.values());
    finalNodes.sort((a, b) => { /* ... canonical sort logic ... */ });
    // --- End unchanged logic ---

    return { nodes: finalNodes, links: finalLinks };
};