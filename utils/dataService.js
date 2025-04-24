// utils/dataService.js (MVP v8.2 - Add Debug Logs for Reference Map)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

// --- Module-level Caches ---
let bibleDataCache = null;
let referencesCache = null;
let bibleLookupMap = null;
let referencesLookupMap = null;
let isBibleProcessed = false;
let isReferencesProcessed = false; // Flag to prevent reprocessing

// --- Parsing and Normalization Functions ---
export const parseReferenceId = (referenceId) => {
    if (!referenceId) return null; const cleanedId = referenceId.trim();
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i; const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i; const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex);
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }
    // console.warn(`Could not parse reference ID: ${referenceId}`); // Keep commented unless debugging parsing
    return null;
};
export const normalizeBookNameForText = (inputName) => { /* ... comprehensive map ... */
    if (!inputName) return ''; const cleanedName = inputName.trim(); const lowerCaseCleaned = cleanedName.toLowerCase();
    const map = { 'gen': 'Genesis', 'exo': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deut': 'Deuteronomy','josh': 'Joshua', 'judg': 'Judges', 'ruth': 'Ruth','1sam': '1 Samuel', '1 samuel': '1 Samuel', '1sa': '1 Samuel','2sam': '2 Samuel', '2 samuel': '2 Samuel', '2sa': '2 Samuel','1kgs': '1 Kings', '1 kings': '1 Kings','2kgs': '2 Kings', '2 kings': '2 Kings','1chr': '1 Chronicles', '1 chronicles': '1 Chronicles', '1ch': '1 Chronicles','2chr': '2 Chronicles', '2 chronicles': '2 Chronicles', '2ch': '2 Chronicles','ezra': 'Ezra', 'neh': 'Nehemiah', 'est': 'Esther', 'job': 'Job','ps': 'Psalms', 'psalm': 'Psalms', 'psa': 'Psalms','prov': 'Proverbs', 'eccl': 'Ecclesiastes','song': 'Song of Solomon', 'songofsolomon': 'Song of Solomon', 'song of solomon': 'Song of Solomon', 'sos': 'Song of Solomon','isa': 'Isaiah', 'jer': 'Jeremiah', 'lam': 'Lamentations', 'ezek': 'Ezekiel', 'dan': 'Daniel','hos': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obad': 'Obadiah', 'jonah': 'Jonah', 'mic': 'Micah','nah': 'Nahum', 'hab': 'Habakkuk', 'zeph': 'Zephaniah', 'hag': 'Haggai', 'zech': 'Zechariah', 'mal': 'Malachi','matt': 'Matthew', 'mark': 'Mark', 'mk': 'Mark', 'luke': 'Luke', 'lk': 'Luke', 'john': 'John', 'jn': 'John','acts': 'Acts', 'rom': 'Romans','1cor': '1 Corinthians', '1 corinthians': '1 Corinthians','2cor': '2 Corinthians', '2 corinthians': '2 Corinthians','gal': 'Galatians', 'eph': 'Ephesians','phil': 'Philippians', 'col': 'Colossians','1thess': '1 Thessalonians', '1 thessalonians': '1 Thessalonians', '1th': '1 Thessalonians','2thess': '2 Thessalonians', '2 thessalonians': '2 Thessalonians', '2th': '2 Thessalonians','1tim': '1 Timothy', '1 timothy': '1 Timothy','2tim': '2 Timothy', '2 timothy': '2 Timothy','titus': 'Titus', 'phlm': 'Philemon', 'heb': 'Hebrews', 'jas': 'James','1pet': '1 Peter', '1 peter': '1 Peter','2pet': '2 Peter', '2 peter': '2 Peter','1jn': '1 John', '1john': '1 John', '1 john': '1 John','2jn': '2 John', '2john': '2 John', '2 john': '2 John','3jn': '3 John', '3john': '3 John', '3 john': '3 John','jude': 'Jude','rev': 'Revelation of John', 'revelation': 'Revelation of John'};
    const mappedName = map[lowerCaseCleaned]; if (mappedName) return mappedName;
    for (const key in map) { if (lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) { return map[key]; } }
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};
export const normalizeBookNameForId = (inputName) => { /* ... comprehensive map ... */
     if (!inputName) return 'Unknown'; const cleanedName = inputName.replace(/[\s.]/g, '').toLowerCase();
     const map = { 'genesis': 'Genesis', 'exodus': 'Exodus', '1samuel':'1 Samuel', 'songofsolomon':'Song of Solomon', /* ... */ 'revelation':'Revelation of John' };
     const normalized = map[cleanedName]; return normalized || normalizeBookNameForText(inputName) || inputName;
};
export const getNodeMetadata = (nodeId) => { /* ... */ }; // As before


// --- Loading Functions with Pre-processing ---
export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache;
    console.time("Load/Preprocess Bible Text"); try { bibleDataCache = bibleDataRaw; if (!isBibleProcessed) { bibleLookupMap = new Map(); bibleDataCache.books.forEach(book => { const chapterMap = new Map(); const canonicalBookName = normalizeBookNameForText(book.name); book.chapters.forEach(chap => { const verseMap = new Map(); chap.verses.forEach(v => { verseMap.set(v.verse, v.text); }); chapterMap.set(chap.chapter, verseMap); }); bibleLookupMap.set(canonicalBookName, chapterMap); }); isBibleProcessed = true; console.log("Bible lookup map created."); } console.timeEnd("Load/Preprocess Bible Text"); return bibleDataCache; } catch (error) { console.error("Error loading/processing Bible data:", error); isBibleProcessed = false; throw new Error("Failed to load Bible data."); }
};

export const loadAllReferences = () => {
    if (referencesCache) return referencesCache;
     console.time("Load/Preprocess References");
    try {
        if (!Array.isArray(allReferencesRaw)) throw new Error("references.json not valid array.");
        referencesCache = allReferencesRaw;
        if (!isReferencesProcessed) {
            referencesLookupMap = new Map(); // Reset map
            let processedCount = 0; // Counter for successful processing
            referencesCache.forEach((link, index) => { // Add index for logging
                if (!link || !link.source) {
                    // console.warn(`Skipping link at index ${index}: Missing source`);
                    return;
                }
                const parsedSource = parseReferenceId(link.source);

                // --- DEBUG LOGGING ---
                // Uncomment these lines locally to diagnose prefix issues
                // if(index < 20 || index > referencesCache.length - 20 ) { // Log first/last 20
                //      console.log(`Processing link source [${index}]: '${link.source}'`);
                //      console.log(`  Parsed source:`, parsedSource);
                // }
                // --- END DEBUG LOGGING ---

                if(parsedSource && parsedSource.verse !== null) {
                    const bookNameForId = normalizeBookNameForId(parsedSource.book);
                    if (bookNameForId === 'Unknown' || bookNameForId === parsedSource.book) {
                         // console.warn(`Normalization might have failed for book: '${parsedSource.book}' in source: ${link.source}`);
                    }
                    // --- Prefix based on BookChv ---
                    const prefix = `${bookNameForId}${parsedSource.chapter}v`;
                    // --- END Prefix ---

                    // --- DEBUG LOGGING ---
                    // if(index < 20 || index > referencesCache.length - 20 ) {
                    //      console.log(`  Normalized Book For ID: '${bookNameForId}'`);
                    //      console.log(`  Calculated Prefix: '${prefix}'`);
                    // }
                    // --- END DEBUG LOGGING ---

                    if (!referencesLookupMap.has(prefix)) {
                        referencesLookupMap.set(prefix, []);
                    }
                    referencesLookupMap.get(prefix).push(link);
                    processedCount++;
                    // --- DEBUG LOGGING ---
                    // if (referencesLookupMap.get(prefix).length === 1 && processedCount < 20) {
                    //     console.log(`  --> Added FIRST link for prefix ${prefix}`);
                    // }
                    // --- END DEBUG LOGGING ---
                } else {
                     // Log if parsing failed for this specific link source
                     // console.warn(`Skipping link at index ${index} due to parse failure or non-verse source: ${link.source}`);
                }
            });
            isReferencesProcessed = true; // Mark as processed
            console.log(`References lookup map populated with ${referencesLookupMap.size} prefixes. Processed ${processedCount} links.`); // Log count
        }
        console.timeEnd("Load/Preprocess References");
        return referencesCache;
    } catch (error) { console.error("Error loading/processing references data:", error); isReferencesProcessed = false; throw new Error("Failed to load references data."); }
};

// --- Metadata Functions ---
export const getBooks = (bibleData) => { /* ... As before ... */ };
export const getChapters = (bibleData, bookName) => { /* ... As before ... */ };
export const getVersesForChapter = (bibleData, bookName, chapterNum) => { /* ... As before ... */ };


// --- Optimized Text Retrieval ---
export const getTextForReference = (bibleData, referenceId) => { /* ... As before ... */ };

// --- Optimized Connection Filtering ---
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => {
     if (!referencesLookupMap) { loadAllReferences(); } // Ensure map is built
     if (!referencesLookupMap) { console.warn("Ref lookup map not ready in getConnectionsFor"); return { nodes: [], links: [] }; }
     if (!selectedBook || !selectedChapter) return null;

    // Ensure using ID normalization for the key lookup
    const normalizedBookForFiltering = normalizeBookNameForId(selectedBook);
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`;

    // console.log(`Filtering connections using optimized map for prefix: '${sourcePrefix}'`);
    // --- Use Optimized Map for Filtering ---
    const originLinks = referencesLookupMap.get(sourcePrefix) || [];

    if (originLinks.length === 0) {
        // console.log(`No connections found for prefix ${sourcePrefix}`);
        return { nodes: [], links: [] };
    }

    // --- (Aggregation/Node Derivation/Sorting logic - unchanged from v8.1) ---
    let finalNodes = []; let finalLinks = []; const nodeMap = new Map();
    const ensureNode = (id) => { if (!id || nodeMap.has(id)) return; const parsed = parseReferenceId(id); if (!parsed) { nodeMap.set(id, { id: id, label: id, book: 'Unknown' }); return; } const bookNameKey = normalizeBookNameForId(parsed.book); const bookNameLabel = normalizeBookNameForText(parsed.book); let label = parsed.verse !== null ? `${bookNameLabel} ${parsed.chapter}:${parsed.verse}` : `${bookNameLabel} ${parsed.chapter}`; nodeMap.set(id, { id: id, label: label, book: bookNameKey }); };
     if (viewMode === 'chapter') { const chapterLinksAggregated = new Map(); const sourceChapterId = `${normalizedBookForFiltering}${selectedChapter}`; ensureNode(sourceChapterId); originLinks.forEach(link => { const targetParsed = parseReferenceId(link.target); if (targetParsed) { const targetBookNormalized = normalizeBookNameForId(targetParsed.book); const targetChapterId = `${targetBookNormalized}${targetParsed.chapter}`; ensureNode(targetChapterId); const key = `${sourceChapterId}->${targetChapterId}`; if (!chapterLinksAggregated.has(key)) chapterLinksAggregated.set(key, { source: sourceChapterId, target: targetChapterId, value: 0 }); chapterLinksAggregated.get(key).value += 1; } }); finalLinks = Array.from(chapterLinksAggregated.values()); } else { finalLinks = originLinks.map(link => ({ ...link, value: 1 })); finalLinks.forEach(link => { ensureNode(link.source); ensureNode(link.target); }); }
    finalNodes = Array.from(nodeMap.values());
    finalNodes.sort((a, b) => { const indexA = getBookSortIndex(a.book); const indexB = getBookSortIndex(b.book); if (indexA !== indexB) return indexA - indexB; const parsedA = parseReferenceId(a.id); const parsedB = parseReferenceId(b.id); if (parsedA && parsedB) { if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter; const verseA = parsedA.verse === null ? 0 : parsedA.verse; const verseB = parsedB.verse === null ? 0 : parsedB.verse; if (verseA !== verseB) return verseA - verseB; } return a.id.localeCompare(b.id); });
    return { nodes: finalNodes, links: finalLinks };
};