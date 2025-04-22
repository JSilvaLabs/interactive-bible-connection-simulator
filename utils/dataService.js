// utils/dataService.js (MVP v4.0 Update - Simplified getConnectionsFor)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

let bibleDataCache = null;
let referencesCache = null;
// let bibleLookupCache = null; // TODO: Implement for faster text lookup

// --- Loading Functions ---
export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache;
    try {
        bibleDataCache = bibleDataRaw;
        console.log("Bible data loaded.");
        return bibleDataCache;
    } catch (error) { console.error("Error loading Bible data:", error); throw new Error("Failed to load Bible data."); }
};

export const loadAllReferences = () => {
    if (referencesCache) return referencesCache;
    try {
        if (!Array.isArray(allReferencesRaw)) throw new Error("references.json is not a valid array.");
        referencesCache = allReferencesRaw;
        console.log(`Loaded ${referencesCache.length} references.`);
        return referencesCache;
    } catch (error) { console.error("Error loading references data:", error); throw new Error("Failed to load references data."); }
};

// --- Metadata & Normalization ---

export const getBooks = (bibleData) => {
    if (!bibleData || !bibleData.books) return [];
    const bookNames = bibleData.books.map(b => b.name);
    return bookNames.sort((a, b) => getBookSortIndex(a) - getBookSortIndex(b));
};

export const getChapters = (bibleData, bookName) => {
    if (!bibleData || !bookName || !bibleData.books) return [];
    const book = bibleData.books.find(b => b.name === bookName);
    return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
};

// Normalizes book names for display or matching BSB.json keys
const normalizeBookNameForText = (inputName) => {
     if (!inputName) return '';
    const cleanedName = inputName.trim();
    const lowerCaseCleaned = cleanedName.toLowerCase();
    const map = { /* ... (Map from MVP v3.0) ... */
        'gen': 'Genesis', 'exo': 'Exodus', /*...*/ 'rev': 'Revelation of John'};
    for (const key in map) { if (lowerCaseCleaned === key || lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) return map[key]; }
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};

// Normalizes book names from IDs to canonical names for sorting/grouping
const normalizeBookNameForId = (inputName) => {
    if (!inputName) return 'Unknown';
    const cleanedName = inputName.replace(/\s/g, '').toLowerCase();
    const map = { /* ... (Map from MVP v3.0) ... */
        'genesis': 'Genesis', 'exodus': 'Exodus', /*...*/ 'revelation':'Revelation of John'};
    const normalized = map[cleanedName];
    return normalized || normalizeBookNameForText(inputName) || inputName;
};

// Parses reference IDs (Handles BookChvVs, BookCh, Book.Ch.Vs) - EXPORTED
export const parseReferenceId = (referenceId) => {
    if (!referenceId) return null;
    const cleanedId = referenceId.trim();
    // Try dot format
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i;
    const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }
    // Try concatenated format
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i;
    const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex);
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }
    return null;
};

// --- Text Retrieval (Slow Version) ---
export const getTextForReference = (bibleData, referenceId) => {
    // ... (Keep the implementation from MVP v3.0 - File 2, Line 90 onwards) ...
     if (!bibleData || !bibleData.books) return "Bible data not loaded.";
    if (!referenceId) return "Select node...";
    const parsedRef = parseReferenceId(referenceId);
    if (!parsedRef) return `Invalid ID: ${referenceId}`;
    const normalizedBookName = normalizeBookNameForText(parsedRef.book);
    const book = bibleData.books.find(b => b.name === normalizedBookName);
    if (!book) return `Book not found [Text]: ${normalizedBookName} (from ${referenceId})`;
    const chapter = book.chapters.find(c => c.chapter === parsedRef.chapter);
    if (!chapter) return `Chapter not found [Text]: ${normalizedBookName} ${parsedRef.chapter}`;
    let outputText = '';
    if (parsedRef.verse !== null) { /* Find verse */
         const verse = chapter.verses.find(v => v.verse === parsedRef.verse);
        outputText = verse ? `${book.name} ${parsedRef.chapter}:${parsedRef.verse}\n${verse.text.trim()}` : `Verse not found [Text]: ${referenceId}`;
     } else { /* Format chapter */
         const chapterHeader = `${book.name} ${parsedRef.chapter}\n--------------------\n`;
        const versesText = chapter.verses.map(v => `${v.verse} ${v.text.trim()}`).join('\n\n');
        outputText = chapterHeader + versesText;
     }
    return outputText;
};


// --- Connection Filtering (MVP v4.0 - Simplified for Arc Diagram) ---
// Both 'chapter' and 'verse' modes now filter links starting from the selected chapter,
// derive the necessary verse/chapter nodes, sort them canonically, and return.
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => {
    if (!allLinks || !selectedBook || !selectedChapter) return null;

    const normalizedBookForFiltering = normalizeBookNameForId(selectedBook);
    // TODO: Verify prefix logic matches references.json source ID format EXACTLY
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`; // Assumes "BookChv..." format
     // const sourceDotPrefix = `${normalizedBookForFiltering}.${selectedChapter}.`; // Alt prefix if needed

    console.log(`Filtering connections STARTING WITH book='${normalizedBookForFiltering}', chapter='${selectedChapter}'`);
    console.log(` -- Using source prefix: '${sourcePrefix}'`);

    const originLinks = allLinks.filter(link =>
        link.source && link.source.startsWith(sourcePrefix) // Adapt this check
    );

    console.log(`Found ${originLinks.length} origin links.`);
    if (originLinks.length === 0) return { nodes: [], links: [] };

    // Ensure value is 1 for uniform appearance (arcs aren't sized by value here)
    const finalLinks = originLinks.map(link => ({ ...link, value: 1 }));

    // Derive unique nodes involved in the filtered links
    const nodeMap = new Map();
    const ensureNode = (id) => {
        if (!id || nodeMap.has(id)) return;
        const parsed = parseReferenceId(id);
        if (!parsed) { nodeMap.set(id, { id: id, label: id, book: 'Unknown' }); return; }
        const bookNameKey = normalizeBookNameForId(parsed.book);
        const bookNameLabel = normalizeBookNameForText(parsed.book);
        let label = parsed.verse !== null
                  ? `${bookNameLabel} ${parsed.chapter}:${parsed.verse}`
                  : `${bookNameLabel} ${parsed.chapter}`; // Label is always specific (verse or chapter)
        nodeMap.set(id, { id: id, label: label, book: bookNameKey });
    };

    finalLinks.forEach(link => {
        ensureNode(link.source);
        ensureNode(link.target);
    });

     // Add the primary source chapter node explicitly if chapter view (might be implicit otherwise)
     // Optional: Might not be needed if ensureNode covers all sources/targets
     // if (viewMode === 'chapter') {
     //     const sourceChapterId = `${normalizedBookForFiltering}${selectedChapter}`;
     //     ensureNode(sourceChapterId);
     // }

    // Sort the derived nodes canonically
    let finalNodes = Array.from(nodeMap.values());
    finalNodes.sort((a, b) => {
        const indexA = getBookSortIndex(a.book);
        const indexB = getBookSortIndex(b.book);
        if (indexA !== indexB) return indexA - indexB;
        const parsedA = parseReferenceId(a.id);
        const parsedB = parseReferenceId(b.id);
        if (parsedA && parsedB) {
            if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter;
            const verseA = parsedA.verse === null ? 0 : parsedA.verse;
            const verseB = parsedB.verse === null ? 0 : parsedB.verse;
            if (verseA !== verseB) return verseA - verseB;
        }
        return a.id.localeCompare(b.id);
    });

    console.log(`Derived and sorted ${finalNodes.length} nodes for Arc Diagram.`);
    return { nodes: finalNodes, links: finalLinks }; // Return canonically sorted nodes
};


// --- Metadata Helper ---
export const getNodeMetadata = (nodeId) => {
    if (!nodeId) return null;
    const parsed = parseReferenceId(nodeId);
    if (!parsed) return { rawId: nodeId };
    return {
        book: normalizeBookNameForText(parsed.book),
        chapter: parsed.chapter,
        verse: parsed.verse // null if chapter-level ID
    };
}