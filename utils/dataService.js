// utils/dataService.js (MVP v8.3 - Verified Exports & Normalization)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

// --- Module-level Caches ---
let bibleDataCache = null;
let referencesCache = null;
let bibleLookupMap = null; // Map<CanonBookNameForText, Map<ChapterNum, Map<VerseNum, VerseText>>>
let referencesLookupMap = null; // Map<SourcePrefix (e.g., Genesis1v), Link[]>
let isBibleProcessed = false;
let isReferencesProcessed = false;

// --- Parsing and Normalization Functions ---

// EXPORTED: Parses reference IDs (Handles BookChvVs, BookCh, Book.Ch.Vs)
export const parseReferenceId = (referenceId) => {
    if (!referenceId) return null; const cleanedId = referenceId.trim();
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i; const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i; const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex);
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }
    // console.warn(`Could not parse reference ID: ${referenceId}`);
    return null;
};

// EXPORTED: Normalizes book names for display or matching BSB.json keys/bibleLookupMap keys
export const normalizeBookNameForText = (inputName) => {
    if (!inputName) return '';
    const cleanedName = inputName.trim();
    const lowerCaseCleaned = cleanedName.toLowerCase().replace('.', '');
    // Comprehensive map - keys cover variants, values match canonicalOrder.js/BSB.json EXACTLY
    const map = {
        'gen': 'Genesis', 'exo': 'Exodus', 'lev': 'Leviticus', 'num': 'Numbers', 'deut': 'Deuteronomy',
        'josh': 'Joshua', 'judg': 'Judges', 'ruth': 'Ruth',
        '1sam': '1 Samuel', '1 samuel': '1 Samuel', 'i samuel': '1 Samuel', '1st samuel': '1 Samuel',
        '2sam': '2 Samuel', '2 samuel': '2 Samuel', 'ii samuel': '2 Samuel', '2nd samuel': '2 Samuel',
        '1kgs': '1 Kings', '1 kings': '1 Kings', 'i kings': '1 Kings', '1st kings': '1 Kings',
        '2kgs': '2 Kings', '2 kings': '2 Kings', 'ii kings': '2 Kings', '2nd kings': '2 Kings',
        '1chr': '1 Chronicles', '1 chronicles': '1 Chronicles', 'i chronicles': '1 Chronicles', '1st chronicles': '1 Chronicles', '1ch': '1 Chronicles',
        '2chr': '2 Chronicles', '2 chronicles': '2 Chronicles', 'ii chronicles': '2 Chronicles', '2nd chronicles': '2 Chronicles', '2ch': '2 Chronicles',
        'ezra': 'Ezra', 'neh': 'Nehemiah', 'est': 'Esther', 'job': 'Job',
        'ps': 'Psalms', 'psalm': 'Psalms', 'psa': 'Psalms',
        'prov': 'Proverbs', 'eccl': 'Ecclesiastes',
        'song': 'Song of Solomon', 'songofsolomon': 'Song of Solomon', 'song of solomon': 'Song of Solomon', 'sos': 'Song of Solomon',
        'isa': 'Isaiah', 'jer': 'Jeremiah', 'lam': 'Lamentations', 'ezek': 'Ezekiel', 'dan': 'Daniel',
        'hos': 'Hosea', 'joel': 'Joel', 'amos': 'Amos', 'obad': 'Obadiah', 'jonah': 'Jonah', 'mic': 'Micah',
        'nah': 'Nahum', 'hab': 'Habakkuk', 'zeph': 'Zephaniah', 'hag': 'Haggai', 'zech': 'Zechariah', 'mal': 'Malachi',
        'matt': 'Matthew', 'mark': 'Mark', 'mk': 'Mark',
        'luke': 'Luke', 'lk': 'Luke', 'john': 'John', 'jn': 'John',
        'acts': 'Acts', 'rom': 'Romans',
        '1cor': '1 Corinthians', '1 corinthians': '1 Corinthians', 'i corinthians': '1 Corinthians', '1st corinthians': '1 Corinthians',
        '2cor': '2 Corinthians', '2 corinthians': '2 Corinthians', 'ii corinthians': '2 Corinthians', '2nd corinthians': '2 Corinthians',
        'gal': 'Galatians', 'eph': 'Ephesians',
        'phil': 'Philippians', 'col': 'Colossians',
        '1thess': '1 Thessalonians', '1 thessalonians': '1 Thessalonians', '1th': '1 Thessalonians', 'i thessalonians': '1 Thessalonians', '1st thessalonians': '1 Thessalonians',
        '2thess': '2 Thessalonians', '2 thessalonians': '2 Thessalonians', '2th': '2 Thessalonians', 'ii thessalonians': '2 Thessalonians', '2nd thessalonians': '2 Thessalonians',
        '1tim': '1 Timothy', '1 timothy': '1 Timothy', 'i timothy': '1 Timothy', '1st timothy': '1 Timothy',
        '2tim': '2 Timothy', '2 timothy': '2 Timothy', 'ii timothy': '2 Timothy', '2nd timothy': '2 Timothy',
        'titus': 'Titus', 'phlm': 'Philemon', 'heb': 'Hebrews', 'jas': 'James',
        '1pet': '1 Peter', '1 peter': '1 Peter', 'i peter': '1 Peter', '1st peter': '1 Peter',
        '2pet': '2 Peter', '2 peter': '2 Peter', 'ii peter': '2 Peter', '2nd peter': '2 Peter',
        '1jn': '1 John', '1john': '1 John', '1 john': '1 John', 'i john': '1 John', '1st john': '1 John',
        '2jn': '2 John', '2john': '2 John', '2 john': '2 John', 'ii john': '2 John', '2nd john': '2 John',
        '3jn': '3 John', '3john': '3 John', '3 john': '3 John', 'iii john': '3 John', '3rd john': '3 John',
        'jude': 'Jude',
        'rev': 'Revelation of John', 'revelation': 'Revelation of John'
    };
    const mappedName = map[lowerCaseCleaned];
    if (mappedName) return mappedName;
    for (const key in map) { if (lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) return map[key]; }
    // console.warn(`[normalizeBookNameForText] No specific map found for: '${inputName}', falling back to Title Case.`);
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};

// EXPORTED: Normalizes book names from IDs (e.g., "1Chronicles") to canonical name ("1 Chronicles").
export const normalizeBookNameForId = (inputName) => {
     if (!inputName) return 'Unknown';
     const cleanedName = inputName.replace(/[\s.]/g, '').toLowerCase();
     // Keys MUST match variants found in references.json IDs
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
         const textNormalized = normalizeBookNameForText(inputName);
         if (BIBLE_BOOK_ORDER_MAP.has(textNormalized)) { return textNormalized; }
         // console.warn(`[normalizeBookNameForId] Could not normalize ID book part: '${inputName}'`);
         return 'Unknown'; // Return 'Unknown' if truly unmappable
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
// EXPORTED
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
                if (!BIBLE_BOOK_ORDER_MAP.has(canonicalBookName)) { /* console.warn(`[loadBibleText] Book name "${book.name}" (normalized to "${canonicalBookName}") not in canonicalOrder.js map!`); */ }
                book.chapters.forEach(chap => {
                    const verseMap = new Map();
                    chap.verses.forEach(v => { verseMap.set(v.verse, v.text); });
                    chapterMap.set(chap.chapter, verseMap);
                });
                bibleLookupMap.set(canonicalBookName, chapterMap);
            });
            isBibleProcessed = true;
            // console.log("Bible lookup map created.");
        }
        // console.timeEnd("Load/Preprocess Bible Text");
        return bibleDataCache;
    } catch (error) { console.error("Error loading/processing Bible data:", error); isBibleProcessed = false; throw new Error("Failed to load Bible data."); }
};
// EXPORTED
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
                    const bookNameKey = normalizeBookNameForId(parsedSource.book);
                    // if (!BIBLE_BOOK_ORDER_MAP.has(bookNameKey)) { /* console.warn(`[loadAllReferences] Source ref "${link.source}" book "${parsedSource.book}" normalized to "${bookNameKey}" - not in canonical map!`); */ }
                    const prefix = `${bookNameKey}${parsedSource.chapter}v`; // Prefix uses CANONICAL name
                    if (!referencesLookupMap.has(prefix)) { referencesLookupMap.set(prefix, []); }
                    referencesLookupMap.get(prefix).push(link);
                }
            });
            isReferencesProcessed = true;
            // console.log(`References lookup map created with ${referencesLookupMap.size} prefixes.`);
        }
        // console.timeEnd("Load/Preprocess References");
        return referencesCache;
    } catch (error) { console.error("Error loading/processing references data:", error); isReferencesProcessed = false; throw new Error("Failed to load references data."); }
};

// --- Metadata Functions ---
// EXPORTED
export const getBooks = (bibleData) => {
    // console.log("[getBooks] Called.");
    if (!bibleData || !bibleData.books || bibleData.books.length === 0) return [];
    try {
        const canonicalNames = bibleData.books.map(b => normalizeBookNameForText(b.name));
        const uniqueCanonicalNames = [...new Set(canonicalNames)];
        // console.log(`[getBooks] Unique canonical names count: ${uniqueCanonicalNames.length}`);
        const sortedNames = uniqueCanonicalNames.sort((a, b) => {
            const indexA = getBookSortIndex(a); const indexB = getBookSortIndex(b);
            // if (indexA === 999 && a !== 'Unknown') console.warn(`[getBooks] Sort index not found for normalized name: '${a}'`);
            // if (indexB === 999 && b !== 'Unknown') console.warn(`[getBooks] Sort index not found for normalized name: '${b}'`);
            return indexA - indexB;
        });
        // console.log("[getBooks] Returning sorted list (first 10):", sortedNames.slice(0,10));
        return sortedNames;
    } catch (error) { console.error("[getBooks] Error during processing:", error); return []; }
};
// EXPORTED
export const getChapters = (bibleData, bookName) => {
    if (!bibleData || !bookName || !bibleData.books) return [];
    const normalizedBook = normalizeBookNameForText(bookName);
    if (bibleLookupMap) { const chapterMap = bibleLookupMap.get(normalizedBook); return chapterMap ? Array.from(chapterMap.keys()).sort((a,b) => a - b) : []; }
    else { const book = bibleData.books.find(b => normalizeBookNameForText(b.name) === normalizedBook); return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : []; }
};
// EXPORTED
export const getVersesForChapter = (bibleData, bookName, chapterNum) => {
    if (!bibleLookupMap) { loadBibleText(); } if (!bibleLookupMap || !bookName || !chapterNum) return [];
    try { const canonicalBook = normalizeBookNameForText(bookName); const chapterMap = bibleLookupMap.get(canonicalBook); const verseMap = chapterMap?.get(chapterNum); if (verseMap instanceof Map) { return Array.from(verseMap.keys()).sort((a, b) => a - b); } } catch (error) { console.error(`Error getting verses for ${bookName} ${chapterNum}:`, error); } return [];
};

// --- Optimized Text Retrieval ---
// EXPORTED
export const getTextForReference = (bibleData, referenceId) => {
    if (!bibleLookupMap) { loadBibleText(); } if (!bibleLookupMap) return "Bible data not available/processed."; if (!referenceId) return "Select node...";
    const parsedRef = parseReferenceId(referenceId); if (!parsedRef) return `Invalid ID: ${referenceId}`; const normalizedBookName = normalizeBookNameForText(parsedRef.book);
    try { const chapterMap = bibleLookupMap.get(normalizedBookName); if (!chapterMap) return `Book not found [Map]: ${normalizedBookName}`; const verseMap = chapterMap.get(parsedRef.chapter); if (!verseMap) return `Chapter not found [Map]: ${normalizedBookName} ${parsedRef.chapter}`; if (parsedRef.verse !== null) { const text = verseMap.get(parsedRef.verse); return text ? `${normalizedBookName} ${parsedRef.chapter}:${parsedRef.verse}\n${text.trim()}` : `Verse not found [Map]: ${referenceId}`; } else { const chapterHeader = `${normalizedBookName} ${parsedRef.chapter}\n--------------------\n`; const versesText = Array.from(verseMap.entries()).sort(([vA], [vB]) => vA - vB).map(([vNum, vText]) => `${vNum} ${vText.trim()}`).join('\n\n'); return chapterHeader + versesText; } } catch(error) { console.error(`Error in getTextForReference for ${referenceId}:`, error); return `Error looking up text.`; }
};

// --- Optimized Connection Filtering ---
// EXPORTED
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => {
     if (!referencesLookupMap) { loadAllReferences(); } if (!referencesLookupMap) return { nodes: [], links: [] };
     if (!selectedBook || !selectedChapter) return null;
    const normalizedBookForFiltering = normalizeBookNameForId(selectedBook); // Use ID norm for prefix
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`;
    const originLinks = referencesLookupMap.get(sourcePrefix) || [];
    if (originLinks.length === 0) return { nodes: [], links: [] };
    let finalNodes = []; let finalLinks = []; const nodeMap = new Map();
    const ensureNode = (id) => { if (!id || nodeMap.has(id)) return; const parsed = parseReferenceId(id); if (!parsed) { nodeMap.set(id, { id: id, label: id, book: 'Unknown' }); return; } const bookNameKey = normalizeBookNameForId(parsed.book); const bookNameLabel = normalizeBookNameForText(parsed.book); let label = parsed.verse !== null ? `${bookNameLabel} ${parsed.chapter}:${parsed.verse}` : `${bookNameLabel} ${parsed.chapter}`; nodeMap.set(id, { id: id, label: label, book: bookNameKey }); };
     if (viewMode === 'chapter') { const chapterLinksAggregated = new Map(); const sourceChapterId = `${normalizedBookForFiltering}${selectedChapter}`; ensureNode(sourceChapterId); originLinks.forEach(link => { const targetParsed = parseReferenceId(link.target); if (targetParsed) { const targetBookNormalized = normalizeBookNameForId(targetParsed.book); const targetChapterId = `${targetBookNormalized}${targetParsed.chapter}`; ensureNode(targetChapterId); const key = `${sourceChapterId}->${targetChapterId}`; if (!chapterLinksAggregated.has(key)) chapterLinksAggregated.set(key, { source: sourceChapterId, target: targetChapterId, value: 0 }); chapterLinksAggregated.get(key).value += 1; } }); finalLinks = Array.from(chapterLinksAggregated.values()); } else { finalLinks = originLinks.map(link => ({ ...link, value: 1 })); finalLinks.forEach(link => { ensureNode(link.source); ensureNode(link.target); }); }
    finalNodes = Array.from(nodeMap.values());
    finalNodes.sort((a, b) => { const indexA = getBookSortIndex(a.book); const indexB = getBookSortIndex(b.book); if (indexA !== indexB) return indexA - indexB; const parsedA = parseReferenceId(a.id); const parsedB = parseReferenceId(b.id); if (parsedA && parsedB) { if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter; const verseA = parsedA.verse === null ? 0 : parsedA.verse; const verseB = parsedB.verse === null ? 0 : parsedB.verse; if (verseA !== verseB) return verseA - verseB; } return a.id.localeCompare(b.id); });
    return { nodes: finalNodes, links: finalLinks };
};