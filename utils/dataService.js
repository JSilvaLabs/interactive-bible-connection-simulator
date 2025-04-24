// utils/dataService.js (MRP v1.0.3 - Optimized with Lookup Maps & Refined Normalization FINAL)
"use client"; // Keep client directive if needed by Next.js App Router

import bibleDataRaw from '@/data/BSB.json'; // Assuming final BSB data
import allReferencesRaw from '@/data/references.json'; // Assuming final references data
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder'; // Relies on final canonical order

// --- Module-level Caches & Lookup Maps ---
let bibleDataCache = null;        // Raw loaded data
let referencesCache = null;       // Raw loaded links
let bibleLookupMap = null;        // Optimized Map: Map<CanonBookName, Map<ChapterNum, Map<VerseNum, VerseText>>>
let referencesLookupMap = null;   // Optimized Map: Map<CanonSourcePrefix (e.g., Genesis1v), Link[]>
let isBibleProcessed = false;     // Flag to prevent reprocessing
let isReferencesProcessed = false; // Flag to prevent reprocessing

// --- Parsing and Normalization Functions ---

/**
 * Parses reference IDs from various common string formats (e.g., BookChvVs, BookCh, Book.Ch.Vs).
 * @param {string} referenceId - The reference string to parse.
 * @returns {{book: string, chapter: number, verse: number|null}|null} Parsed components or null if unparseable.
 */
export const parseReferenceId = (referenceId) => {
    if (!referenceId || typeof referenceId !== 'string') return null;
    const cleanedId = referenceId.trim();

    // Try dot format first (e.g., "1 John.3.16") - Handles books with spaces/numbers
    const dotRegex = /^([1-3]?[\s\w\.]+?)\.(\d+)\.(\d+)$/i; // Non-greedy book match
    const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) {
        return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) };
    }

    // Try concatenated format (e.g., "John3v16", "Genesis1") - Handles books with numbers
    const concatRegex = /^([1-3]?)([A-Za-z\s]+?)(\d+)(?:[v:\.](\d+))?$/i;
    const concatMatch = cleanedId.match(concatRegex);
    if (concatMatch) {
         const bookName = (concatMatch[1] ? concatMatch[1] + ' ' : '') + concatMatch[2].trim();
        return {
            book: bookName,
            chapter: parseInt(concatMatch[3], 10),
            verse: concatMatch[4] ? parseInt(concatMatch[4], 10) : null
        };
    }

    // console.warn(`[dataService] Could not parse reference ID format: ${referenceId}`);
    return null;
};

/**
 * Normalizes various book name inputs (abbreviations, different casings, numerals)
 * to the canonical book name format used in BSB.json keys and bibleLookupMap.
 * Critical for matching against the Bible text data structure.
 * @param {string} inputName - The book name string to normalize.
 * @returns {string} The normalized canonical book name (e.g., "1 Samuel", "Song of Solomon") or the input if no match.
 */
export const normalizeBookNameForText = (inputName) => {
    if (!inputName || typeof inputName !== 'string') return '';
    const cleanedName = inputName.trim().replace(/\s+/g, ' ');
    const lowerCaseCleaned = cleanedName.toLowerCase().replace(/[.:]/g, '');

    const map = {
        // Standard OT
        'genesis': 'Genesis', 'gen': 'Genesis',
        'exodus': 'Exodus', 'exo': 'Exodus', 'ex': 'Exodus',
        'leviticus': 'Leviticus', 'lev': 'Leviticus', 'lv': 'Leviticus',
        'numbers': 'Numbers', 'num': 'Numbers', 'nm': 'Numbers', 'nb': 'Numbers',
        'deuteronomy': 'Deuteronomy', 'deut': 'Deuteronomy', 'dt': 'Deuteronomy',
        'joshua': 'Joshua', 'josh': 'Joshua', 'jos': 'Joshua',
        'judges': 'Judges', 'judg': 'Judges', 'jdg': 'Judges', 'jg': 'Judges',
        'ruth': 'Ruth', 'ru': 'Ruth',
        '1 samuel': '1 Samuel', '1samuel': '1 Samuel', '1sam': '1 Samuel', '1 sm': '1 Samuel', 'i samuel': '1 Samuel', '1st samuel': '1 Samuel', 'first samuel': '1 Samuel',
        '2 samuel': '2 Samuel', '2samuel': '2 Samuel', '2sam': '2 Samuel', '2 sm': '2 Samuel', 'ii samuel': '2 Samuel', '2nd samuel': '2 Samuel', 'second samuel': '2 Samuel',
        '1 kings': '1 Kings', '1kings': '1 Kings', '1kgs': '1 Kings', '1 ki': '1 Kings', 'i kings': '1 Kings', '1st kings': '1 Kings', 'first kings': '1 Kings',
        '2 kings': '2 Kings', '2kings': '2 Kings', '2kgs': '2 Kings', '2 ki': '2 Kings', 'ii kings': '2 Kings', '2nd kings': '2 Kings', 'second kings': '2 Kings',
        '1 chronicles': '1 Chronicles', '1chronicles': '1 Chronicles', '1chr': '1 Chronicles', '1 ch': '1 Chronicles', 'i chronicles': '1 Chronicles', '1st chronicles': '1 Chronicles', 'first chronicles': '1 Chronicles',
        '2 chronicles': '2 Chronicles', '2chronicles': '2 Chronicles', '2chr': '2 Chronicles', '2 ch': '2 Chronicles', 'ii chronicles': '2 Chronicles', '2nd chronicles': '2 Chronicles', 'second chronicles': '2 Chronicles',
        'ezra': 'Ezra', 'ezr': 'Ezra',
        'nehemiah': 'Nehemiah', 'neh': 'Nehemiah',
        'esther': 'Esther', 'est': 'Esther', 'esth': 'Esther',
        'job': 'Job', 'jb': 'Job',
        'psalms': 'Psalms', 'psalm': 'Psalms', 'psa': 'Psalms', 'ps': 'Psalms',
        'proverbs': 'Proverbs', 'prov': 'Proverbs', 'pro': 'Proverbs', 'pr': 'Proverbs',
        'ecclesiastes': 'Ecclesiastes', 'eccl': 'Ecclesiastes', 'ec': 'Ecclesiastes', 'ecc': 'Ecclesiastes',
        'song of solomon': 'Song of Solomon', 'songofsolomon': 'Song of Solomon', 'song': 'Song of Solomon', 'sos': 'Song of Solomon', 'so': 'Song of Solomon', 'canticles': 'Song of Solomon', 'canticle of canticles': 'Song of Solomon',
        'isaiah': 'Isaiah', 'isa': 'Isaiah', 'is': 'Isaiah',
        'jeremiah': 'Jeremiah', 'jer': 'Jeremiah', 'je': 'Jeremiah',
        'lamentations': 'Lamentations', 'lam': 'Lamentations', 'la': 'Lamentations',
        'ezekiel': 'Ezekiel', 'ezek': 'Ezekiel', 'ezk': 'Ezekiel', 'eze': 'Ezekiel',
        'daniel': 'Daniel', 'dan': 'Daniel', 'da': 'Daniel', 'dn': 'Daniel',
        'hosea': 'Hosea', 'hos': 'Hosea', 'ho': 'Hosea',
        'joel': 'Joel', 'jl': 'Joel',
        'amos': 'Amos', 'am': 'Amos',
        'obadiah': 'Obadiah', 'obad': 'Obadiah', 'ob': 'Obadiah',
        'jonah': 'Jonah', 'jnh': 'Jonah', 'jon': 'Jonah',
        'micah': 'Micah', 'mic': 'Micah', 'mi': 'Micah',
        'nahum': 'Nahum', 'nah': 'Nahum', 'na': 'Nahum',
        'habakkuk': 'Habakkuk', 'hab': 'Habakkuk', 'hb': 'Habakkuk',
        'zephaniah': 'Zephaniah', 'zeph': 'Zephaniah', 'zep': 'Zephaniah', 'zp': 'Zephaniah',
        'haggai': 'Haggai', 'hag': 'Haggai', 'hg': 'Haggai',
        'zechariah': 'Zechariah', 'zech': 'Zechariah', 'zec': 'Zechariah', 'zc': 'Zechariah',
        'malachi': 'Malachi', 'mal': 'Malachi', 'ml': 'Malachi',
        // Standard NT
        'matthew': 'Matthew', 'matt': 'Matthew', 'mt': 'Matthew',
        'mark': 'Mark', 'mk': 'Mark', 'mrk': 'Mark',
        'luke': 'Luke', 'lk': 'Luke',
        'john': 'John', 'jn': 'John', 'jhn': 'John',
        'acts': 'Acts', 'act': 'Acts', 'ac': 'Acts',
        'romans': 'Romans', 'rom': 'Romans', 'ro': 'Romans', 'rm': 'Romans',
        '1 corinthians': '1 Corinthians', '1corinthians': '1 Corinthians', '1cor': '1 Corinthians', '1 co': '1 Corinthians', 'i corinthians': '1 Corinthians', '1st corinthians': '1 Corinthians', 'first corinthians': '1 Corinthians', '1 cor': '1 Corinthians',
        '2 corinthians': '2 Corinthians', '2corinthians': '2 Corinthians', '2cor': '2 Corinthians', '2 co': '2 Corinthians', 'ii corinthians': '2 Corinthians', '2nd corinthians': '2 Corinthians', 'second corinthians': '2 Corinthians',
        'galatians': 'Galatians', 'gal': 'Galatians', 'ga': 'Galatians',
        'ephesians': 'Ephesians', 'eph': 'Ephesians', 'ep': 'Ephesians',
        'philippians': 'Philippians', 'phil': 'Philippians', 'php': 'Philippians', 'pp': 'Philippians',
        'colossians': 'Colossians', 'col': 'Colossians', 'co': 'Colossians',
        '1 thessalonians': '1 Thessalonians', '1thessalonians': '1 Thessalonians', '1thess': '1 Thessalonians', '1 th': '1 Thessalonians', 'i thessalonians': '1 Thessalonians', '1st thessalonians': '1 Thessalonians', 'first thessalonians': '1 Thessalonians',
        '2 thessalonians': '2 Thessalonians', '2thessalonians': '2 Thessalonians', '2thess': '2 Thessalonians', '2 th': '2 Thessalonians', 'ii thessalonians': '2 Thessalonians', '2nd thessalonians': '2 Thessalonians', 'second thessalonians': '2 Thessalonians',
        '1 timothy': '1 Timothy', '1timothy': '1 Timothy', '1tim': '1 Timothy', '1 ti': '1 Timothy', 'i timothy': '1 Timothy', '1st timothy': '1 Timothy', 'first timothy': '1 Timothy',
        '2 timothy': '2 Timothy', '2timothy': '2 Timothy', '2tim': '2 Timothy', '2 ti': '2 Timothy', 'ii timothy': '2 Timothy', '2nd timothy': '2 Timothy', 'second timothy': '2 Timothy',
        'titus': 'Titus', 'tit': 'Titus', 'ti': 'Titus',
        'philemon': 'Philemon', 'phlm': 'Philemon', 'phm': 'Philemon', 'pm': 'Philemon',
        'hebrews': 'Hebrews', 'heb': 'Hebrews',
        'james': 'James', 'jas': 'James', 'jm': 'James',
        '1 peter': '1 Peter', '1peter': '1 Peter', '1pet': '1 Peter', '1 pe': '1 Peter', '1 pt': '1 Peter', 'i peter': '1 Peter', '1st peter': '1 Peter', 'first peter': '1 Peter',
        '2 peter': '2 Peter', '2peter': '2 Peter', '2pet': '2 Peter', '2 pe': '2 Peter', '2 pt': '2 Peter', 'ii peter': '2 Peter', '2nd peter': '2 Peter', 'second peter': '2 Peter',
        '1 john': '1 John', '1john': '1 John', '1 jn': '1 John', '1jhn': '1 John', 'i john': '1 John', '1st john': '1 John', 'first john': '1 John',
        '2 john': '2 John', '2john': '2 John', '2 jn': '2 John', '2jhn': '2 John', 'ii john': '2 John', '2nd john': '2 John', 'second john': '2 John',
        '3 john': '3 John', '3john': '3 John', '3 jn': '3 John', '3jhn': '3 John', 'iii john': '3 John', '3rd john': '3 John', 'third john': '3 John',
        'jude': 'Jude', 'jd': 'Jude',
        'revelation of john': 'Revelation of John', 'revelationofjohn': 'Revelation of John', 'revelation': 'Revelation of John', 'rev': 'Revelation of John', 're': 'Revelation of John', 'the apocalypse': 'Revelation of John'
    };

    const mappedName = map[lowerCaseCleaned];
    if (mappedName) return mappedName;

    if (BIBLE_BOOK_ORDER_MAP.has(cleanedName)) {
        return cleanedName;
    }

    // console.warn(`[normalizeBookNameForText] No specific map found for: '${inputName}'. Returning original (Title Cased).`);
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Normalizes book names extracted from reference IDs (like '1Chronicles', 'SongofSolomon')
 * to the canonical book name format for consistent sorting and display grouping.
 * Critical for getting the correct sort index from canonicalOrder.js.
 * @param {string} inputName - The book name string derived from a reference ID (often concatenated).
 * @returns {string} The normalized canonical book name (e.g., "1 Chronicles", "Song of Solomon") or 'Unknown'.
 */
export const normalizeBookNameForId = (inputName) => {
     if (!inputName || typeof inputName !== 'string') return 'Unknown';

     const trimmedInput = inputName.trim(); // Use original input for specific checks

     // --- Specific Numbered Book Checks FIRST ---
     // Use updated regex /^[123]\s?j(o?h?n)?/i for John epistles
     if (trimmedInput.startsWith('1')) {
         if (/^1\s?sam/i.test(trimmedInput)) return '1 Samuel';
         if (/^1\s?kin/i.test(trimmedInput)) return '1 Kings';
         if (/^1\s?chr/i.test(trimmedInput)) return '1 Chronicles';
         if (/^1\s?cor/i.test(trimmedInput)) return '1 Corinthians';
         if (/^1\s?the/i.test(trimmedInput)) return '1 Thessalonians';
         if (/^1\s?tim/i.test(trimmedInput)) return '1 Timothy';
         if (/^1\s?pet/i.test(trimmedInput)) return '1 Peter';
         if (/^1\s?j(o?h?n)?/i.test(trimmedInput)) return '1 John'; // Corrected Regex
     } else if (trimmedInput.startsWith('2')) {
         if (/^2\s?sam/i.test(trimmedInput)) return '2 Samuel';
         if (/^2\s?kin/i.test(trimmedInput)) return '2 Kings';
         if (/^2\s?chr/i.test(trimmedInput)) return '2 Chronicles';
         if (/^2\s?cor/i.test(trimmedInput)) return '2 Corinthians';
         if (/^2\s?the/i.test(trimmedInput)) return '2 Thessalonians';
         if (/^2\s?tim/i.test(trimmedInput)) return '2 Timothy';
         if (/^2\s?pet/i.test(trimmedInput)) return '2 Peter';
         if (/^2\s?j(o?h?n)?/i.test(trimmedInput)) return '2 John'; // Corrected Regex
     } else if (trimmedInput.startsWith('3')) {
          if (/^3\s?j(o?h?n)?/i.test(trimmedInput)) return '3 John'; // Corrected Regex
     }
     // --- END Specific Checks ---

     // If no specific numbered book matched, proceed with general map lookup
     const cleanedKey = trimmedInput.toLowerCase().replace(/[\s.\d]/g, ''); // Clean key from trimmed input

     // Map using cleanedKey, prefer specific names, avoid base names mapping to multiple numbered books
     const map = {
         'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus', 'numbers':'Numbers', 'deuteronomy':'Deuteronomy',
         'joshua':'Joshua', 'judges':'Judges', 'ruth':'Ruth', /* 'samuel' handled above */ /* 'kings' handled above */ /* 'chronicles' handled above */
         'ezra':'Ezra', 'nehemiah':'Nehemiah','esther':'Esther','job':'Job','psalms':'Psalms', 'psalm':'Psalms', 'proverbs':'Proverbs',
         'ecclesiastes':'Ecclesiastes','songofsolomon':'Song of Solomon', 'song':'Song of Solomon', 'songs':'Song of Solomon', 'canticles': 'Song of Solomon',
         'isaiah':'Isaiah','jeremiah':'Jeremiah','lamentations':'Lamentations','ezekiel':'Ezekiel','daniel':'Daniel',
         'hosea':'Hosea','joel':'Joel','amos':'Amos','obadiah':'Obadiah','jonah':'Jonah','micah':'Micah',
         'nahum':'Nahum','habakkuk':'Habakkuk','zephaniah':'Zephaniah','haggai':'Haggai','zechariah':'Zechariah','malachi':'Malachi',
         'matthew':'Matthew','mark':'Mark','luke':'Luke','john':'John', /* Base John maps to Gospel */
         'acts':'Acts','romans':'Romans', /* 'corinthians' handled above */
         'galatians':'Galatians','ephesians':'Ephesians', 'philippians':'Philippians','colossians':'Colossians', /* 'thessalonians' handled above */ /* 'timothy' handled above */
         'titus':'Titus','philemon':'Philemon','hebrews':'Hebrews','james':'James', /* 'peter' handled above */
         'jude':'Jude',
         'revelation':'Revelation of John', 'revelationofjohn': 'Revelation of John'
     };

     const normalized = map[cleanedKey];
     if (normalized) return normalized;

     // Last attempt: normalize as text and check canonical map
     const textNormalized = normalizeBookNameForText(trimmedInput);
     if (BIBLE_BOOK_ORDER_MAP.has(textNormalized)) {
         return textNormalized;
     }

     // console.warn(`[normalizeBookNameForId] Could not normalize ID book part: '${inputName}' (Cleaned Key: '${cleanedKey}')`);
     return 'Unknown';
};


/**
 * Gets display metadata for a node ID (used for labels, panel titles).
 * Uses optimized parsing and text normalization.
 * @param {string} nodeId - The node ID (e.g., "Genesis1", "John3v16").
 * @returns {{book: string, chapter: number|null, verse: number|null, rawId: string}|{rawId: string}} Metadata object.
 */
export const getNodeMetadata = (nodeId) => {
    if (!nodeId) return { rawId: 'N/A' };
    const parsed = parseReferenceId(nodeId);
    if (!parsed) {
        // console.warn(`[getNodeMetadata] Failed to parse ID: ${nodeId}. Returning raw.`);
        return { rawId: nodeId, book: 'Unknown', chapter: null, verse: null };
    }
    const displayBookName = normalizeBookNameForText(parsed.book);
    return { book: displayBookName, chapter: parsed.chapter, verse: parsed.verse, rawId: nodeId };
};

/**
 * Loads and preprocesses the Bible text data into an optimized lookup map.
 * Ensures this processing happens only once.
 * @returns {object|null} The raw bibleData object or null on error.
 * @throws {Error} If loading or processing fails.
 */
export const loadBibleText = () => {
    if (bibleDataCache && isBibleProcessed) return bibleDataCache;

    console.log("[dataService] Loading and Processing Bible Text...");
    console.time("Load/Preprocess Bible Text");
    try {
        if (!bibleDataRaw || !Array.isArray(bibleDataRaw.books)) {
            throw new Error("Invalid BSB.json structure: 'books' array not found.");
        }
        bibleDataCache = bibleDataRaw;

        if (!isBibleProcessed) {
            bibleLookupMap = new Map();

            bibleDataCache.books.forEach(book => {
                const canonicalBookName = normalizeBookNameForText(book.name);
                 if (!canonicalBookName || canonicalBookName === 'Unknown') {
                    // console.warn(`[loadBibleText] Skipping book with unnormalizable name: "${book.name}"`);
                    return;
                }
                if (!BIBLE_BOOK_ORDER_MAP.has(canonicalBookName)) {
                    // console.warn(`[loadBibleText] Book name "${book.name}" (normalized to "${canonicalBookName}") not in canonicalOrder.js map! Ensure BSB.json names align.`);
                }

                const chapterMap = new Map();
                if (book.chapters && Array.isArray(book.chapters)) {
                    book.chapters.forEach(chap => {
                        if (typeof chap.chapter !== 'number' || !Array.isArray(chap.verses)) return;

                        const verseMap = new Map();
                        chap.verses.forEach(v => {
                            if (typeof v.verse === 'number' && typeof v.text === 'string') {
                                verseMap.set(v.verse, v.text);
                            }
                        });
                        if (verseMap.size > 0) {
                             chapterMap.set(chap.chapter, verseMap);
                        }
                    });
                }
                if (chapterMap.size > 0) {
                    bibleLookupMap.set(canonicalBookName, chapterMap);
                }
            });
            isBibleProcessed = true;
            console.log(`[dataService] Bible lookup map created with ${bibleLookupMap.size} books.`);
        }
        console.timeEnd("Load/Preprocess Bible Text");
        return bibleDataCache;

    } catch (error) {
        console.error("[dataService] Error loading/processing Bible data:", error);
        isBibleProcessed = false;
        bibleLookupMap = null;
        bibleDataCache = null;
        throw new Error(`Failed to load/process Bible data: ${error.message}`);
    }
};

/**
 * Loads and preprocesses the cross-reference data into an optimized lookup map.
 * Keyed by a canonical source prefix (e.g., "Genesis1v") for faster filtering.
 * Ensures this processing happens only once.
 * @returns {object[]|null} The raw references array or null on error.
 * @throws {Error} If loading or processing fails.
 */
export const loadAllReferences = () => {
    if (referencesCache && isReferencesProcessed) return referencesCache;

    console.log("[dataService] Loading and Processing References...");
    console.time("Load/Preprocess References");
    try {
        if (!Array.isArray(allReferencesRaw)) {
            throw new Error("references.json is not a valid array.");
        }
        referencesCache = allReferencesRaw;

        if (!isReferencesProcessed) {
            referencesLookupMap = new Map();

            referencesCache.forEach(link => {
                if (!link || !link.source || !link.target) return;

                const parsedSource = parseReferenceId(link.source);
                if (!parsedSource || typeof parsedSource.chapter !== 'number' || typeof parsedSource.verse !== 'number') {
                    // console.warn(`[loadAllReferences] Skipping link with unparseable or incomplete source verse ID: ${link.source}`);
                    return;
                }

                const bookNameKey = normalizeBookNameForId(parsedSource.book);
                if (bookNameKey === 'Unknown') {
                    // console.warn(`[loadAllReferences] Skipping link with unnormalizable source book ID: ${link.source}`);
                    return;
                }
                 const parsedTarget = parseReferenceId(link.target);
                 if (!parsedTarget || !parsedTarget.book || typeof parsedTarget.chapter !== 'number') {
                     // console.warn(`[loadAllReferences] Skipping link with unparseable target ID: ${link.target} (Source was: ${link.source})`);
                     return;
                 }

                 const prefix = `${bookNameKey}${parsedSource.chapter}v`;

                if (!referencesLookupMap.has(prefix)) {
                    referencesLookupMap.set(prefix, []);
                }
                referencesLookupMap.get(prefix).push(link);
            });

            isReferencesProcessed = true;
            console.log(`[dataService] References lookup map created with ${referencesLookupMap.size} source chapter prefixes.`);
        }
        console.timeEnd("Load/Preprocess References");
        return referencesCache;

    } catch (error) {
        console.error("[dataService] Error loading/processing references data:", error);
        isReferencesProcessed = false;
        referencesLookupMap = null;
        referencesCache = null;
        throw new Error(`Failed to load/process references data: ${error.message}`);
    }
};

/**
 * Gets a canonically sorted list of unique book names present in the Bible data.
 * Uses the pre-processed bibleLookupMap if available for efficiency.
 * @param {object} bibleData - The raw bibleData object (passed for potential fallback if map isn't ready).
 * @returns {string[]} Sorted array of canonical book names.
 */
export const getBooks = (bibleData) => {
    let bookNames = [];
    if (bibleLookupMap && isBibleProcessed) {
        bookNames = Array.from(bibleLookupMap.keys());
    } else if (bibleData && bibleData.books) {
         // console.warn("[getBooks] bibleLookupMap not ready, falling back to processing raw bibleData.");
         const canonicalNames = bibleData.books.map(b => normalizeBookNameForText(b.name)).filter(name => name && name !== 'Unknown');
         bookNames = [...new Set(canonicalNames)];
    } else {
         console.error("[getBooks] Cannot get books: No bibleLookupMap and no valid bibleData provided.");
         return [];
    }

    try {
        const sortedNames = bookNames.sort((a, b) => {
            const indexA = getBookSortIndex(a);
            const indexB = getBookSortIndex(b);
            return indexA - indexB;
        });
        return sortedNames;
    } catch (error) {
        console.error("[getBooks] Error during sorting:", error);
        return bookNames;
    }
};

/**
 * Gets a sorted list of chapter numbers for a given canonical book name.
 * Uses the pre-processed bibleLookupMap for efficiency.
 * @param {object} bibleData - Raw bibleData (fallback).
 * @param {string} canonicalBookName - The CANONICAL book name (e.g., "Genesis", "1 Samuel").
 * @returns {number[]} Sorted array of chapter numbers.
 */
export const getChapters = (bibleData, canonicalBookName) => {
    if (!canonicalBookName) return [];

    if (bibleLookupMap && isBibleProcessed) {
        const chapterMap = bibleLookupMap.get(canonicalBookName);
        return chapterMap ? Array.from(chapterMap.keys()).sort((a, b) => a - b) : [];
    } else if (bibleData && bibleData.books) {
        // console.warn(`[getChapters] bibleLookupMap not ready for '${canonicalBookName}', falling back to raw data.`);
        const book = bibleData.books.find(b => normalizeBookNameForText(b.name) === canonicalBookName);
        return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
    } else {
        console.error(`[getChapters] Cannot get chapters for ${canonicalBookName}: No map and no raw data.`);
        return [];
    }
};

/**
 * Gets a sorted list of verse numbers for a specific chapter.
 * Uses the pre-processed bibleLookupMap for efficiency.
 * @param {object} bibleData - Raw bibleData (fallback).
 * @param {string} canonicalBookName - The CANONICAL book name.
 * @param {number} chapterNum - The chapter number.
 * @returns {number[]} Sorted array of verse numbers.
 */
export const getVersesForChapter = (bibleData, canonicalBookName, chapterNum) => {
    if (!canonicalBookName || typeof chapterNum !== 'number') return [];

    if (bibleLookupMap && isBibleProcessed) {
        try {
            const chapterMap = bibleLookupMap.get(canonicalBookName);
            const verseMap = chapterMap?.get(chapterNum);
            return (verseMap instanceof Map) ? Array.from(verseMap.keys()).sort((a, b) => a - b) : [];
        } catch (error) {
             console.error(`[getVersesForChapter] Error accessing map for ${canonicalBookName} ${chapterNum}:`, error);
             return [];
        }
    } else if (bibleData && bibleData.books) {
         // console.warn(`[getVersesForChapter] bibleLookupMap not ready for ${canonicalBookName} ${chapterNum}, falling back.`);
         const book = bibleData.books.find(b => normalizeBookNameForText(b.name) === canonicalBookName);
         const chapter = book?.chapters.find(c => c.chapter === chapterNum);
         return chapter ? chapter.verses.map(v => v.verse).sort((a, b) => a - b) : [];
    } else {
         console.error(`[getVersesForChapter] Cannot get verses for ${canonicalBookName} ${chapterNum}: No map/raw data.`);
         return [];
    }
};


/**
 * Retrieves the formatted Bible text for a given reference ID (verse or chapter).
 * Uses the pre-processed bibleLookupMap for efficiency.
 * @param {object} bibleData - Raw bibleData (only used indirectly via the map).
 * @param {string} referenceId - The reference ID (e.g., "John3v16", "Genesis1").
 * @returns {string} Formatted text or an error/status message.
 */
export const getTextForReference = (bibleData, referenceId) => {
    if (!isBibleProcessed || !bibleLookupMap) {
        console.error("[getTextForReference] Bible lookup map not processed. Call loadBibleText first.");
        return "Bible data not ready. Please wait or reload.";
    }
    if (!referenceId) return "Select a node or reference.";

    const parsedRef = parseReferenceId(referenceId);
    if (!parsedRef || !parsedRef.book || typeof parsedRef.chapter !== 'number') {
        return `Invalid Reference ID: ${referenceId}`;
    }

    const canonicalBookName = normalizeBookNameForText(parsedRef.book);

    try {
        const chapterMap = bibleLookupMap.get(canonicalBookName);
        if (!chapterMap) return `Book not found in lookup map: ${canonicalBookName}`;

        const verseMap = chapterMap.get(parsedRef.chapter);
        if (!verseMap) return `Chapter not found in lookup map: ${canonicalBookName} ${parsedRef.chapter}`;

        if (parsedRef.verse !== null) {
            const text = verseMap.get(parsedRef.verse);
            return text
                ? `${canonicalBookName} ${parsedRef.chapter}:${parsedRef.verse}\n${text.trim()}`
                : `Verse not found: ${referenceId}`;
        }
        else {
            const chapterHeader = `${canonicalBookName} ${parsedRef.chapter}\n${'-'.repeat(20)}\n`;
            const versesText = Array.from(verseMap.entries())
                .sort(([vA], [vB]) => vA - vB)
                .map(([vNum, vText]) => `${vNum} ${vText.trim()}`)
                .join('\n\n');
            return chapterHeader + versesText;
        }
    } catch (error) {
        console.error(`[getTextForReference] Error retrieving text for ${referenceId}:`, error);
        return `Error looking up text for ${referenceId}.`;
    }
};

/**
 * Filters connections based on the selected book/chapter and view mode.
 * Uses the pre-processed referencesLookupMap for efficient filtering.
 * Generates nodes and links suitable for the Arc Diagram.
 * Ensures nodes are sorted canonically.
 * @param {object[]} allLinks - Raw links data (used indirectly via the map).
 * @param {string} selectedBook - CANONICAL name of the selected book.
 * @param {number} selectedChapter - Selected chapter number.
 * @param {'chapter'|'verse'} viewMode - The current display mode.
 * @returns {{nodes: object[], links: object[]}|null} Filtered data or null if no selection/map.
 */
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => {
    if (!isReferencesProcessed || !referencesLookupMap) {
         console.error("[getConnectionsFor] References lookup map not processed. Call loadAllReferences first.");
         return { nodes: [], links: [] };
    }
    if (!selectedBook || typeof selectedChapter !== 'number') {
        return null;
    }

    // NOTE: Prefix key uses the CANONICAL book name passed in `selectedBook`
    const sourcePrefix = `${selectedBook}${selectedChapter}v`;
    const originLinks = referencesLookupMap.get(sourcePrefix) || [];

    if (originLinks.length === 0) {
        return { nodes: [], links: [] };
    }

    let finalNodes = [];
    let finalLinks = [];
    const nodeMap = new Map(); // Key: original ID, Value: node object { id, label, book, chapter, verse }

    // Helper to create/get node objects, ensuring canonical book names are stored
    const ensureNode = (id) => {
        if (!id || nodeMap.has(id)) return;

        const parsed = parseReferenceId(id);
        if (!parsed) {
            // Handle unparseable IDs gracefully
            nodeMap.set(id, { id: id, label: id, book: 'Unknown', chapter: null, verse: null });
            return;
        }

        // Use normalizeBookNameForId for the internal 'book' field used for sorting
        const canonicalBookName = normalizeBookNameForId(parsed.book);
        // Use normalizeBookNameForText for the user-facing 'label'
        const displayBookName = normalizeBookNameForText(parsed.book);

        // Generate the label based on whether it's a chapter or verse
        let label = parsed.verse !== null
            ? `${displayBookName} ${parsed.chapter}:${parsed.verse}` // Format: Book C:V
            : `${displayBookName} ${parsed.chapter}`;              // Format: Book C

        nodeMap.set(id, {
            id: id,                     // The original, un-normalized ID used in links
            label: label,               // User-facing display label
            book: canonicalBookName,    // Canonical book name for consistent sorting/grouping
            chapter: parsed.chapter,    // Store parsed chapter number
            verse: parsed.verse         // Store parsed verse number (or null for chapter nodes)
        });
    };

    // Process links based on view mode
    if (viewMode === 'chapter') {
        const chapterLinksAggregated = new Map();
        // Source chapter ID uses the canonical book name passed in selectedBook
        const sourceChapterId = `${selectedBook}${selectedChapter}`;
        ensureNode(sourceChapterId); // Ensure the source node itself is created

        originLinks.forEach(link => {
            const parsedTarget = parseReferenceId(link.target);
            if (parsedTarget && parsedTarget.book && typeof parsedTarget.chapter === 'number') {
                 // Normalize target book name to its canonical form for the target ID
                 const targetBookNormalized = normalizeBookNameForId(parsedTarget.book);
                 if (targetBookNormalized === 'Unknown') return; // Skip if target book is unknown

                // Target chapter ID uses the canonical target book name
                const targetChapterId = `${targetBookNormalized}${parsedTarget.chapter}`;
                ensureNode(targetChapterId); // Ensure the target chapter node exists

                const key = `${sourceChapterId}->${targetChapterId}`;
                if (!chapterLinksAggregated.has(key)) {
                    chapterLinksAggregated.set(key, {
                        source: sourceChapterId,
                        target: targetChapterId,
                        value: 0 // Initialize count
                    });
                }
                // Increment the value (connection count) for this chapter-to-chapter link
                chapterLinksAggregated.get(key).value += (link.value || 1); // Use link value if present, else count as 1
            }
        });
        finalLinks = Array.from(chapterLinksAggregated.values());

    } else { // 'verse' viewMode
        finalLinks = originLinks.map(link => ({ ...link, value: link.value || 1 })); // Ensure value=1 if missing
        // Create nodes for all unique source and target verses involved in these links
        finalLinks.forEach(link => {
            ensureNode(link.source);
            ensureNode(link.target);
        });
    }

    // Get all unique nodes created
    finalNodes = Array.from(nodeMap.values());

    // Sort nodes canonically: Book -> Chapter -> Verse -> ID fallback
    finalNodes.sort((a, b) => {
        const indexA = getBookSortIndex(a.book); // a.book is already canonical from ensureNode
        const indexB = getBookSortIndex(b.book); // b.book is already canonical
        if (indexA !== indexB) return indexA - indexB;

        // Ensure chapter is treated as a number for comparison
        const chapterA = typeof a.chapter === 'number' ? a.chapter : Infinity;
        const chapterB = typeof b.chapter === 'number' ? b.chapter : Infinity;
        if (chapterA !== chapterB) return chapterA - chapterB;

        // Treat chapter nodes (verse === null) as verse 0 for sorting purposes
        const verseA = a.verse === null ? 0 : a.verse;
        const verseB = b.verse === null ? 0 : b.verse;
        if (verseA !== verseB) return verseA - verseB;

        // Fallback sort based on the original ID for stability
        return a.id.localeCompare(b.id);
    });

    return { nodes: finalNodes, links: finalLinks };
};