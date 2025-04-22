// utils/dataService.js (MVP v6.0 - Re-analyzed and Ensured Exports)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

// --- Module-level Caches ---
let bibleDataCache = null;
let referencesCache = null;
let bibleLookupMap = null; // Optimized structure for text lookup
let referencesLookupMap = null; // Optimized structure for filtering links by source

// --- Parsing and Normalization Functions ---

// Parses reference IDs (Handles BookChvVs, BookCh, Book.Ch.Vs)
// Marked for export as it's used by ReferenceListPanel sorting logic too
export const parseReferenceId = (referenceId) => {
    if (!referenceId) return null;
    const cleanedId = referenceId.trim();

    // Try dot format first
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i;
    const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }

    // Try concatenated format
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i;
    const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex);
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }

    // console.warn(`Could not parse reference ID with known formats: ${referenceId}`);
    return null;
};

// Normalizes book names for display or matching BSB.json keys
const normalizeBookNameForText = (inputName) => {
    if (!inputName) return '';
    const cleanedName = inputName.trim();
    const lowerCaseCleaned = cleanedName.toLowerCase();
    const map = {
        'gen': 'Genesis', 'exo': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deut': 'Deuteronomy',
        'josh': 'Joshua', 'judg': 'Judges', 'ruth': 'Ruth', '1sam': '1 Samuel', '2sam': '2 Samuel',
        '1kgs': '1 Kings', '2kgs': '2 Kings', '1chr': '1 Chronicles', '2chr': '2 Chronicles', 'ezra': 'Ezra',
        'neh': 'Nehemiah', 'est': 'Esther', 'job': 'Job', 'ps': 'Psalms', 'prov': 'Proverbs',
        'eccl': 'Ecclesiastes', 'song': 'Song of Solomon',
        'isa': 'Isaiah', 'jer': 'Jeremiah', 'lam': 'Lamentations', 'ezek': 'Ezekiel', 'dan': 'Daniel',
        'hos': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obad': 'Obadiah', 'jonah': 'Jonah', 'mic': 'Micah',
        'nah': 'Nahum', 'hab': 'Habakkuk', 'zeph': 'Zephaniah', 'hag': 'Haggai', 'zech': 'Zechariah', 'mal': 'Malachi',
        'matt': 'Matthew', 'mark': 'Mark', 'mk': 'Mark', 'luke': 'Luke', 'lk': 'Luke', 'john': 'John', 'jn': 'John',
        'acts': 'Acts', 'rom': 'Romans',
        '1cor': '1 Corinthians', '2cor': '2 Corinthians', 'gal': 'Galatians', 'eph': 'Ephesians',
        'phil': 'Philippians', 'col': 'Colossians', '1thess': '1 Thessalonians', '2thess': '2 Thessalonians',
        '1tim': '1 Timothy', '2tim': '2 Timothy', 'titus': 'Titus', 'phlm': 'Philemon', 'heb': 'Hebrews', 'jas': 'James',
        '1pet': '1 Peter', '2pet': '2 Peter', '1jn': '1 John', '1john': '1 John',
        '2jn': '2 John', '2john': '2 John', '3jn': '3 John', '3john': '3 John', 'jude': 'Jude',
        'rev': 'Revelation of John' // Match BSB.json / canonicalOrder.js name
    };
    for (const key in map) {
        if (lowerCaseCleaned === key || lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) {
            return map[key];
        }
    }
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase()); // Fallback
};

// Normalizes book names found within reference IDs (e.g., "1Chronicles")
// to the canonical name used for sorting/grouping (e.g., "1 Chronicles").
// Marked for export as it's needed by ReferenceListPanel sorting.
export const normalizeBookNameForId = (inputName) => {
    if (!inputName) return 'Unknown';
    const cleanedName = inputName.replace(/\s/g, '').toLowerCase(); // Assumes IDs have no spaces
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
     return normalized || normalizeBookNameForText(inputName) || inputName; // Fallback chain
};

// --- Loading Functions with Pre-processing ---
export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache;
    console.time("Load/Preprocess Bible Text");
    try {
        bibleDataCache = bibleDataRaw;
        if (!bibleLookupMap) { // Build map only once
            bibleLookupMap = new Map();
            bibleDataCache.books.forEach(book => {
                const chapterMap = new Map();
                const canonicalBookName = normalizeBookNameForText(book.name); // Key map with canonical name
                book.chapters.forEach(chap => {
                    const verseMap = new Map();
                    chap.verses.forEach(v => { verseMap.set(v.verse, v.text); });
                    chapterMap.set(chap.chapter, verseMap);
                });
                bibleLookupMap.set(canonicalBookName, chapterMap);
            });
             console.log("Bible lookup map created.");
        }
        console.timeEnd("Load/Preprocess Bible Text");
        return bibleDataCache; // Return raw data
    } catch (error) { console.error("Error loading/processing Bible data:", error); throw new Error("Failed to load Bible data."); }
};

export const loadAllReferences = () => {
    if (referencesCache) return referencesCache;
    console.time("Load/Preprocess References");
    try {
        if (!Array.isArray(allReferencesRaw)) throw new Error("references.json not array.");
        referencesCache = allReferencesRaw;
        if (!referencesLookupMap) { // Build map only once
            referencesLookupMap = new Map();
            referencesCache.forEach(link => {
                if (!link || !link.source) return;
                const parsedSource = parseReferenceId(link.source);
                if(parsedSource && parsedSource.verse !== null) {
                    // Key map by "BookNameChv" prefix using ID-normalized book name
                    const prefix = `${normalizeBookNameForId(parsedSource.book)}${parsedSource.chapter}v`;
                    if (!referencesLookupMap.has(prefix)) { referencesLookupMap.set(prefix, []); }
                    referencesLookupMap.get(prefix).push(link);
                }
            });
             console.log(`References lookup map created with ${referencesLookupMap.size} prefixes.`);
        }
        console.timeEnd("Load/Preprocess References");
        return referencesCache; // Return raw links
    } catch (error) { console.error("Error loading/processing references data:", error); throw new Error("Failed to load references data."); }
};

// --- Metadata Functions ---
export const getBooks = (bibleData) => {
    if (!bibleData || !bibleData.books) return [];
    const bookNames = bibleData.books.map(b => b.name);
    // Ensure correct sorting using the imported helper
    return bookNames.sort((a, b) => getBookSortIndex(normalizeBookNameForText(a)) - getBookSortIndex(normalizeBookNameForText(b)));
};

export const getChapters = (bibleData, bookName) => {
    if (!bibleData || !bookName || !bibleData.books) return [];
    // Use text normalization to find the book in the raw data
    const normalizedBook = normalizeBookNameForText(bookName);
    const book = bibleData.books.find(b => normalizeBookNameForText(b.name) === normalizedBook);
    return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
};

export const getNodeMetadata = (nodeId) => {
     if (!nodeId) return null;
     const parsed = parseReferenceId(nodeId);
     if (!parsed) return { rawId: nodeId };
     return {
         book: normalizeBookNameForText(parsed.book), // Use text normalization for display
         chapter: parsed.chapter,
         verse: parsed.verse
     };
};

// --- Optimized Text Retrieval ---
export const getTextForReference = (bibleData, referenceId) => { // bibleData arg might not be needed if map is reliable
    if (!bibleLookupMap) { loadBibleText(); } // Ensure map is built
    if (!bibleLookupMap) return "Bible data not available/processed.";
    if (!referenceId) return "Select node...";

    const parsedRef = parseReferenceId(referenceId);
    if (!parsedRef) return `Invalid ID: ${referenceId}`;
    // Use Text normalization for map lookup key
    const normalizedBookName = normalizeBookNameForText(parsedRef.book);

    try {
        const chapterMap = bibleLookupMap.get(normalizedBookName);
        if (!chapterMap) return `Book not found [Map]: ${normalizedBookName}`;
        const verseMap = chapterMap.get(parsedRef.chapter);
        if (!verseMap) return `Chapter not found [Map]: ${normalizedBookName} ${parsedRef.chapter}`;

        if (parsedRef.verse !== null) { // Verse lookup
             if (!(verseMap instanceof Map)) return `Data structure error [Verse Map]`;
            const text = verseMap.get(parsedRef.verse);
            return text ? `${normalizedBookName} ${parsedRef.chapter}:${parsedRef.verse}\n${text.trim()}` : `Verse not found [Map]: ${referenceId}`;
        } else { // Chapter lookup
             if (!(verseMap instanceof Map)) return `Data structure error [Chapter Map]`;
             const chapterHeader = `${normalizedBookName} ${parsedRef.chapter}\n--------------------\n`;
             const versesText = Array.from(verseMap.entries()).sort(([vA], [vB]) => vA - vB)
                 .map(([vNum, vText]) => `${vNum} ${vText.trim()}`).join('\n\n');
             return chapterHeader + versesText;
        }
    } catch(error) { console.error(`Error in getTextForReference for ${referenceId}:`, error); return `Error looking up text.`; }
};


// --- Optimized Connection Filtering ---
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => { // allLinks arg might not be needed
     if (!referencesLookupMap) { loadAllReferences(); } // Ensure map is built
     if (!referencesLookupMap) return { nodes: [], links: [] };
     if (!selectedBook || !selectedChapter) return null;

    // Use ID normalization for map lookup key
    const normalizedBookForFiltering = normalizeBookNameForId(selectedBook);
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`;

    // console.log(`Filtering connections using optimized map for prefix: '${sourcePrefix}'`);
    const originLinks = referencesLookupMap.get(sourcePrefix) || [];

    if (originLinks.length === 0) return { nodes: [], links: [] };

    // --- (Aggregation/Node Derivation/Sorting logic - unchanged from previous version) ---
    let finalNodes = []; let finalLinks = []; const nodeMap = new Map();
    const ensureNode = (id) => {
        if (!id || nodeMap.has(id)) return; const parsed = parseReferenceId(id);
        if (!parsed) { nodeMap.set(id, { id: id, label: id, book: 'Unknown' }); return; }
        const bookNameKey = normalizeBookNameForId(parsed.book); // Use ID norm for sorting key
        const bookNameLabel = normalizeBookNameForText(parsed.book); // Use Text norm for display label
        let label = parsed.verse !== null ? `${bookNameLabel} ${parsed.chapter}:${parsed.verse}` : `${bookNameLabel} ${parsed.chapter}`;
        nodeMap.set(id, { id: id, label: label, book: bookNameKey });
    };

     if (viewMode === 'chapter') { /* Aggregate originLinks */
         const chapterLinksAggregated = new Map();
         const sourceChapterId = `${normalizedBookForFiltering}${selectedChapter}`;
         ensureNode(sourceChapterId);
         originLinks.forEach(link => {
             const targetParsed = parseReferenceId(link.target);
             if (targetParsed) {
                 const targetBookNormalized = normalizeBookNameForId(targetParsed.book);
                 const targetChapterId = `${targetBookNormalized}${targetParsed.chapter}`;
                 ensureNode(targetChapterId);
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
    finalNodes.sort((a, b) => { /* ... canonical sort logic using getBookSortIndex(a.book) ... */
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