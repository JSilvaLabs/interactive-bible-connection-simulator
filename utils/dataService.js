// utils/dataService.js (MVP v8.2 - Added Debug Logging to getBooks)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder.js';

// --- Module-level Caches ---
let bibleDataCache = null;
let referencesCache = null;
let bibleLookupMap = null;
let referencesLookupMap = null;
let isBibleProcessed = false;
let isReferencesProcessed = false;

// --- Parsing and Normalization Functions ---

// EXPORTED
export const parseReferenceId = (referenceId) => {
    if (!referenceId) return null; const cleanedId = referenceId.trim();
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i; const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i; const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex);
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }
    // console.warn(`Could not parse reference ID: ${referenceId}`); // Keep commented unless debugging parsing
    return null;
};

// EXPORTED (Used internally and potentially by other modules)
export const normalizeBookNameForText = (inputName) => {
    if (!inputName) return '';
    const cleanedName = inputName.trim();
    const lowerCaseCleaned = cleanedName.toLowerCase();
    // Comprehensive map - keys cover variants, values match canonicalOrder.js/BSB.json
    const map = {
        'gen': 'Genesis', 'exo': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deut': 'Deuteronomy',
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
    // Check map first
    const mappedName = map[lowerCaseCleaned];
    if (mappedName) return mappedName;

    // Check multi-word variations that might not be in map keys directly
     for (const key in map) {
        if (lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) { return map[key]; }
     }
    // Fallback: Capitalize first letter of each word if no map entry found
    // console.warn(`[normalizeBookNameForText] No specific map found for: '${inputName}', falling back to Title Case.`);
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};

// EXPORTED
export const normalizeBookNameForId = (inputName) => {
     if (!inputName) return 'Unknown'; const cleanedName = inputName.replace(/[\s.]/g, '').toLowerCase();
     // Values MUST match canonicalOrder.js names EXACTLY
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
        // console.warn(`[normalizeBookNameForId] No specific map found for ID: '${inputName}', attempting text norm fallback.`);
         // Fallback if mapping fails: use text normalizer on original input
         const textNormalized = normalizeBookNameForText(inputName);
         // Check if the text-normalized version IS a canonical name
         if (BIBLE_BOOK_ORDER_MAP.has(textNormalized)) {
             return textNormalized;
         }
         console.warn(`[normalizeBookNameForId] Final fallback for ID: '${inputName}' -> '${textNormalized}' (Check if canonical)`);
         return textNormalized; // Return text-normalized version even if not perfectly canonical
     }
     return normalized;
};

// EXPORTED
export const getNodeMetadata = (nodeId) => {
     if (!nodeId) return null; const parsed = parseReferenceId(nodeId);
     if (!parsed) return { rawId: nodeId };
     return { book: normalizeBookNameForText(parsed.book), chapter: parsed.chapter, verse: parsed.verse };
};


// --- Loading Functions with Pre-processing ---
export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache;
    // console.time("Load/Preprocess Bible Text");
    try {
        bibleDataCache = bibleDataRaw;
        if (!isBibleProcessed) {
            bibleLookupMap = new Map();
            bibleDataCache.books.forEach(book => {
                const chapterMap = new Map();
                const canonicalBookName = normalizeBookNameForText(book.name);
                if (!BIBLE_BOOK_ORDER_MAP.has(canonicalBookName)) {
                    console.warn(`[loadBibleText] Book name from BSB.json "${book.name}" (normalized to "${canonicalBookName}") not found in canonicalOrder.js map!`);
                }
                book.chapters.forEach(chap => {
                    const verseMap = new Map();
                    chap.verses.forEach(v => { verseMap.set(v.verse, v.text); });
                    chapterMap.set(chap.chapter, verseMap);
                });
                bibleLookupMap.set(canonicalBookName, chapterMap);
            });
            isBibleProcessed = true;
            // console.log("Bible lookup map populated.");
        }
        // console.timeEnd("Load/Preprocess Bible Text");
        return bibleDataCache;
    } catch (error) { console.error("Error loading/processing Bible data:", error); isBibleProcessed = false; throw new Error("Failed to load Bible data."); }
};

export const loadAllReferences = () => {
    if (referencesCache) return referencesCache;
    // console.time("Load/Preprocess References");
    try {
        if (!Array.isArray(allReferencesRaw)) throw new Error("references.json not valid array.");
        referencesCache = allReferencesRaw;
        if (!isReferencesProcessed) {
            referencesLookupMap = new Map();
            referencesCache.forEach(link => {
                if (!link || !link.source) return;
                const parsedSource = parseReferenceId(link.source);
                if(parsedSource && parsedSource.verse !== null) {
                    const bookNameKey = normalizeBookNameForId(parsedSource.book); // Use ID normalizer -> canonical name
                    if (!BIBLE_BOOK_ORDER_MAP.has(bookNameKey)) {
                         console.warn(`[loadAllReferences] Source reference "${link.source}" uses book "${parsedSource.book}" which normalized to "${bookNameKey}" - not found in canonical map!`);
                    }
                    const prefix = `${bookNameKey}${parsedSource.chapter}v`; // Prefix uses CANONICAL name
                    if (!referencesLookupMap.has(prefix)) { referencesLookupMap.set(prefix, []); }
                    referencesLookupMap.get(prefix).push(link);
                }
            });
            isReferencesProcessed = true;
            // console.log(`References lookup map populated with ${referencesLookupMap.size} prefixes.`);
        }
        // console.timeEnd("Load/Preprocess References");
        return referencesCache;
    } catch (error) { console.error("Error loading/processing references data:", error); isReferencesProcessed = false; throw new Error("Failed to load references data."); }
};

// --- Metadata Functions ---
// EXPORTED - Added detailed logging
export const getBooks = (bibleData) => {
    const logPrefix = "[getBooks]";
    console.log(`${logPrefix} Called. bibleData valid: ${!!bibleData?.books}`);
    if (!bibleData || !bibleData.books || bibleData.books.length === 0) {
         console.error(`${logPrefix} Received invalid or empty bibleData.books`);
         return [];
    }
    try {
        // Extract raw names first
        const rawBookNames = bibleData.books.map(b => b.name);
        console.log(`${logPrefix} Raw book names from data (first 10):`, rawBookNames.slice(0, 10));

        // Normalize using the text normalizer (should map to canonical names)
        const canonicalNames = rawBookNames.map(name => normalizeBookNameForText(name));
        console.log(`${logPrefix} Normalized canonical names (first 10):`, canonicalNames.slice(0, 10));

        // Filter out potential duplicates after normalization
        const uniqueCanonicalNames = [...new Set(canonicalNames)];
        console.log(`${logPrefix} Unique canonical names count: ${uniqueCanonicalNames.length} (Original raw: ${rawBookNames.length})`);

        // Sort using the canonical index lookup helper
        const sortedNames = uniqueCanonicalNames.sort((a, b) => {
            const indexA = getBookSortIndex(a); // Expects canonical name
            const indexB = getBookSortIndex(b);
            // Log warnings for names that don't map to a sort index
            if (indexA === 999 && a !== 'Unknown') console.warn(`${logPrefix} Sort index not found for normalized name: '${a}'`);
            if (indexB === 999 && b !== 'Unknown') console.warn(`${logPrefix} Sort index not found for normalized name: '${b}'`);
            return indexA - indexB;
        });
        console.log(`${logPrefix} Returning sorted list (first 10):`, sortedNames.slice(0,10));
        return sortedNames;
    } catch (error) {
        console.error(`${logPrefix} Error during processing:`, error);
        return [];
    }
};

// EXPORTED
export const getChapters = (bibleData, bookName) => {
    if (!bibleData || !bookName || !bibleData.books) return [];
    const normalizedBook = normalizeBookNameForText(bookName); // Use text normalization for lookup key
    // Use lookup map if available, otherwise fallback
    if (bibleLookupMap) {
        const chapterMap = bibleLookupMap.get(normalizedBook);
        return chapterMap ? Array.from(chapterMap.keys()).sort((a,b) => a - b) : [];
    } else {
        const book = bibleData.books.find(b => normalizeBookNameForText(b.name) === normalizedBook);
        return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
    }
};

// EXPORTED
export const getVersesForChapter = (bibleData, bookName, chapterNum) => {
    if (!bibleLookupMap) { loadBibleText(); } // Ensure map is built
    if (!bibleLookupMap || !bookName || !chapterNum) return [];
    try {
        const canonicalBook = normalizeBookNameForText(bookName); // Use text norm for map key
        const chapterMap = bibleLookupMap.get(canonicalBook);
        const verseMap = chapterMap?.get(chapterNum);
        if (verseMap instanceof Map) {
            return Array.from(verseMap.keys()).sort((a, b) => a - b);
        }
    } catch (error) { console.error(`Error getting verses for ${bookName} ${chapterNum}:`, error); }
    return [];
};

// --- Optimized Text Retrieval ---
// EXPORTED
export const getTextForReference = (bibleData, referenceId) => { /* ... As before, uses bibleLookupMap ... */ };

// --- Optimized Connection Filtering ---
// EXPORTED
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => { /* ... As before, uses referencesLookupMap and sorts nodes ... */ };