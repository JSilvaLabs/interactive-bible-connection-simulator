// utils/dataService.js (MVP v3.0 Update - Exporting parseReferenceId)

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
    // Sort based on canonical order using the pre-calculated map
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
// CRITICAL: Values MUST match names in BSB.json and canonicalOrder.js
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
// CRITICAL: Keys must match variations found in references.json IDs
// Values MUST match names in canonicalOrder.js
const normalizeBookNameForId = (inputName) => {
    if (!inputName) return 'Unknown';
    const cleanedName = inputName.replace(/\s/g, '').toLowerCase(); // Assumes IDs have no spaces
    const map = {
        'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus', 'numbers':'Numbers', 'deuteronomy':'Deuteronomy',
        'joshua':'Joshua', 'judges':'Judges', 'ruth':'Ruth','1samuel':'1 Samuel', '2samuel':'2 Samuel',
        '1kings':'1 Kings', '2kings':'2 Kings','1chronicles':'1 Chronicles','2chronicles':'2 Chronicles','ezra':'Ezra',
        'nehemiah':'Nehemiah','esther':'Esther','job':'Job','psalms':'Psalms','proverbs':'Proverbs',
        'ecclesiastes':'Ecclesiastes','songofsolomon':'Song of Solomon', // Ensure this matches canonicalOrder.js
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
        'revelation':'Revelation of John' // Ensure this matches BSB.json and canonicalOrder.js
    };
     const normalized = map[cleanedName];
     // if (!normalized) console.warn(`ID Normalization failed for: ${inputName}`); // Debugging
     // If no map match, try text normalization as fallback before giving up
     return normalized || normalizeBookNameForText(inputName) || inputName;
};


// Parses reference IDs (Handles "BookChvVs" and "BookCh" variants after space removal)
// Also handles dot format "Book.Ch.Vs" directly if found
// IMPORTANT: Ensure this is EXPORTED
export const parseReferenceId = (referenceId) => {
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
    // Regex Explanation:
    // ^                  - Start of string
    // ([1-3]?[A-Za-z]+)  - Group 1: Optional leading digit (1-3), followed by one or more letters (Book Name Part)
    // (\d+)              - Group 2: One or more digits (Chapter Number)
    // (?:[v:](\d+))?    - Optional non-capturing group: Starts with 'v' or ':', followed by Group 3
    // (\d+)              - Group 3: One or more digits (Verse Number)
    // $                  - End of string
    // i                  - Case-insensitive match
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i;
    const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex); // Remove spaces before matching
    if (concatMatch) {
        return {
            book: concatMatch[1], // Raw book part (e.g., "Gen", "1Sam", "SongofSolomon")
            chapter: parseInt(concatMatch[2], 10),
            verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null // null if chapter only ID (no verse part)
        };
    }

    // console.warn(`Could not parse reference ID with known formats: ${referenceId}`);
    return null; // Return null if no format matches
};


// --- Text Retrieval (Slow Version) ---
// TODO: Optimize this with a pre-calculated lookup map for performance
export const getTextForReference = (bibleData, referenceId) => {
    if (!bibleData || !bibleData.books) return "Bible data not loaded.";
    if (!referenceId) return "Select node...";

    const parsedRef = parseReferenceId(referenceId);
    if (!parsedRef) return `Invalid ID: ${referenceId}`;

    const normalizedBookName = normalizeBookNameForText(parsedRef.book); // Use Text normalization for matching BSB.json

    // SLOW LOOKUP
    const book = bibleData.books.find(b => b.name === normalizedBookName);
    if (!book) return `Book not found [Text]: ${normalizedBookName} (from ${referenceId})`;

    const chapter = book.chapters.find(c => c.chapter === parsedRef.chapter);
    if (!chapter) return `Chapter not found [Text]: ${normalizedBookName} ${parsedRef.chapter}`;

    let outputText = '';
    if (parsedRef.verse !== null) {
        const verse = chapter.verses.find(v => v.verse === parsedRef.verse);
        outputText = verse ? `${book.name} ${parsedRef.chapter}:${parsedRef.verse}\n${verse.text.trim()}` : `Verse not found [Text]: ${referenceId}`;
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

    // Normalize the selected book name using the ID normalization scheme
    const normalizedBookForFiltering = normalizeBookNameForId(selectedBook);
    // Construct the prefix based on the expected ID format (BookChv) in references.json
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`; // e.g., "Genesis1v", "1Chronicles16v"

    // console.log(`Filtering connections for: Book='${selectedBook}', Chapter='${selectedChapter}', Mode='${viewMode}'`);
    // console.log(` -- Using source prefix: '${sourcePrefix}'`);

    // 1. Filter links where the source starts with the constructed prefix
    const originLinks = allLinks.filter(link =>
        link.source && link.source.startsWith(sourcePrefix)
    );

    // console.log(`Found ${originLinks.length} origin links starting with prefix '${sourcePrefix}'.`);
    if (originLinks.length === 0) return { nodes: [], links: [] };

    let finalNodes = [];
    let finalLinks = [];
    const nodeMap = new Map(); // Use Map for efficient node tracking { id: { node object } }

    // Helper to add/update node details in the map
    const ensureNode = (id) => {
        if (!id || nodeMap.has(id)) return;
        const parsed = parseReferenceId(id);
        if (!parsed) {
            nodeMap.set(id, { id: id, label: id, book: 'Unknown' }); return;
        }
        const bookNameKey = normalizeBookNameForId(parsed.book); // Use ID normalization for grouping/sorting
        const bookNameLabel = normalizeBookNameForText(parsed.book); // Use Text normalization for display label
        let label = id;
        if (parsed.verse !== null) {
            label = `${bookNameLabel} ${parsed.chapter}:${parsed.verse}`;
        } else {
            label = `${bookNameLabel} ${parsed.chapter}`;
        }
        nodeMap.set(id, { id: id, label: label, book: bookNameKey }); // Use canonical name for 'book' field
    };


    if (viewMode === 'chapter') {
        // --- Chapter View Logic ---
        // console.log("Aggregating links for Chapter View...");
        const chapterLinksAggregated = new Map();
        // Define source chapter ID based on *normalized* book name for IDs
        const sourceChapterId = `${normalizedBookForFiltering}${selectedChapter}`; // e.g., "Genesis1"
        ensureNode(sourceChapterId); // Ensure source chapter node exists

        originLinks.forEach(link => {
            const targetParsed = parseReferenceId(link.target);
            if (targetParsed) {
                 const targetBookNormalized = normalizeBookNameForId(targetParsed.book);
                 const targetChapterId = `${targetBookNormalized}${targetParsed.chapter}`; // e.g., "John1"
                 ensureNode(targetChapterId); // Ensure target chapter node exists

                 const key = `${sourceChapterId}->${targetChapterId}`;
                 if (!chapterLinksAggregated.has(key)) {
                     chapterLinksAggregated.set(key, { source: sourceChapterId, target: targetChapterId, value: 0 });
                 }
                 // Set value to 1 (uniform thickness, counts connections)
                 chapterLinksAggregated.get(key).value += 1;
            }
        });
        finalLinks = Array.from(chapterLinksAggregated.values());
        // console.log(`Aggregated into ${finalLinks.length} chapter links.`);

    } else {
        // --- Verse View Logic ---
        // console.log("Processing Verse View...");
        finalLinks = originLinks.map(link => ({ ...link, value: 1 })); // Use original links, ensure value is 1

        finalLinks.forEach(link => {
            ensureNode(link.source);
            ensureNode(link.target);
        });
    }

    // --- Finalize Nodes and Sort ---
    finalNodes = Array.from(nodeMap.values());
    finalNodes.sort((a, b) => {
        const indexA = getBookSortIndex(a.book); // book property should hold canonical name now
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

    // console.log(`Derived and sorted ${finalNodes.length} nodes for view.`);
    return { nodes: finalNodes, links: finalLinks };
};


// --- Metadata Helper ---
export const getNodeMetadata = (nodeId) => {
    if (!nodeId) return null;
    const parsed = parseReferenceId(nodeId); // Use the shared parser
    if (!parsed) return { rawId: nodeId };
    return {
        // Use Text normalization for display consistency
        book: normalizeBookNameForText(parsed.book),
        chapter: parsed.chapter,
        verse: parsed.verse // Will be null for chapter IDs like "Genesis1"
    };
}