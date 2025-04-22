// utils/dataService.js
import bibleDataRaw from '@/data/BSB.json'; // Assumes direct import possible
import allReferencesRaw from '@/data/references.json'; // Assumes direct import possible

let bibleDataCache = null;
let referencesCache = null;
let bibleLookupCache = null; // Cache for optimized text lookup

/**
 * Loads and potentially pre-processes the Bible text data.
 * For MVP, simple load. Consider pre-processing for performance.
 * @returns {object} The Bible text data object.
 */
export const loadBibleText = () => {
    if (bibleDataCache) {
        return bibleDataCache;
    }
    try {
        // TODO: Implement pre-processing into bibleLookupCache here if needed for getTextForReference performance
        // Example: Create a Map keyed by Book->Chapter->Verse for fast lookup
        // bibleLookupCache = preprocessBibleData(bibleDataRaw);
        bibleDataCache = bibleDataRaw;
        console.log("Bible data loaded.");
        return bibleDataCache;
    } catch (error) {
        console.error("Error loading Bible data:", error);
        throw new Error("Failed to load Bible data.");
    }
};

/**
 * Loads the comprehensive cross-reference data.
 * @returns {Array} Array of link objects: { source: string, target: string, value: number }.
 */
export const loadAllReferences = () => {
    if (referencesCache) {
        return referencesCache;
    }
    try {
        // Assuming references.json is an array of link objects
        if (!Array.isArray(allReferencesRaw)) {
            throw new Error("references.json is not a valid array.");
        }
        referencesCache = allReferencesRaw;
        console.log(`Loaded ${referencesCache.length} references.`);
        return referencesCache;
    } catch (error) {
        console.error("Error loading references data:", error);
        throw new Error("Failed to load references data.");
    }
};

/**
 * Extracts a sorted list of book names from the loaded Bible data.
 * @param {object} bibleData - The loaded Bible data object.
 * @returns {Array<string>} Sorted list of book names.
 */
export const getBooks = (bibleData) => {
    if (!bibleData || !bibleData.books) return [];
    // Ensure consistent sorting, e.g., standard Bible order if possible, otherwise alphabetical
    // This basic version sorts alphabetically
    return bibleData.books.map(b => b.name).sort();
};

/**
 * Extracts a sorted list of chapter numbers for a given book name.
 * @param {object} bibleData - The loaded Bible data object.
 * @param {string} bookName - The name of the book.
 * @returns {Array<number>} Sorted list of chapter numbers.
 */
export const getChapters = (bibleData, bookName) => {
    if (!bibleData || !bookName || !bibleData.books) return [];
    const book = bibleData.books.find(b => b.name === bookName);
    return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
};


// --- Text Retrieval (Needs Optimization/Refinement) ---

/**
 * Normalizes common Bible book names/abbreviations. Adjust to match BSB.json keys precisely.
 * @param {string} inputName - Book name/abbreviation.
 * @returns {string} Normalized name matching BSB.json or original.
 */
const normalizeBookNameForText = (inputName) => {
    if (!inputName) return '';
    // More robust normalization might be needed depending on ID format
    const cleanedName = inputName.trim(); // Keep spaces for multi-word names initially
    const lowerCaseCleaned = cleanedName.toLowerCase();

    // Map common inputs to the *exact* names used as keys in BSB.json
    const map = {
        'gen': 'Genesis',
        'exo': 'Exodus',
        'lev': 'Leviticus',
        'mat': 'Matthew',
        'joh': 'John',
        'rom': 'Romans',
        'heb': 'Hebrews',
        '1 john': '1 John', // Example: Handle space if BSB.json uses it
        '1joh': '1 John',
        'rev': 'Revelation of John', // CRITICAL: Match BSB.json name
        // Add all other necessary book mappings here
    };

    return map[lowerCaseCleaned] || cleanedName; // Return original if no specific mapping
};

/**
 * Retrieves formatted Bible text for a reference ID (e.g., "Gen1", "Joh1v1").
 * PERFORMANCE WARNING: Uses nested `find`, which is slow on large datasets.
 * Recommend pre-processing bibleData into a Map for faster lookups.
 * @param {object} bibleData - The loaded Bible text JSON.
 * @param {string} referenceId - The chapter or verse reference ID.
 * @returns {string} Formatted text or error/default message.
 */
export const getTextForReference = (bibleData, referenceId) => {
    if (!bibleData || !bibleData.books) return "Bible data not loaded.";
    if (!referenceId) return "Select a chapter/verse on the diagram to view text.";

    // Updated Regex to better capture book names that might have spaces or numbers
    const refRegex = /^([1-3]?\s?[A-Za-z\s]+)(\d+)(?:v(\d+))?$/;
    const match = referenceId.match(refRegex);

    if (!match) {
        console.warn(`Invalid reference format for text lookup: ${referenceId}`);
        return `Invalid reference format: ${referenceId}`;
    }

    const rawBookName = match[1].trim(); // e.g., "Gen", "Joh", "1 Joh"
    const chapterNum = parseInt(match[2], 10);
    const verseNum = match[4] ? parseInt(match[4], 10) : null;

    const normalizedBookName = normalizeBookNameForText(rawBookName);

    // SLOW LOOKUP - Consider optimizing with a Map
    const book = bibleData.books.find(b => b.name === normalizedBookName);
    if (!book) {
        console.warn(`Book not found for text lookup: Normalized='${normalizedBookName}'`);
        return `Book not found: ${normalizedBookName}`;
    }

    const chapter = book.chapters.find(c => c.chapter === chapterNum);
    if (!chapter) {
        console.warn(`Chapter not found for text lookup: ${normalizedBookName} ${chapterNum}`);
        return `Chapter not found: ${normalizedBookName} ${chapterNum}`;
    }

    let outputText = '';
    if (verseNum !== null) {
        const verse = chapter.verses.find(v => v.verse === verseNum);
        outputText = verse ? `${book.name} ${chapterNum}:${verseNum}\n${verse.text.trim()}` : `Verse not found: ${referenceId}`;
    } else {
        const chapterHeader = `${book.name} ${chapterNum}\n--------------------\n`;
        const versesText = chapter.verses.map(v => `${v.verse} ${v.text.trim()}`).join('\n\n');
        outputText = chapterHeader + versesText;
    }
    return outputText;
};


// --- Connection Filtering (Needs Optimization/Refinement) ---

/**
 * Filters the comprehensive reference list to find connections for a selected reference.
 * Derives the nodes needed for the visualization from the filtered links.
 * PERFORMANCE WARNING: Filtering large arrays can be slow. Ensure referenceId format is consistent.
 * @param {Array} allLinks - The full array of reference link objects.
 * @param {string} selectedBook - The name of the selected book.
 * @param {number} selectedChapter - The number of the selected chapter.
 * @param {string} viewMode - 'chapter' or 'verse'. (Currently only filters by chapter).
 * @returns {object|null} Object { nodes: [], links: [] } or null if inputs invalid.
 */
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => {
    if (!allLinks || !selectedBook || !selectedChapter) return null;

    // --- Construct Filter Prefix ---
    // IMPORTANT: This prefix MUST match the format used in references.json's 'source' field.
    // Needs robust normalization matching normalizeBookNameForText if IDs use abbreviations/spaces.
    // Example: If references.json uses "Gen1v..." then prefix should be "Gen1"
    // If references.json uses "Genesis 1:..." then prefix needs more complex matching.
    // Let's assume simple prefix like "Gen1" for now. Needs verification against actual data.
    const normalizedBook = normalizeBookNameForText(selectedBook); // Use the same normalization
    // Simple prefix assumption (adjust if needed based on references.json source format)
    // This assumes source IDs start like 'Genesis1v...', 'John1v...', '1John3v...' etc.
    // It might be safer to normalize the book part *within* the filter loop if formats vary wildly.
    let chapterPrefix = `${normalizedBook}${selectedChapter}`;
    // Basic attempt to handle spaces (e.g., "1 John1") - adjust as needed
    chapterPrefix = chapterPrefix.replace(/\s/g, '');

    console.log(`Filtering connections for prefix: ${chapterPrefix}`); // Debugging

    // --- Filter Links ---
    // WARNING: Case-sensitive comparison assumed here! Ensure data consistency.
    const filteredLinks = allLinks.filter(link =>
        link.source && link.source.replace(/\s/g, '').startsWith(chapterPrefix)
        // TODO: Add verse-level filtering if viewMode === 'verse' requires it
    );

    console.log(`Found ${filteredLinks.length} links.`); // Debugging

    if (filteredLinks.length === 0) return { nodes: [], links: [] };

    // --- Derive Nodes ---
    const nodeIds = new Set();
    filteredLinks.forEach(link => {
        if(link.source) nodeIds.add(link.source);
        if(link.target) nodeIds.add(link.target);
    });

    // Create node objects. Lookup label/book from Bible data efficiently if possible.
    // Using a simple approach for now: label=id
    const derivedNodes = Array.from(nodeIds).map(id => {
         // Attempt basic book name extraction for color grouping - NEEDS REFINEMENT
         const bookMatch = id.match(/^([1-3]?\s?[A-Za-z\s]+)/);
         let bookName = bookMatch ? normalizeBookNameForText(bookMatch[1].trim()) : 'Unknown';

        return {
            id: id,
            label: id, // Use ID as label for MVP simplicity if text lookup is hard
            book: bookName // Used for coloring
        };
    });

     console.log(`Derived ${derivedNodes.length} nodes.`); // Debugging

    return { nodes: derivedNodes, links: filteredLinks };
};