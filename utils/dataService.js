// utils/dataService.js (MVP v3.0 Update)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder'; // Import helpers

let bibleDataCache = null;
let referencesCache = null;
// let bibleLookupCache = null; // TODO: Implement for faster text lookup

// --- Loading Functions ---
export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache;
    try {
        bibleDataCache = bibleDataRaw;
        // TODO: Pre-process bibleDataCache into bibleLookupCache here if optimizing getTextForReference
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

// Returns books sorted canonically
export const getBooks = (bibleData) => {
    if (!bibleData || !bibleData.books) return [];
    const bookNames = bibleData.books.map(b => b.name);
    return bookNames.sort((a, b) => getBookSortIndex(a) - getBookSortIndex(b));
};

export const getChapters = (bibleData, bookName) => {
    if (!bibleData || !bookName || !bibleData.books) return [];
    const book = bibleData.books.find(b => b.name === bookName); // Assumes bookName is canonical
    return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
};

// Normalizes book names for display or matching BSB.json keys
const normalizeBookNameForText = (inputName) => {
    if (!inputName) return '';
    const cleanedName = inputName.trim();
    const lowerCaseCleaned = cleanedName.toLowerCase();
     // CRITICAL: Ensure this map's keys cover variations in parsed IDs
     // and values EXACTLY match names in BSB.json and canonicalOrder.js
    const map = {
        'gen': 'Genesis', 'exo': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deut': 'Deuteronomy',
        'josh': 'Joshua', 'judg': 'Judges', 'ruth': 'Ruth', '1sam': '1 Samuel', '2sam': '2 Samuel',
        '1kgs': '1 Kings', '2kgs': '2 Kings', '1chr': '1 Chronicles', '2chr': '2 Chronicles', 'ezra': 'Ezra',
        'neh': 'Nehemiah', 'est': 'Esther', 'job': 'Job', 'ps': 'Psalms', 'prov': 'Proverbs',
        'eccl': 'Ecclesiastes', 'song': 'Song of Solomon', // Map 'Song' if canonical uses full name
        'isa': 'Isaiah', 'jer': 'Jeremiah', 'lam': 'Lamentations', 'ezek': 'Ezekiel', 'dan': 'Daniel',
        'hos': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obad': 'Obadiah', 'jonah': 'Jonah', 'mic': 'Micah',
        'nah': 'Nahum', 'hab': 'Habakkuk', 'zeph': 'Zephaniah', 'hag': 'Haggai', 'zech': 'Zechariah', 'mal': 'Malachi',
        'matt': 'Matthew', 'mark': 'Mark', 'luke': 'Luke', 'john': 'John', 'acts': 'Acts', 'rom': 'Romans',
        '1cor': '1 Corinthians', '2cor': '2 Corinthians', 'gal': 'Galatians', 'eph': 'Ephesians',
        'phil': 'Philippians', 'col': 'Colossians', '1thess': '1 Thessalonians', '2thess': '2 Thessalonians',
        '1tim': '1 Timothy', '2tim': '2 Timothy', 'titus': 'Titus', 'phlm': 'Philemon', 'heb': 'Hebrews', 'jas': 'James',
        '1pet': '1 Peter', '2pet': '2 Peter', '1jn': '1 John', '1john': '1 John',
        '2jn': '2 John', '2john': '2 John', '3jn': '3 John', '3john': '3 John', 'jude': 'Jude',
        'rev': 'Revelation of John' // Match BSB.json name
    };
    return map[lowerCaseCleaned] || cleanedName;
};

// Normalizes book names specifically found *within* source/target IDs in references.json
// to the canonical name used for sorting/grouping. Needs to handle all variants found in data.
const normalizeBookNameForId = (inputName) => {
    if (!inputName) return 'Unknown';
    // Example: Assumes IDs might use abbreviations without spaces, e.g., "1Sam", "John", "Rev"
    const cleanedName = inputName.replace(/\s/g, '').toLowerCase();
    const map = { // Keys should match variants found in reference IDs
        'gen': 'Genesis', 'exod': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deut': 'Deuteronomy',
        'josh': 'Joshua', 'judg': 'Judges', 'ruth': 'Ruth', '1sam': '1 Samuel', '2sam': '2 Samuel',
        '1kgs': '1 Kings', '2kgs': '2 Kings', '1chr': '1 Chronicles', '2chr': '2 Chronicles', 'ezra': 'Ezra',
        'neh': 'Nehemiah', 'est': 'Esther', 'job': 'Job', 'ps': 'Psalms', 'prov':'Proverbs',
        'eccl': 'Ecclesiastes', 'song': 'Song of Solomon', // Or 'Song' if refs use that
        'isa': 'Isaiah', 'jer': 'Jeremiah', 'lam': 'Lamentations', 'ezek': 'Ezekiel', 'dan': 'Daniel',
        'hos': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obad': 'Obadiah', 'jonah': 'Jonah', 'mic': 'Micah',
        'nah': 'Nahum', 'hab': 'Habakkuk', 'zeph': 'Zephaniah', 'hag': 'Haggai', 'zech': 'Zechariah', 'mal': 'Malachi',
        'matt':'Matthew','mark':'Mark', 'luke':'Luke','john':'John',
        'acts':'Acts', 'rom':'Romans',
        '1cor':'1 Corinthians', '2cor': '2 Corinthians', 'gal':'Galatians', 'eph':'Ephesians',
        'phil':'Philippians', 'col':'Colossians', '1thess':'1 Thessalonians', '2thess':'2 Thessalonians',
        '1tim':'1 Timothy', '2tim':'2 Timothy', 'titus':'Titus', 'phlm':'Philemon', 'heb':'Hebrews', 'jas':'James',
        '1pet':'1 Peter', '2pet':'2 Peter',
        '1joh':'1 John', '2joh':'2 John', '3joh':'3 John', 'jude':'Jude',
        'rev':'Revelation of John' // Map to canonical name used in BIBLE_BOOK_ORDER
    };
    // Attempt mapping, otherwise try the text normalization as fallback, else return original input
    return map[cleanedName] || normalizeBookNameForText(inputName) || inputName;
}

// Parses reference IDs (Needs to be robust for formats in references.json AND BSB.json lookups)
// Handles formats like "Gen1", "Gen1v1", "1Sam1", "1Sam1v1", "John3v16", "Ps119v105"
const parseReferenceId = (referenceId) => {
    if (!referenceId) return null;
    // TODO: Refine Regex if IDs have different structures (e.g. periods Gen.1.1 from txt file)
    // This regex assumes BookNameChapter[vVerse] format after normalization removed spaces
    // Group 1: Book name part (allows starting digit like '1Sam')
    // Group 2: Chapter number
    // Group 3: Verse number (optional)
    const refRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i; // Case-insensitive match
    const match = referenceId.replace(/\s/g,'').match(refRegex); // Remove spaces before matching

    if (!match) {
        // Try format like "Book.Chapter.Verse" from txt file
         const dotRegex = /^([1-3]?\s?[A-Za-z\s\.]+)\.(\d+)\.(\d+)$/i;
         const dotMatch = referenceId.match(dotRegex);
         if(dotMatch) {
              return {
                book: dotMatch[1].trim(),
                chapter: parseInt(dotMatch[2], 10),
                verse: parseInt(dotMatch[3], 10)
             };
         }
        // console.warn(`Could not parse reference ID: ${referenceId}`);
        return null; // Return null if no format matches
    }

    return {
        book: match[1], // Raw book part (e.g., "Gen", "1Sam") - needs normalization later
        chapter: parseInt(match[2], 10),
        verse: match[3] ? parseInt(match[3], 10) : null
    };
};

// --- Text Retrieval (Still uses slow find method) ---
export const getTextForReference = (bibleData, referenceId) => {
    if (!bibleData || !bibleData.books) return "Bible data not loaded.";
    if (!referenceId) return "Select node..."; // Shorter default

    const parsedRef = parseReferenceId(referenceId);
    if (!parsedRef) return `Invalid ID: ${referenceId}`;

    const normalizedBookName = normalizeBookNameForText(parsedRef.book); // Use Text normalization

    // SLOW LOOKUP - TODO: Optimize using a pre-calculated Map/Object
    const book = bibleData.books.find(b => b.name === normalizedBookName);
    if (!book) return `Book not found: ${normalizedBookName}`;

    const chapter = book.chapters.find(c => c.chapter === parsedRef.chapter);
    if (!chapter) return `Chapter not found: ${normalizedBookName} ${parsedRef.chapter}`;

    let outputText = '';
    if (parsedRef.verse !== null) {
        const verse = chapter.verses.find(v => v.verse === parsedRef.verse);
        outputText = verse ? `${book.name} ${parsedRef.chapter}:${parsedRef.verse}\n${verse.text.trim()}` : `Verse not found: ${referenceId}`;
    } else {
        const chapterHeader = `${book.name} ${parsedRef.chapter}\n--------------------\n`;
        const versesText = chapter.verses.map(v => `${v.verse} ${v.text.trim()}`).join('\n\n');
        outputText = chapterHeader + versesText;
    }
    return outputText;
};


// --- Connection Filtering & Aggregation (MVP v2.0) ---
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => {
    if (!allLinks || !selectedBook || !selectedChapter) return null;

    // Normalize the selected book name using the ID normalization scheme
    const normalizedSelectedBook = normalizeBookNameForId(selectedBook);
    // Create the prefix based on the *expected format* in references.json 'source' IDs
    // TODO: VERIFY THIS PREFIX LOGIC matches your references.json IDs EXACTLY
    const sourceChapterPrefix = `${normalizedSelectedBook}${selectedChapter}`; // e.g., "Genesis1", "1John3"
    const sourceVersePrefix = `${sourceChapterPrefix}v`; // e.g., "Genesis1v", "1John3v"
     const sourceDotPrefix = `${selectedBook}.${selectedChapter}.`; // e.g., "Gen.1." - adjust book part based on txt file source format

    console.log(`Filtering connections for book='${normalizedSelectedBook}', chapter='${selectedChapter}', mode='${viewMode}'`);
    console.log(` -- Using verse prefix: '${sourceVersePrefix}'`);
     console.log(` -- Using dot prefix: '${sourceDotPrefix}'`);


    // 1. Filter links originating from any verse within the selected chapter
    const originLinks = allLinks.filter(link => {
        // Add robustness: check if link and link.source exist
        if (!link || !link.source) return false;
        // TODO: Adapt this check based on the ACTUAL format in references.json
        // Option A: Assumes IDs like "Genesis1v1", "1John3v5" (no spaces)
        // return link.source.startsWith(sourceVersePrefix);
        // Option B: Assumes IDs like "Gen.1.1", "1John.3.5" (from txt file)
         return link.source.startsWith(sourceDotPrefix);
    });

    console.log(`Found ${originLinks.length} origin links.`);
    if (originLinks.length === 0) return { nodes: [], links: [] };

    let finalNodes = [];
    let finalLinks = [];
    const nodeMap = new Map(); // Use Map for efficient node tracking { id: { node object } }

    // Helper to add/update node details in the map
    const ensureNode = (id) => {
        if (!id || nodeMap.has(id)) return; // Skip if no ID or already added

        const parsed = parseReferenceId(id);
        if (!parsed) {
            // Handle unparseable IDs - create a basic node
            nodeMap.set(id, { id: id, label: id, book: 'Unknown' });
            // console.warn(`Could not parse node ID: ${id}`);
            return;
        }

        const bookName = normalizeBookNameForId(parsed.book); // Use ID normalization for grouping/sorting
        let label = id; // Default label
        if (parsed.verse !== null) {
             label = `${parsed.book} ${parsed.chapter}:${parsed.verse}`; // e.g., Gen 1:1
        } else {
             label = `${parsed.book} ${parsed.chapter}`; // e.g., Gen 1
        }
        nodeMap.set(id, { id: id, label: label, book: bookName });
    };


    if (viewMode === 'chapter') {
        // --- Chapter View Logic ---
        console.log("Aggregating links for Chapter View...");
        const chapterLinksAggregated = new Map(); // Key: targetChapterId, Value: { source, target, value }

        // Add the source chapter node first
        const sourceChapterId = `${normalizedSelectedBook}${selectedChapter}`; // e.g., "Genesis1"
        ensureNode(sourceChapterId);

        originLinks.forEach(link => {
            const targetParsed = parseReferenceId(link.target);
            if (targetParsed) {
                 const targetBookNormalized = normalizeBookNameForId(targetParsed.book);
                 const targetChapterId = `${targetBookNormalized}${targetParsed.chapter}`; // e.g., "John1"

                 ensureNode(targetChapterId); // Ensure target chapter node exists

                 // Aggregate link values
                 const key = `${sourceChapterId}->${targetChapterId}`;
                 if (!chapterLinksAggregated.has(key)) {
                     chapterLinksAggregated.set(key, { source: sourceChapterId, target: targetChapterId, value: 0 });
                 }
                 // Set value to 1 for uniform thickness (MVP 3.0 requirement) - effectively counts connections
                 // chapterLinksAggregated.get(key).value += (link.value || 1); // Use this if summing original values
                 chapterLinksAggregated.get(key).value += 1; // Count connections instead of summing votes
            }
        });
        finalLinks = Array.from(chapterLinksAggregated.values());
        console.log(`Aggregated into ${finalLinks.length} chapter links.`);

    } else {
        // --- Verse View Logic ---
        console.log("Processing Verse View...");
        finalLinks = originLinks.map(link => ({ ...link, value: 1 })); // Ensure value is 1

        // Ensure all source and target nodes are added to the map
        finalLinks.forEach(link => {
            ensureNode(link.source);
            ensureNode(link.target);
        });
    }

    // --- Finalize Nodes and Sort ---
    finalNodes = Array.from(nodeMap.values());
    finalNodes.sort((a, b) => {
        const indexA = getBookSortIndex(a.book);
        const indexB = getBookSortIndex(b.book);
        if (indexA !== indexB) return indexA - indexB;

        const parsedA = parseReferenceId(a.id);
        const parsedB = parseReferenceId(b.id);
        if (parsedA && parsedB) {
            if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter;
             // Treat chapter nodes (verse=null) as verse 0 for sorting purposes
            const verseA = parsedA.verse === null ? 0 : parsedA.verse;
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
    if (!parsed) return { rawId: nodeId };
    return {
        // Use Text normalization for display consistency
        book: normalizeBookNameForText(parsed.book),
        chapter: parsed.chapter,
        verse: parsed.verse // Will be null for chapter-level IDs
    };
}