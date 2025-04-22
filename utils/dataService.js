// utils/dataService.js (MVP v6.0 Refactor Outline)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

// --- Module-level Caches for Optimized Data ---
let bibleDataCache = null; // Raw loaded data
let referencesCache = null; // Raw loaded links
let bibleLookupMap = null; // OPTIMIZED structure for text lookup
let referencesLookupMap = null; // OPTIMIZED structure for filtering links by source

// --- Parsing and Normalization Functions ---
// (Assume parseReferenceId, normalizeBookNameForText, normalizeBookNameForId
// are defined here as in previous versions - ensure they are robust and exported if needed elsewhere)
export const parseReferenceId = (referenceId) => { /* ... Same as before ... */
    if (!referenceId) return null;
    const cleanedId = referenceId.trim();
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i;
    const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i;
    const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex);
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }
    return null;
};
const normalizeBookNameForText = (inputName) => { /* ... Same as before ... */
    if (!inputName) return '';
    const cleanedName = inputName.trim(); const lowerCaseCleaned = cleanedName.toLowerCase();
    const map = { 'gen': 'Genesis', /*...*/ 'rev': 'Revelation of John'};
    for (const key in map) { if (lowerCaseCleaned === key || lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) return map[key]; }
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};
const normalizeBookNameForId = (inputName) => { /* ... Same as before ... */
     if (!inputName) return 'Unknown'; const cleanedName = inputName.replace(/\s/g, '').toLowerCase();
     const map = { 'genesis': 'Genesis', /*...*/ 'revelation':'Revelation of John'};
     const normalized = map[cleanedName];
     return normalized || normalizeBookNameForText(inputName) || inputName;
};
export const getNodeMetadata = (nodeId) => { /* ... Same as before ... */
     if (!nodeId) return null; const parsed = parseReferenceId(nodeId);
     if (!parsed) return { rawId: nodeId };
     return { book: normalizeBookNameForText(parsed.book), chapter: parsed.chapter, verse: parsed.verse };
};


// --- Optimized Loading Functions ---
export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache; // Return cached raw data if already processed
    try {
        bibleDataCache = bibleDataRaw; // Store raw data

        // --- REFACTOR TARGET 1: Pre-process for Text Lookup ---
        console.time("Preprocess Bible Text");
        bibleLookupMap = new Map(); // Example: Map<BookName, Map<ChapterNum, Map<VerseNum, VerseText>>>
        bibleDataCache.books.forEach(book => {
            const chapterMap = new Map();
            book.chapters.forEach(chap => {
                const verseMap = new Map();
                chap.verses.forEach(v => {
                    verseMap.set(v.verse, v.text);
                });
                chapterMap.set(chap.chapter, verseMap);
            });
            // Use the canonical name as the key in the top-level map
            bibleLookupMap.set(normalizeBookNameForText(book.name), chapterMap);
        });
        console.timeEnd("Preprocess Bible Text");
        console.log("Bible data loaded and pre-processed for lookup.");
        // --- End Refactor Target 1 ---

        return bibleDataCache; // Still return raw data for now (or return the map if preferred)
    } catch (error) { console.error("Error loading/processing Bible data:", error); throw new Error("Failed to load Bible data."); }
};

export const loadAllReferences = () => {
    if (referencesCache) return referencesCache; // Return cached raw data
    try {
        if (!Array.isArray(allReferencesRaw)) throw new Error("references.json is not valid array.");
        referencesCache = allReferencesRaw; // Store raw links

        // --- REFACTOR TARGET 2: Pre-process for Connection Filtering ---
        console.time("Preprocess References");
        referencesLookupMap = new Map(); // Example: Map<SourcePrefix (e.g., Genesis1v), Link[]>
        referencesCache.forEach(link => {
            if (!link || !link.source) return;
            // TODO: Determine the correct prefix based on link.source structure
            // Example assumes BookChv format for keys
            const parsedSource = parseReferenceId(link.source);
            if(parsedSource && parsedSource.verse !== null) {
                const prefix = `${normalizeBookNameForId(parsedSource.book)}${parsedSource.chapter}v`;
                 if (!referencesLookupMap.has(prefix)) {
                    referencesLookupMap.set(prefix, []);
                }
                referencesLookupMap.get(prefix).push(link);
            }
            // Add alternative prefix handling if needed (e.g., dot notation)
        });
        console.timeEnd("Preprocess References");
        console.log(`Loaded and pre-processed ${referencesCache.length} references.`);
        // --- End Refactor Target 2 ---

        return referencesCache; // Return raw links for now (getConnectionsFor will use the map)
    } catch (error) { console.error("Error loading/processing references data:", error); throw new Error("Failed to load references data."); }
};


// --- Metadata Functions (using cached raw data) ---
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


// --- Optimized Text Retrieval ---
export const getTextForReference = (bibleData, referenceId) => { // bibleData prop might become unused if map is reliable
    if (!bibleLookupMap) return "Bible data not pre-processed."; // Check if map exists
    if (!referenceId) return "Select node...";

    const parsedRef = parseReferenceId(referenceId);
    if (!parsedRef) return `Invalid ID: ${referenceId}`;

    const normalizedBookName = normalizeBookNameForText(parsedRef.book); // Use Text normalization

    try {
        const chapterMap = bibleLookupMap.get(normalizedBookName);
        if (!chapterMap) return `Book not found [Map]: ${normalizedBookName}`;

        const verseMapOrChapterData = chapterMap.get(parsedRef.chapter);
         if (!verseMapOrChapterData) return `Chapter not found [Map]: ${normalizedBookName} ${parsedRef.chapter}`;

        if (parsedRef.verse !== null) {
            // Verse lookup
             if (!(verseMapOrChapterData instanceof Map)) return `Data structure error for chapter ${parsedRef.chapter}`; // Should be a Map
            const text = verseMapOrChapterData.get(parsedRef.verse);
            return text ? `${normalizedBookName} ${parsedRef.chapter}:${parsedRef.verse}\n${text.trim()}` : `Verse not found [Map]: ${referenceId}`;
        } else {
             // Chapter lookup (reconstruct from verse map)
             if (!(verseMapOrChapterData instanceof Map)) return `Data structure error for chapter ${parsedRef.chapter}`;
             const chapterHeader = `${normalizedBookName} ${parsedRef.chapter}\n--------------------\n`;
             // Sort verses numerically before joining
             const versesText = Array.from(verseMapOrChapterData.entries())
                 .sort(([vA], [vB]) => vA - vB)
                 .map(([vNum, vText]) => `${vNum} ${vText.trim()}`)
                 .join('\n\n');
             return chapterHeader + versesText;
        }
    } catch(error) {
         console.error("Error during optimized text lookup:", error);
         return `Error looking up text for ${referenceId}`;
    }
};


// --- Optimized Connection Filtering ---
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => { // allLinks prop might become unused
    if (!referencesLookupMap) return { nodes: [], links: []}; // Check if map exists
    if (!selectedBook || !selectedChapter) return null;

    const normalizedBookForFiltering = normalizeBookNameForId(selectedBook);
    // TODO: Ensure this prefix calculation matches the keys used when building referencesLookupMap
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`;

    // console.log(`Filtering connections using optimized map for prefix: '${sourcePrefix}'`);

    // --- REFACTOR TARGET 3: Use Optimized Map for Filtering ---
    const originLinks = referencesLookupMap.get(sourcePrefix) || []; // Get links directly from map O(1) average
    // --- End Refactor Target 3 ---

    // console.log(`Found ${originLinks.length} origin links from map.`);
    if (originLinks.length === 0) return { nodes: [], links: [] };

    // (Rest of the logic remains the same as MVP v5.0 - derive nodes, set value=1, sort nodes)
    // ... ensureNode helper, viewMode logic (chapter vs verse), node sorting ...
    let finalNodes = [];
    let finalLinks = [];
    const nodeMap = new Map();
    const ensureNode = (id) => { /* ... */
         if (!id || nodeMap.has(id)) return; const parsed = parseReferenceId(id);
        if (!parsed) { nodeMap.set(id, { id: id, label: id, book: 'Unknown' }); return; }
        const bookNameKey = normalizeBookNameForId(parsed.book);
        const bookNameLabel = normalizeBookNameForText(parsed.book);
        let label = parsed.verse !== null ? `${bookNameLabel} ${parsed.chapter}:${parsed.verse}` : `${bookNameLabel} ${parsed.chapter}`;
        nodeMap.set(id, { id: id, label: label, book: bookNameKey });
    };

     if (viewMode === 'chapter') { /* Aggregate using originLinks */
         const chapterLinksAggregated = new Map();
         const sourceChapterId = `${normalizedBookForFiltering}${selectedChapter}`;
         ensureNode(sourceChapterId);
         originLinks.forEach(link => { /* ... aggregation logic ... */
              const targetParsed = parseReferenceId(link.target);
             if (targetParsed) {
                  const targetBookNormalized = normalizeBookNameForId(targetParsed.book);
                  const targetChapterId = `${targetBookNormalized}${targetParsed.chapter}`;
                  ensureNode(targetChapterId);
                  const key = `${sourceChapterId}->${targetChapterId}`;
                  if (!chapterLinksAggregated.has(key)) chapterLinksAggregated.set(key, { source: sourceChapterId, target: targetChapterId, value: 0 });
                  chapterLinksAggregated.get(key).value += 1;
             }
         });
         finalLinks = Array.from(chapterLinksAggregated.values());
     } else { /* Verse view */
         finalLinks = originLinks.map(link => ({ ...link, value: 1 }));
         finalLinks.forEach(link => { ensureNode(link.source); ensureNode(link.target); });
     }

    finalNodes = Array.from(nodeMap.values());
    finalNodes.sort((a, b) => { /* ... canonical sort logic ... */
        const indexA = getBookSortIndex(a.book); const indexB = getBookSortIndex(b.book);
        if (indexA !== indexB) return indexA - indexB;
        const parsedA = parseReferenceId(a.id); const parsedB = parseReferenceId(b.id);
        if (parsedA && parsedB) {
            if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter;
            const verseA = parsedA.verse === null ? 0 : parsedA.verse; const verseB = parsedB.verse === null ? 0 : parsedB.verse;
            if (verseA !== verseB) return verseA - verseB;
        } return a.id.localeCompare(b.id);
     });

    return { nodes: finalNodes, links: finalLinks };
};