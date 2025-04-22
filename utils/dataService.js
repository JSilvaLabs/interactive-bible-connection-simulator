// utils/dataService.js (MVP v7.0 Update - Robust Normalization)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

// --- Module-level Caches ---
let bibleDataCache = null;
let referencesCache = null;
let bibleLookupMap = null;
let referencesLookupMap = null;

// --- Parsing and Normalization Functions ---

// Parses reference IDs (Handles BookChvVs, BookCh, Book.Ch.Vs) - EXPORTED
export const parseReferenceId = (referenceId) => {
    // ... (Keep implementation from v6.1) ...
    if (!referenceId) return null; const cleanedId = referenceId.trim();
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i; const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i; const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex);
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }
    console.warn(`Could not parse reference ID: ${referenceId}`);
    return null;
};

// Normalizes book names for display or matching BSB.json keys
// CRITICAL: Values MUST match names in BSB.json and canonicalOrder.js EXACTLY
const normalizeBookNameForText = (inputName) => {
    if (!inputName) return '';
    const cleanedName = inputName.trim();
    const lowerCaseCleaned = cleanedName.toLowerCase();
    // Comprehensive map covering known abbreviations, variations, and number prefixes
    const map = {
        'gen': 'Genesis', 'exod': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deut': 'Deuteronomy',
        'josh': 'Joshua', 'judg': 'Judges', 'ruth': 'Ruth',
        '1sam': '1 Samuel', '1 samuel': '1 Samuel', '1 sa': '1 Samuel', // Add more variants if needed
        '2sam': '2 Samuel', '2 samuel': '2 Samuel', '2 sa': '2 Samuel',
        '1kgs': '1 Kings', '1 kings': '1 Kings',
        '2kgs': '2 Kings', '2 kings': '2 Kings',
        '1chr': '1 Chronicles', '1 chronicles': '1 Chronicles', '1 ch': '1 Chronicles',
        '2chr': '2 Chronicles', '2 chronicles': '2 Chronicles', '2 ch': '2 Chronicles',
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
        '1thess': '1 Thessalonians', '1 thessalonians': '1 Thessalonians', '1 th': '1 Thessalonians',
        '2thess': '2 Thessalonians', '2 thessalonians': '2 Thessalonians', '2 th': '2 Thessalonians',
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
    // Check map first - allows overriding default capitalization if needed
    const mappedName = map[lowerCaseCleaned];
    if (mappedName) return mappedName;

    // Fallback: Capitalize first letter of each word if no map entry found
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};

// Normalizes book names from IDs (e.g., "1Chronicles") to canonical name ("1 Chronicles").
// EXPORTED
export const normalizeBookNameForId = (inputName) => {
    if (!inputName) return 'Unknown';
    // Assume IDs use concatenated format primarily - remove spaces/dots and lowercase
    const cleanedName = inputName.replace(/[\s.]/g, '').toLowerCase();
    // CRITICAL: Keys match variants found in references.json IDs
    // Values MUST match names in canonicalOrder.js EXACTLY
    const map = {
        'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus', 'numbers':'Numbers', 'deuteronomy':'Deuteronomy',
        'joshua':'Joshua', 'judges':'Judges', 'ruth':'Ruth','1samuel':'1 Samuel', '2samuel':'2 Samuel',
        '1kings':'1 Kings', '2kings':'2 Kings','1chronicles':'1 Chronicles','2chronicles':'2 Chronicles','ezra':'Ezra',
        'nehemiah':'Nehemiah','esther':'Esther','job':'Job','psalms':'Psalms','proverbs':'Proverbs',
        'ecclesiastes':'Ecclesiastes','songofsolomon':'Song of Solomon',
        'isaiah':'Isaiah','jeremiah':'Jeremiah','lamentations':'Lamentations','ezekiel':'Ezekiel','daniel':'Daniel',
        'hosea':'Hosea','joel':'Joel','amos':'Amos','obadiah':'Obadiah','jonah':'Jonah','micah':'Micah',
        'nahum':'Nahum','habakkuk':'Habakkuk','zephaniah':'Zephaniah','haggai':'Haggai','zechariah':'Zechariah','malachi':'Malachi',
        'matthew':'Matthew','mark':'Mark','luke':'Luke','john':'John',
        'acts':'Acts','romans':'Romans',
        '1corinthians':'1 Corinthians','2corinthians':'2 Corinthians','galatians':'Galatians','ephesians':'Ephesians',
        'philippians':'Philippians','colossians':'Colossians','1thessalonians':'1 Thessalonians','2thessalonians':'2 Thessalonians',
        '1timothy':'1 Timothy','2timothy':'2 Timothy','titus':'Titus','philemon':'Philemon','hebrews':'Hebrews','james':'James',
        '1peter':'1 Peter','2peter':'2 Peter',
        '1john':'1 John','2john':'2 John','3john':'3 John','jude':'Jude',
        'revelation':'Revelation of John'
    };
     const normalized = map[cleanedName];
     if (!normalized) {
         // If no map match, try the text normalizer as a fallback
         const fallback = normalizeBookNameForText(inputName);
         // Ensure fallback still matches a canonical name if possible
         if (BIBLE_BOOK_ORDER_MAP.has(fallback)) {
            // console.warn(`ID Normalization using fallback for: ${inputName} -> ${fallback}`);
             return fallback;
         }
         // console.warn(`ID Normalization failed for: ${inputName}`);
         return inputName; // Return original if all else fails
     }
     return normalized;
};


// --- Loading Functions ---
// (loadBibleText and loadAllReferences remain the same - they perform internal caching/preprocessing)
export const loadBibleText = () => { /* ... Same as v6.0 ... */
    if (bibleDataCache) return bibleDataCache; console.time("Load/Preprocess Bible Text"); try { bibleDataCache = bibleDataRaw; if (!bibleLookupMap) { bibleLookupMap = new Map(); bibleDataCache.books.forEach(book => { const chapterMap = new Map(); const canonicalBookName = normalizeBookNameForText(book.name); book.chapters.forEach(chap => { const verseMap = new Map(); chap.verses.forEach(v => { verseMap.set(v.verse, v.text); }); chapterMap.set(chap.chapter, verseMap); }); bibleLookupMap.set(canonicalBookName, chapterMap); }); console.log("Bible lookup map created."); } console.timeEnd("Load/Preprocess Bible Text"); return bibleDataCache; } catch (error) { console.error("Error loading/processing Bible data:", error); throw new Error("Failed to load Bible data."); }
};
export const loadAllReferences = () => { /* ... Same as v6.0 ... */
    if (referencesCache) return referencesCache; console.time("Load/Preprocess References"); try { if (!Array.isArray(allReferencesRaw)) throw new Error("references.json not valid array."); referencesCache = allReferencesRaw; if (!referencesLookupMap) { referencesLookupMap = new Map(); referencesCache.forEach(link => { if (!link || !link.source) return; const parsedSource = parseReferenceId(link.source); if(parsedSource && parsedSource.verse !== null) { const prefix = `${normalizeBookNameForId(parsedSource.book)}${parsedSource.chapter}v`; if (!referencesLookupMap.has(prefix)) { referencesLookupMap.set(prefix, []); } referencesLookupMap.get(prefix).push(link); } }); console.log(`References lookup map created with ${referencesLookupMap.size} prefixes.`); } console.timeEnd("Load/Preprocess References"); return referencesCache; } catch (error) { console.error("Error loading/processing references data:", error); throw new Error("Failed to load references data."); }
};

// --- Metadata Functions ---
// Ensure correct normalization is used for sorting getBooks
export const getBooks = (bibleData) => {
    if (!bibleData || !bibleData.books) return [];
    // Map to canonical names FIRST, then sort using index lookup
    const canonicalNames = bibleData.books.map(b => normalizeBookNameForText(b.name));
    // Remove duplicates that might occur from normalization before sorting
    const uniqueCanonicalNames = [...new Set(canonicalNames)];
    return uniqueCanonicalNames.sort((a, b) => getBookSortIndex(a) - getBookSortIndex(b));
};
// Ensure correct normalization is used for chapter lookup
export const getChapters = (bibleData, bookName) => {
    if (!bibleData || !bookName || !bibleData.books) return [];
    const normalizedBook = normalizeBookNameForText(bookName); // Use text normalization to match bibleData keys
    const book = bibleData.books.find(b => normalizeBookNameForText(b.name) === normalizedBook);
    return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
};
// Ensure correct normalization is used for metadata display
export const getNodeMetadata = (nodeId) => {
     if (!nodeId) return null; const parsed = parseReferenceId(nodeId);
     if (!parsed) return { rawId: nodeId };
     return { book: normalizeBookNameForText(parsed.book), chapter: parsed.chapter, verse: parsed.verse };
};


// --- Optimized Text Retrieval ---
// (Function remains the same as v6.0, relies on correct normalization map keys)
export const getTextForReference = (bibleData, referenceId) => { /* ... Same as v6.0 ... */
     if (!bibleLookupMap) loadBibleText(); if (!bibleLookupMap) return "Bible data not available/processed."; if (!referenceId) return "Select node...";
    const parsedRef = parseReferenceId(referenceId); if (!parsedRef) return `Invalid ID: ${referenceId}`; const normalizedBookName = normalizeBookNameForText(parsedRef.book);
    try { const chapterMap = bibleLookupMap.get(normalizedBookName); if (!chapterMap) return `Book not found [Map]: ${normalizedBookName}`; const verseMap = chapterMap.get(parsedRef.chapter); if (!verseMap) return `Chapter not found [Map]: ${normalizedBookName} ${parsedRef.chapter}`; if (parsedRef.verse !== null) { const text = verseMap.get(parsedRef.verse); return text ? `${normalizedBookName} ${parsedRef.chapter}:${parsedRef.verse}\n${text.trim()}` : `Verse not found [Map]: ${referenceId}`; } else { const chapterHeader = `${normalizedBookName} ${parsedRef.chapter}\n--------------------\n`; const versesText = Array.from(verseMap.entries()).sort(([vA], [vB]) => vA - vB).map(([vNum, vText]) => `${vNum} ${vText.trim()}`).join('\n\n'); return chapterHeader + versesText; } } catch(error) { console.error(`Error in getTextForReference for ${referenceId}:`, error); return `Error looking up text.`; }
};

// --- Optimized Connection Filtering ---
// Ensure consistent use of updated/verified normalization functions
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => {
     if (!referencesLookupMap) { loadAllReferences(); } if (!referencesLookupMap) return { nodes: [], links: [] };
     if (!selectedBook || !selectedChapter) return null;

    // Use ID normalization to build the prefix key for the lookup map
    const normalizedBookForFiltering = normalizeBookNameForId(selectedBook); // e.g., "1 Samuel" -> "1Samuel"
    // Prefix MUST match how keys were created in loadAllReferences
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`; // e.g., "1Samuel16v"

    // --- Use Optimized Map for Filtering ---
    const originLinks = referencesLookupMap.get(sourcePrefix) || [];

    if (originLinks.length === 0) return { nodes: [], links: [] };

    // --- (Aggregation/Node Derivation/Sorting logic - MUST use consistent normalization) ---
    let finalNodes = []; let finalLinks = []; const nodeMap = new Map();
    const ensureNode = (id) => {
        if (!id || nodeMap.has(id)) return; const parsed = parseReferenceId(id);
        if (!parsed) { nodeMap.set(id, { id: id, label: id, book: 'Unknown' }); return; }
        // Use ID norm for 'book' (sorting key), Text norm for 'label' (display)
        const bookNameKey = normalizeBookNameForId(parsed.book); // Get CANONICAL name (e.g., "1 Samuel")
        const bookNameLabel = normalizeBookNameForText(parsed.book); // Get DISPLAY name (e.g., "1 Samuel")
        let label = parsed.verse !== null ? `${bookNameLabel} ${parsed.chapter}:${parsed.verse}` : `${bookNameLabel} ${parsed.chapter}`;
        nodeMap.set(id, { id: id, label: label, book: bookNameKey }); // Store CANONICAL name in book field
    };

     if (viewMode === 'chapter') { /* Aggregate originLinks */
         const chapterLinksAggregated = new Map();
         const sourceChapterId = `${normalizedBookForFiltering}${selectedChapter}`; // e.g., "1Samuel16"
         ensureNode(sourceChapterId); // Ensure source chapter node added
         originLinks.forEach(link => {
             const targetParsed = parseReferenceId(link.target);
             if (targetParsed) {
                 const targetBookNormalized = normalizeBookNameForId(targetParsed.book); // Canonical name
                 const targetChapterId = `${targetBookNormalized}${targetParsed.chapter}`; // e.g., "Luke1"
                 ensureNode(targetChapterId); // Ensure target chapter node added
                 const key = `${sourceChapterId}->${targetChapterId}`;
                 if (!chapterLinksAggregated.has(key)) chapterLinksAggregated.set(key, { source: sourceChapterId, target: targetChapterId, value: 0 });
                 chapterLinksAggregated.get(key).value += 1; // Count connections
             }
         });
         finalLinks = Array.from(chapterLinksAggregated.values());
     } else { /* Verse view */
         finalLinks = originLinks.map(link => ({ ...link, value: 1 })); // Value is 1
         finalLinks.forEach(link => { ensureNode(link.source); ensureNode(link.target); });
     }

    finalNodes = Array.from(nodeMap.values());
    // Sort nodes canonically using the 'book' property (which is now canonical name)
    finalNodes.sort((a, b) => {
        const indexA = getBookSortIndex(a.book); const indexB = getBookSortIndex(b.book);
        if (indexA !== indexB) return indexA - indexB;
        // Secondary sort by chapter/verse using the parsed ID
        const parsedA = parseReferenceId(a.id); const parsedB = parseReferenceId(b.id);
        if (parsedA && parsedB) {
            if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter;
            const verseA = parsedA.verse === null ? 0 : parsedA.verse; const verseB = parsedB.verse === null ? 0 : parsedB.verse;
            if (verseA !== verseB) return verseA - verseB;
        } return a.id.localeCompare(b.id); // Fallback
     });

    return { nodes: finalNodes, links: finalLinks };
};