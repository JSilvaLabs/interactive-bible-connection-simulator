// utils/dataService.js (MVP v3.0 Update - Incorporating ID Format Fix)

import bibleDataRaw from '@/data/BSB.json'; // Assumes direct import possible
import allReferencesRaw from '@/data/references.json'; // Assumes direct import possible & correct path
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder'; // Import helpers

let bibleDataCache = null;
let referencesCache = null;
// let bibleLookupCache = null; // TODO: Implement for faster text lookup

// --- Loading Functions ---
export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache;
    try {
        // TODO: Implement pre-processing of bibleDataRaw into bibleLookupCache here
        // for faster getTextForReference lookups if needed.
        bibleDataCache = bibleDataRaw;
        console.log("Bible data loaded.");
        return bibleDataCache;
    } catch (error) {
        console.error("Error loading Bible data:", error);
        throw new Error("Failed to load Bible data.");
    }
};

export const loadAllReferences = () => {
    if (referencesCache) return referencesCache;
    try {
        if (!Array.isArray(allReferencesRaw)) throw new Error("references.json is not a valid array.");
        referencesCache = allReferencesRaw;
        console.log(`Loaded ${referencesCache.length} references.`);
        return referencesCache;
    } catch (error) {
        console.error("Error loading references data:", error);
        throw new Error("Failed to load references data.");
    }
};

// --- Metadata & Normalization ---

// Returns books sorted canonically based on names in BSB.json
export const getBooks = (bibleData) => {
    if (!bibleData || !bibleData.books) return [];
    const bookNames = bibleData.books.map(b => b.name);
    return bookNames.sort((a, b) => getBookSortIndex(a) - getBookSortIndex(b));
};

// Gets chapters for a canonical book name
export const getChapters = (bibleData, bookName) => {
    if (!bibleData || !bookName || !bibleData.books) return [];
    const book = bibleData.books.find(b => b.name === bookName); // Assumes bookName is canonical
    return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
};


// Normalizes book names for display or matching BSB.json keys
// Input examples: "Gen", "1 John", "rev"
// Output examples: "Genesis", "1 John", "Revelation of John"
const normalizeBookNameForText = (inputName) => {
    if (!inputName) return '';
    const cleanedName = inputName.trim();
    const lowerCaseCleaned = cleanedName.toLowerCase();
    // CRITICAL: Values MUST match names in BSB.json and canonicalOrder.js
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
        'rev': 'Revelation of John' // Match BSB.json name
    };
    // Check known variations first
    for (const key in map) {
        // Allow matching with or without space for numbered books
        if (lowerCaseCleaned === key || lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) {
            return map[key];
        }
    }
    // Fallback to Title Case of original input if no match
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};

// Normalizes book names specifically from IDs (e.g., "Genesis", "1Chronicles")
// to the canonical name used for sorting/grouping ("Genesis", "1 Chronicles").
const normalizeBookNameForId = (inputName) => {
    if (!inputName) return 'Unknown';
    // Assumption: IDs don't have spaces or periods, may start with number. e.g., "1Chronicles"
    const cleanedName = inputName.toLowerCase();
     // CRITICAL: Keys must match variations found in references.json IDs
     // Values MUST match names in canonicalOrder.js
     const map = {
        'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus', 'numbers':'Numbers', 'deuteronomy':'Deuteronomy',
        'joshua':'Joshua', 'judges':'Judges', 'ruth':'Ruth','1samuel':'1 Samuel', '2samuel':'2 Samuel',
        '1kings':'1 Kings', '2kings':'2 Kings','1chronicles':'1 Chronicles','2chronicles':'2 Chronicles','ezra':'Ezra',
        'nehemiah':'Nehemiah','esther':'Esther','job':'Job','psalms':'Psalms','proverbs':'Proverbs',
        'ecclesiastes':'Ecclesiastes','songofsolomon':'Song of Solomon', // Or 'Song' if normalized that way
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
        'revelation':'Revelation of John' // Map "Revelation" from ID to full name if needed
    };
     const normalized = map[cleanedName];
     // if (!normalized) console.warn(`ID Normalization failed for: ${inputName}`); // Debugging
     return normalized || inputName; // Fallback to input name
};


// Parses reference IDs (Handles "BookChvVs" and "BookCh" variants after space removal)
// Also handles dot format "Book.Ch.Vs" directly if found
const parseReferenceId = (referenceId) => {
    if (!referenceId) return null;
    const cleanedId = referenceId.trim();

     // Try dot format first (e.g., from original txt input)
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i;
    const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) {
        return {
            book: dotMatch[1].trim(), // Keep original format for later normalization
            chapter: parseInt(dotMatch[2], 10),
            verse: parseInt(dotMatch[3], 10)
        };
    }

    // Try concatenated format BookCh[vVs]
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i; // Case-insensitive
    const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex); // Remove spaces before matching
    if (concatMatch) {
        return {
            book: concatMatch[1], // Raw book part (e.g., "Gen", "1Sam")
            chapter: parseInt(concatMatch[2], 10),
            verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null // null if chapter only
        };
    }

    // console.warn(`Could not parse reference ID: ${referenceId}`);
    return null; // Return null if no format matches
};


// --- Text Retrieval (Slow Version) ---
export const getTextForReference = (bibleData, referenceId) => {
    if (!bibleData || !bibleData.books) return "Bible data not loaded.";
    if (!referenceId) return "Select node...";

    const parsedRef = parseReferenceId(referenceId);
    if (!parsedRef) return `Invalid ID: ${referenceId}`;

    const normalizedBookName = normalizeBookNameForText(parsedRef.book);

    // SLOW LOOKUP - TODO: Optimize
    const book = bibleData.books.find(b => b.name === normalizedBookName);
    if (!book) return `Book not found: ${normalizedBookName}`;

    const chapter = book.chapters.find(c => c.chapter === parsedRef.chapter);
    if (!chapter) return `Chapter not found: ${normalizedBookName} ${parsedRef.chapter}`;

    let outputText = '';
    if (parsedRef.verse !== null) {
        const verse = chapter.verses.find(v => v.verse === parsedRef.verse);
        outputText = verse ? `${book.name} ${parsedRef.chapter}:${parsedRef.verse}\n${verse.text.trim()}` : `Verse not found: ${referenceId}`;
    } else { // Chapter-level ID was passed
        const chapterHeader = `${book.name} ${parsedRef.chapter}\n--------------------\n`;
        const versesText = chapter.verses.map(v => `${v.verse} ${v.text.trim()}`).join('\n\n');
        outputText = chapterHeader + versesText;
    }
    return outputText;
};


// --- Connection Filtering & Aggregation (MVP v3.0) ---
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => {
    if (!allLinks || !selectedBook || !selectedChapter) {
        console.log("getConnectionsFor: Missing inputs.");
        return null;
    }

    // Use the canonical name selected by the user for consistency checks
    const canonicalSelectedBook = normalizeBookNameForText(selectedBook); // Ensure we use canonical name like "1 Chronicles"
    // Normalize the book name part *as it appears in the reference ID* for filtering
    const normalizedBookForFiltering = normalizeBookNameForId(canonicalSelectedBook); // e.g., "1 Chronicles" -> "1Chronicles"

    // Construct the prefix based on the expected ID format (BookChv) in references.json
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`; // e.g., "Exodus6v", "1Chronicles16v"

    console.log(`Filtering connections for: Book='${canonicalSelectedBook}', Chapter='${selectedChapter}', Mode='${viewMode}'`);
    console.log(` -- Using source prefix: '${sourcePrefix}'`);

    // 1. Filter links where the source starts with the BookChv prefix
    const originLinks = allLinks.filter(link =>
        link.source && link.source.startsWith(sourcePrefix)
    );

    console.log(`Found ${originLinks.length} origin links starting with prefix '${sourcePrefix}'.`);
    if (originLinks.length === 0) return { nodes: [], links: [] };

    let finalNodes = [];
    let finalLinks = [];
    const nodeMap = new Map(); // Use Map for efficient node tracking { id: { node object } }

    // Helper to add/update node details in the map
    const ensureNode = (id) => {
        if (!id || nodeMap.has(id)) return;
        const parsed = parseReferenceId(id); // Handles BookChvVs or BookCh
        if (!parsed) {
            nodeMap.set(id, { id: id, label: id, book: 'Unknown' }); return;
        }
        // Use ID normalization for the 'book' key used in sorting/coloring
        const bookNameKey = normalizeBookNameForId(parsed.book);
        // Use Text normalization for the human-readable label
        const bookNameLabel = normalizeBookNameForText(parsed.book);
        let label = id; // Default label
        if (parsed.verse !== null) {
            label = `${bookNameLabel} ${parsed.chapter}:${parsed.verse}`; // e.g., Genesis 1:1
        } else {
            label = `${bookNameLabel} ${parsed.chapter}`; // e.g., Genesis 1
        }
        nodeMap.set(id, { id: id, label: label, book: bookNameKey });
    };


    if (viewMode === 'chapter') {
        // --- Chapter View Logic ---
        console.log("Aggregating links for Chapter View...");
        const chapterLinksAggregated = new Map();
        const sourceChapterId = `${normalizedBookForFiltering}${selectedChapter}`; // e.g., "Exodus6"
        ensureNode(sourceChapterId); // Add source chapter node

        originLinks.forEach(link => {
            const targetParsed = parseReferenceId(link.target);
            if (targetParsed) {
                 const targetBookNormalized = normalizeBookNameForId(targetParsed.book);
                 const targetChapterId = `${targetBookNormalized}${targetParsed.chapter}`; // e.g., "John1"
                 ensureNode(targetChapterId);

                 const key = `${sourceChapterId}->${targetChapterId}`; // Unique key for aggregation
                 if (!chapterLinksAggregated.has(key)) {
                     // Initialize with value: 1 (uniform thickness, counts connections)
                     chapterLinksAggregated.set(key, { source: sourceChapterId, target: targetChapterId, value: 1 });
                 } else {
                     // Increment connection count if summing is desired later, otherwise keep value=1
                     // chapterLinksAggregated.get(key).value += 1;
                 }
            }
        });
        finalLinks = Array.from(chapterLinksAggregated.values());
        console.log(`Aggregated into ${finalLinks.length} chapter links.`);

    } else {
        // --- Verse View Logic ---
        console.log("Processing Verse View...");
        finalLinks = originLinks.map(link => ({ ...link, value: 1 })); // Use original links, ensure value is 1

        finalLinks.forEach(link => {
            ensureNode(link.source);
            ensureNode(link.target);
        });
    }

    // --- Finalize Nodes and Sort ---
    finalNodes = Array.from(nodeMap.values());
    finalNodes.sort((a, b) => {
        const indexA = getBookSortIndex(a.book); // Uses canonical name from node object
        const indexB = getBookSortIndex(b.book);
        if (indexA !== indexB) return indexA - indexB;

        const parsedA = parseReferenceId(a.id); // Parse ID again for sorting details
        const parsedB = parseReferenceId(b.id);
        if (parsedA && parsedB) {
            if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter;
            const verseA = parsedA.verse === null ? 0 : parsedA.verse; // Treat chapter as verse 0
            const verseB = parsedB.verse === null ? 0 : parsedB.verse;
            if (verseA !== verseB) return verseA - verseB;
        }
        return a.id.localeCompare(b.id); // Fallback
    });

    console.log(`Derived and sorted ${finalNodes.length} nodes for view.`);
    return { nodes: finalNodes, links: finalLinks };
};


// --- Metadata Helper ---
export const getNodeMetadata = (nodeId) => {
    if (!nodeId) return null;
    const parsed = parseReferenceId(nodeId);
    if (!parsed) return { rawId: nodeId }; // Return raw ID if parsing fails
    return {
        book: normalizeBookNameForText(parsed.book), // Use text normalization for display
        chapter: parsed.chapter,
        verse: parsed.verse // Will be null for chapter IDs like "Genesis1"
    };
}