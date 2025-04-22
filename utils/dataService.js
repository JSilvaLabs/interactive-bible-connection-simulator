// utils/dataService.js (MVP v2.0 Update)

// Assuming these imports work based on your local data files
import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json'; // The comprehensive list of links

// Import canonical order helpers
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

let bibleDataCache = null;
let referencesCache = null;
let bibleLookupCache = null; // Placeholder for optimized lookup structure

// --- Loading Functions ---

export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache;
    try {
        // TODO: Implement pre-processing of bibleDataRaw into bibleLookupCache here
        // for faster getTextForReference lookups if needed.
        // E.g., const lookupMap = new Map(); bibleDataRaw.books.forEach(book => ...);
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

// --- Metadata Functions ---

export const getBooks = (bibleData) => {
    if (!bibleData || !bibleData.books) return [];
    const bookNames = bibleData.books.map(b => b.name);
    // Sort based on canonical order using the pre-calculated map
    return bookNames.sort((a, b) => getBookSortIndex(a) - getBookSortIndex(b));
};

export const getChapters = (bibleData, bookName) => {
    if (!bibleData || !bookName || !bibleData.books) return [];
    // Assumes bookName is the canonical name already
    const book = bibleData.books.find(b => b.name === bookName);
    return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
};


// --- Text Retrieval Function (Simple Version - Needs Optimization) ---

// IMPORTANT: Ensure this normalization aligns with how book names appear in BSB.json
const normalizeBookNameForText = (inputName) => {
     if (!inputName) return '';
    const cleanedName = inputName.trim();
    const lowerCaseCleaned = cleanedName.toLowerCase();
    const map = { // Expand as needed
        'gen': 'Genesis', 'exo': 'Exodus', 'lev': 'Leviticus', /*...*/
        'ps': 'Psalms', 'prov': 'Proverbs', /*...*/
        'mat': 'Matthew', 'mk': 'Mark', 'lk': 'Luke', 'jn': 'John', /*...*/
        'rom': 'Romans', '1cor': '1 Corinthians', '2cor': '2 Corinthians', /*...*/
        '1 jn': '1 John', '1jn': '1 John', '2 jn': '2 John', '2jn': '2 John', '3 jn': '3 John', '3jn': '3 John', /*...*/
        'rev': 'Revelation of John'
    };
    return map[lowerCaseCleaned] || cleanedName; // Return exact match or original
};

// Parses reference IDs like "Gen1", "Joh1v1", "1John3v8", "Psalm23" etc.
// Returns object { book: string, chapter: number, verse: number|null } or null if invalid
const parseReferenceId = (referenceId) => {
    if (!referenceId) return null;
     // Regex tries to capture variations: Book Ch, Book ChvVs
     // Group 1: Book name (potentially multi-word, numbers like 1 John)
     // Group 2: Chapter number
     // Group 3: Verse number (optional)
    const refRegex = /^([1-3]?\s?[A-Za-z\s]+?)(\d+)(?:[v:](\d+))?$/; // Allow v or : for verse
    const match = referenceId.match(refRegex);

    if (!match) return null;

    return {
        book: match[1].trim(), // Keep original spacing/case for now, normalize later
        chapter: parseInt(match[2], 10),
        verse: match[3] ? parseInt(match[3], 10) : null
    };
};


export const getTextForReference = (bibleData, referenceId) => {
    // ... (Keep the implementation from MVP v1.0 - File 2, Line 90 onwards) ...
    // ... Remember it uses nested .find() which is slow. Optimization is TODO. ...
     if (!bibleData || !bibleData.books) return "Bible data not loaded.";
    if (!referenceId) return "Select a chapter/verse on the diagram to view text.";

    const parsedRef = parseReferenceId(referenceId);
    if (!parsedRef) {
        console.warn(`Invalid reference format for text lookup: ${referenceId}`);
        return `Invalid reference format: ${referenceId}`;
    }

    const normalizedBookName = normalizeBookNameForText(parsedRef.book);

    // SLOW LOOKUP - Consider optimizing with a Map
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


// --- Connection Filtering Function (MVP v2.0 - Chapter/Verse Toggle) ---

// Normalizes book names found *within reference IDs* (e.g., from references.json)
// Tries to map abbreviations/common forms to the canonical name used in BIBLE_BOOK_ORDER.
const normalizeBookNameForId = (inputName) => {
    if (!inputName) return 'Unknown';
    const cleanedName = inputName.replace(/\s/g, '').toLowerCase(); // Remove spaces, lower case
    const map = { // Needs to be comprehensive for *all* formats in references.json
        'gen': 'Genesis', 'exod': 'Exodus', 'lev': 'Leviticus', /*...*/
        'ps': 'Psalms', 'prov':'Proverbs', /*...*/
        'matt':'Matthew','mark':'Mark', 'luke':'Luke','john':'John', /*...*/
        'acts':'Acts', 'rom':'Romans', /*...*/
        '1cor':'1 Corinthians', '2cor': '2 Corinthians', /*...*/
        'heb': 'Hebrews', 'jas':'James', /*...*/
        '1pet': '1 Peter', '2pet':'2 Peter', /*...*/
        '1joh':'1 John', '2joh':'2 John', '3joh':'3 John', /*...*/
        'rev':'Revelation of John'
         // Add mappings for ALL possible book abbreviations/names in references.json source/target
    };
    return map[cleanedName] || inputName; // Fallback to input if no map entry
}


export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => {
    if (!allLinks || !selectedBook || !selectedChapter) {
        console.log("getConnectionsFor: Missing inputs.");
        return null;
    }

    // --- Define the Source Reference Prefix for Filtering ---
    // We need a reliable way to identify links originating from the selected chapter.
    // This depends heavily on the format in references.json.
    // Example Assumption: IDs are like "Genesis1v1", "1John3v8" (no spaces)
    const normalizedSelectedBook = normalizeBookNameForId(selectedBook); // Normalize the *input* book name first
    const sourceChapterPrefix = `${normalizedSelectedBook}${selectedChapter}`; // e.g., "Genesis1", "1John3"
    const sourceVersePrefix = `${sourceChapterPrefix}v`; // e.g., "Genesis1v", "1John3v"

    console.log(`Filtering connections STARTING WITH book='${normalizedSelectedBook}', chapter='${selectedChapter}' (Prefix: '${sourceChapterPrefix}')`);

    // 1. Filter links originating from the selected logical chapter
    const originLinks = allLinks.filter(link =>
        link.source && link.source.startsWith(sourceVersePrefix) // Match verses within the chapter
    );

    console.log(`Found ${originLinks.length} origin links starting with prefix '${sourceVersePrefix}'.`);

    if (originLinks.length === 0) return { nodes: [], links: [] }; // No connections from this chapter

    let finalNodes = [];
    let finalLinks = [];
    const nodeIds = new Set(); // Track unique node IDs needed

    // --- Process based on View Mode ---
    if (viewMode === 'chapter') {
        console.log("Processing Chapter View - Aggregating links...");
        const chapterLinksAggregated = {}; // Key: target chapter ID (e.g., "John1"), Value: { source, target, value }

        originLinks.forEach(link => {
            const sourceParsed = parseReferenceId(link.source);
            const targetParsed = parseReferenceId(link.target);

            if (sourceParsed && targetParsed) {
                 const sourceChapterId = `${normalizeBookNameForId(sourceParsed.book)}${sourceParsed.chapter}`;
                 const targetChapterId = `${normalizeBookNameForId(targetParsed.book)}${targetParsed.chapter}`;

                 // Aggregate by target chapter
                 const key = targetChapterId;
                 if (!chapterLinksAggregated[key]) {
                     chapterLinksAggregated[key] = { source: sourceChapterId, target: targetChapterId, value: 0 };
                 }
                 chapterLinksAggregated[key].value += link.value || 1; // Sum values

                 nodeIds.add(sourceChapterId); // Add source chapter
                 nodeIds.add(targetChapterId); // Add target chapter
            }
        });

        finalLinks = Object.values(chapterLinksAggregated);
        console.log(`Aggregated into ${finalLinks.length} chapter links.`);

        // Derive node details for chapter IDs
        finalNodes = Array.from(nodeIds).map(id => {
            const parsed = parseReferenceId(id); // Reuse parser (it handles missing verse)
            const bookName = parsed ? normalizeBookNameForId(parsed.book) : 'Unknown';
            const label = parsed ? `${parsed.book} ${parsed.chapter}` : id; // e.g., "Genesis 1"
            return { id: id, label: label, book: bookName };
        });

    } else { // viewMode === 'verse'
        console.log("Processing Verse View...");
        finalLinks = originLinks; // Use the directly filtered verse-to-verse links

        // Collect all unique source and target verse IDs from the filtered links
        finalLinks.forEach(link => {
            if(link.source) nodeIds.add(link.source);
            if(link.target) nodeIds.add(link.target);
        });

        // Derive node details for verse IDs
        finalNodes = Array.from(nodeIds).map(id => {
            const parsed = parseReferenceId(id);
            const bookName = parsed ? normalizeBookNameForId(parsed.book) : 'Unknown';
            const label = parsed ? (parsed.verse ? `${parsed.book} ${parsed.chapter}:${parsed.verse}` : `${parsed.book} ${parsed.chapter}`) : id;
            return { id: id, label: label, book: bookName };
        });
    }

    // --- Sort Nodes Canonically ---
    finalNodes.sort((a, b) => {
        const indexA = getBookSortIndex(a.book);
        const indexB = getBookSortIndex(b.book);
        if (indexA !== indexB) return indexA - indexB;

        // Secondary sort if books are the same (requires parsing chapter/verse from ID)
        const parsedA = parseReferenceId(a.id);
        const parsedB = parseReferenceId(b.id);
        if (parsedA && parsedB) {
            if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter;
            if (parsedA.verse !== null && parsedB.verse !== null) return parsedA.verse - parsedB.verse;
            if (parsedA.verse === null && parsedB.verse !== null) return -1; // Chapter before verse
            if (parsedA.verse !== null && parsedB.verse === null) return 1;  // Verse after chapter
        }
        return a.id.localeCompare(b.id); // Fallback string compare
    });

    console.log(`Derived and sorted ${finalNodes.length} nodes.`);

    return { nodes: finalNodes, links: finalLinks };
};