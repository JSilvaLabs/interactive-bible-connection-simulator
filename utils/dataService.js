// utils/dataService.js (MVP v6.0 Refactor - Exporting normalizeBookNameForId)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

// --- Module-level Caches ---
let bibleDataCache = null; // Raw loaded data
let referencesCache = null; // Raw loaded links
let bibleLookupMap = null; // OPTIMIZED structure for text lookup (TODO: Implement)
let referencesLookupMap = null; // OPTIMIZED structure for filtering links (TODO: Implement)

// --- Parsing and Normalization Functions ---

// Normalizes book names for display or matching BSB.json keys
// Input examples: "Gen", "1 John", "rev" -> Output examples: "Genesis", "1 John", "Revelation of John"
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
        'rev': 'Revelation of John'
    };
     // Handle numbered books potentially having spaces in input ("1 John", "1Sam") vs map keys
    for (const key in map) {
        if (lowerCaseCleaned === key || lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) {
            return map[key];
        }
    }
    // Fallback: Capitalize first letter of each word if no map entry found
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};

// Normalizes book names from IDs (e.g., "Genesis", "1Chronicles")
// to the canonical name used for sorting/grouping ("Genesis", "1 Chronicles").
// IMPORTANT: Ensure this function is EXPORTED
export const normalizeBookNameForId = (inputName) => {
    if (!inputName) return 'Unknown';
    // Assumption: IDs in references.json are concatenated without spaces (e.g., "1Chronicles")
    const cleanedName = inputName.replace(/\s/g, '').toLowerCase();
    // CRITICAL: Keys must match variations found in references.json IDs
    // Values MUST match names in canonicalOrder.js exactly
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
        'revelation':'Revelation of John' // Map ID "revelation" to canonical "Revelation of John"
    };
     const normalized = map[cleanedName];
     // Fallback if mapping fails: attempt text normalization or return original
     return normalized || normalizeBookNameForText(inputName) || inputName;
};

// Parses reference IDs - EXPORTED
export const parseReferenceId = (referenceId) => {
    if (!referenceId) return null;
    const cleanedId = referenceId.trim();
    // Try dot format first (e.g., from original txt input if preprocessing missed some)
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i;
    const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }
    // Try concatenated format BookCh[vVs]
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i;
    const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex); // Remove spaces before matching
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }
    // console.warn(`Could not parse reference ID with known formats: ${referenceId}`);
    return null;
};

// --- Loading Functions with Refactor Placeholders ---
export const loadBibleText = () => {
    if (bibleDataCache) return bibleDataCache;
    try {
        bibleDataCache = bibleDataRaw; // Store raw data
        // --- REFACTOR TARGET 1: Pre-process for Text Lookup ---
        if (!bibleLookupMap) { // Only process once
            console.time("Preprocess Bible Text");
            bibleLookupMap = new Map();
             bibleDataCache.books.forEach(book => {
                const chapterMap = new Map();
                // Use canonical name for the top-level key
                const canonicalBookName = normalizeBookNameForText(book.name); // Match BSB.json name case/space
                book.chapters.forEach(chap => {
                    const verseMap = new Map();
                    chap.verses.forEach(v => { verseMap.set(v.verse, v.text); });
                    chapterMap.set(chap.chapter, verseMap);
                });
                bibleLookupMap.set(canonicalBookName, chapterMap);
             });
            console.timeEnd("Preprocess Bible Text");
            console.log("Bible data loaded and pre-processed for lookup.");
        }
        // --- End Refactor Target 1 ---
        return bibleDataCache; // Return raw data for now
    } catch (error) { console.error("Error loading/processing Bible data:", error); throw new Error("Failed to load Bible data."); }
};

export const loadAllReferences = () => {
    if (referencesCache) return referencesCache;
    try {
        if (!Array.isArray(allReferencesRaw)) throw new Error("references.json is not valid array.");
        referencesCache = allReferencesRaw; // Store raw links
        // --- REFACTOR TARGET 2: Pre-process for Connection Filtering ---
        if (!referencesLookupMap) { // Only process once
            console.time("Preprocess References");
            referencesLookupMap = new Map(); // Map<SourcePrefix (e.g., Genesis1v), Link[]>
            referencesCache.forEach(link => {
                if (!link || !link.source) return;
                // TODO: Determine the correct prefix based on consistent link.source structure
                // Assuming BookChv format after normalization for the prefix key
                const parsedSource = parseReferenceId(link.source);
                if(parsedSource && parsedSource.verse !== null) {
                    // Use the ID-normalized book name for the map key
                    const prefix = `${normalizeBookNameForId(parsedSource.book)}${parsedSource.chapter}v`;
                    if (!referencesLookupMap.has(prefix)) {
                        referencesLookupMap.set(prefix, []);
                    }
                    referencesLookupMap.get(prefix).push(link);
                }
                // Add handling for other source formats if present
            });
            console.timeEnd("Preprocess References");
            console.log(`Loaded and pre-processed ${referencesCache.length} references into lookup map.`);
        }
        // --- End Refactor Target 2 ---
        return referencesCache; // Return raw links
    } catch (error) { console.error("Error loading/processing references data:", error); throw new Error("Failed to load references data."); }
};


// --- Metadata Functions (using cached raw data) ---
export const getBooks = (bibleData) => { /* ... Same as v5.1 ... */
    if (!bibleData || !bibleData.books) return [];
    const bookNames = bibleData.books.map(b => b.name);
    return bookNames.sort((a, b) => getBookSortIndex(a) - getBookSortIndex(b));
 };
export const getChapters = (bibleData, bookName) => { /* ... Same as v5.1 ... */
    if (!bibleData || !bookName || !bibleData.books) return [];
    const book = bibleData.books.find(b => b.name === bookName);
    return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
};
export const getNodeMetadata = (nodeId) => { /* ... Same as v5.1 ... */
     if (!nodeId) return null; const parsed = parseReferenceId(nodeId);
     if (!parsed) return { rawId: nodeId };
     return { book: normalizeBookNameForText(parsed.book), chapter: parsed.chapter, verse: parsed.verse };
};


// --- Optimized Text Retrieval ---
export const getTextForReference = (bibleData, referenceId) => { // bibleData arg kept for compatibility for now
    if (!bibleLookupMap) { loadBibleText(); } // Ensure pre-processing happened
    if (!bibleLookupMap) return "Bible data failed to process."; // Check again
    if (!referenceId) return "Select node...";

    const parsedRef = parseReferenceId(referenceId);
    if (!parsedRef) return `Invalid ID: ${referenceId}`;

    const normalizedBookName = normalizeBookNameForText(parsedRef.book); // Use Text normalization for map lookup

    try {
        const chapterMap = bibleLookupMap.get(normalizedBookName);
        if (!chapterMap) return `Book not found [Map]: ${normalizedBookName}`;

        const verseMapOrChapterData = chapterMap.get(parsedRef.chapter);
         if (!verseMapOrChapterData) return `Chapter not found [Map]: ${normalizedBookName} ${parsedRef.chapter}`;

        if (parsedRef.verse !== null) { // Verse lookup
             if (!(verseMapOrChapterData instanceof Map)) return `Data structure error [Verse Map]`;
            const text = verseMapOrChapterData.get(parsedRef.verse);
            return text ? `${normalizedBookName} ${parsedRef.chapter}:${parsedRef.verse}\n${text.trim()}` : `Verse not found [Map]: ${referenceId}`;
        } else { // Chapter lookup
             if (!(verseMapOrChapterData instanceof Map)) return `Data structure error [Chapter Map]`;
             const chapterHeader = `${normalizedBookName} ${parsedRef.chapter}\n--------------------\n`;
             const versesText = Array.from(verseMapOrChapterData.entries())
                 .sort(([vA], [vB]) => vA - vB) // Sort verses
                 .map(([vNum, vText]) => `${vNum} ${vText.trim()}`)
                 .join('\n\n');
             return chapterHeader + versesText;
        }
    } catch(error) { console.error("Error during optimized text lookup:", error); return `Error looking up text for ${referenceId}`; }
};


// --- Optimized Connection Filtering ---
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => { // allLinks arg kept for compatibility
    if (!referencesLookupMap) { loadAllReferences(); } // Ensure pre-processing happened
    if (!referencesLookupMap) return { nodes:[], links:[] }; // Check again
    if (!selectedBook || !selectedChapter) return null;

    // Use ID normalization for map lookup key
    const normalizedBookForFiltering = normalizeBookNameForId(selectedBook);
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`;

    // console.log(`Filtering connections using optimized map for prefix: '${sourcePrefix}'`);

    // --- REFACTOR TARGET 3: Use Optimized Map ---
    const originLinks = referencesLookupMap.get(sourcePrefix) || []; // O(1) lookup average
    // --- End Refactor Target 3 ---

    if (originLinks.length === 0) return { nodes: [], links: [] };

    // (Rest of the logic remains the same as MVP v5.0 - derive nodes, set value=1, sort nodes)
    let finalNodes = [];
    let finalLinks = [];
    const nodeMap = new Map();
    const ensureNode = (id) => { /* ... ensureNode helper ... */
         if (!id || nodeMap.has(id)) return; const parsed = parseReferenceId(id);
        if (!parsed) { nodeMap.set(id, { id: id, label: id, book: 'Unknown' }); return; }
        const bookNameKey = normalizeBookNameForId(parsed.book);
        const bookNameLabel = normalizeBookNameForText(parsed.book);
        let label = parsed.verse !== null ? `${bookNameLabel} ${parsed.chapter}:${parsed.verse}` : `${bookNameLabel} ${parsed.chapter}`;
        nodeMap.set(id, { id: id, label: label, book: bookNameKey });
     };

     if (viewMode === 'chapter') { /* Aggregate using originLinks */
         const chapterLinksAggregated = new Map();
         const sourceChapterId = `${normalizedBookForFiltering}${selectedChapter}`;
         ensureNode(sourceChapterId);
         originLinks.forEach(link => { /* ... aggregation logic ... */
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
    finalNodes.sort((a, b) => { /* ... canonical sort logic ... */
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