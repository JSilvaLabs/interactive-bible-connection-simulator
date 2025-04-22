// utils/dataService.js (Clean MVP v6.0 Version - NO JEST CODE)

import bibleDataRaw from '@/data/BSB.json';
import allReferencesRaw from '@/data/references.json';
import { BIBLE_BOOK_ORDER_MAP, getBookSortIndex } from './canonicalOrder';

// --- Module-level Caches ---
let bibleDataCache = null;
let referencesCache = null;
let bibleLookupMap = null;
let referencesLookupMap = null;

// --- Parsing and Normalization Functions ---

// EXPORTED - Needed by ReferenceListPanel
export const parseReferenceId = (referenceId) => {
    if (!referenceId) return null; const cleanedId = referenceId.trim();
    const dotRegex = /^([1-3]?[\s\w\.]+)\.(\d+)\.(\d+)$/i; const dotMatch = cleanedId.match(dotRegex);
    if (dotMatch) { return { book: dotMatch[1].trim(), chapter: parseInt(dotMatch[2], 10), verse: parseInt(dotMatch[3], 10) }; }
    const concatRegex = /^([1-3]?[A-Za-z]+)(\d+)(?:[v:](\d+))?$/i; const concatMatch = cleanedId.replace(/\s/g, '').match(concatRegex);
    if (concatMatch) { return { book: concatMatch[1], chapter: parseInt(concatMatch[2], 10), verse: concatMatch[3] ? parseInt(concatMatch[3], 10) : null }; }
    return null;
};

// Internal helper
const normalizeBookNameForText = (inputName) => {
    if (!inputName) return ''; const cleanedName = inputName.trim(); const lowerCaseCleaned = cleanedName.toLowerCase();
    const map = { /* ... comprehensive map ... */ 'gen': 'Genesis', 'rev': 'Revelation of John'};
    for (const key in map) { if (lowerCaseCleaned === key || lowerCaseCleaned === key.replace(/(\d)/, '$1 ')) return map[key]; }
    return cleanedName.replace(/\b\w/g, l => l.toUpperCase());
};

// EXPORTED - Needed by ReferenceListPanel
export const normalizeBookNameForId = (inputName) => {
     if (!inputName) return 'Unknown'; const cleanedName = inputName.replace(/\s/g, '').toLowerCase();
     const map = { /* ... comprehensive map ... */ 'genesis': 'Genesis', 'revelation':'Revelation of John'};
     const normalized = map[cleanedName];
     return normalized || normalizeBookNameForText(inputName) || inputName;
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
    console.time("Load/Preprocess Bible Text"); try { bibleDataCache = bibleDataRaw; if (!bibleLookupMap) { bibleLookupMap = new Map(); bibleDataCache.books.forEach(book => { const chapterMap = new Map(); const canonicalBookName = normalizeBookNameForText(book.name); book.chapters.forEach(chap => { const verseMap = new Map(); chap.verses.forEach(v => { verseMap.set(v.verse, v.text); }); chapterMap.set(chap.chapter, verseMap); }); bibleLookupMap.set(canonicalBookName, chapterMap); }); console.log("Bible lookup map created."); } console.timeEnd("Load/Preprocess Bible Text"); return bibleDataCache; } catch (error) { console.error("Error loading/processing Bible data:", error); throw new Error("Failed to load Bible data."); }
};

export const loadAllReferences = () => {
    if (referencesCache) return referencesCache; console.time("Load/Preprocess References"); try { if (!Array.isArray(allReferencesRaw)) throw new Error("references.json not valid array."); referencesCache = allReferencesRaw; if (!referencesLookupMap) { referencesLookupMap = new Map(); referencesCache.forEach(link => { if (!link || !link.source) return; const parsedSource = parseReferenceId(link.source); if(parsedSource && parsedSource.verse !== null) { const prefix = `${normalizeBookNameForId(parsedSource.book)}${parsedSource.chapter}v`; if (!referencesLookupMap.has(prefix)) { referencesLookupMap.set(prefix, []); } referencesLookupMap.get(prefix).push(link); } }); console.log(`References lookup map created with ${referencesLookupMap.size} prefixes.`); } console.timeEnd("Load/Preprocess References"); return referencesCache; } catch (error) { console.error("Error loading/processing references data:", error); throw new Error("Failed to load references data."); }
};

// --- Metadata Functions ---
export const getBooks = (bibleData) => {
    if (!bibleData || !bibleData.books) return []; const bookNames = bibleData.books.map(b => b.name);
    return bookNames.sort((a, b) => getBookSortIndex(normalizeBookNameForText(a)) - getBookSortIndex(normalizeBookNameForText(b)));
};
export const getChapters = (bibleData, bookName) => {
    if (!bibleData || !bookName || !bibleData.books) return []; const normalizedBook = normalizeBookNameForText(bookName);
    const book = bibleData.books.find(b => normalizeBookNameForText(b.name) === normalizedBook);
    return book ? book.chapters.map(c => c.chapter).sort((a, b) => a - b) : [];
};

// --- Optimized Text Retrieval ---
export const getTextForReference = (bibleData, referenceId) => {
    if (!bibleLookupMap) { loadBibleText(); } if (!bibleLookupMap) return "Bible data not available/processed."; if (!referenceId) return "Select node...";
    const parsedRef = parseReferenceId(referenceId); if (!parsedRef) return `Invalid ID: ${referenceId}`;
    const normalizedBookName = normalizeBookNameForText(parsedRef.book);
    try { const chapterMap = bibleLookupMap.get(normalizedBookName); if (!chapterMap) return `Book not found [Map]: ${normalizedBookName}`; const verseMap = chapterMap.get(parsedRef.chapter); if (!verseMap) return `Chapter not found [Map]: ${normalizedBookName} ${parsedRef.chapter}`;
        if (parsedRef.verse !== null) { const text = verseMap.get(parsedRef.verse); return text ? `${normalizedBookName} ${parsedRef.chapter}:${parsedRef.verse}\n${text.trim()}` : `Verse not found [Map]: ${referenceId}`; } else { const chapterHeader = `${normalizedBookName} ${parsedRef.chapter}\n--------------------\n`; const versesText = Array.from(verseMap.entries()).sort(([vA], [vB]) => vA - vB).map(([vNum, vText]) => `${vNum} ${vText.trim()}`).join('\n\n'); return chapterHeader + versesText; }
    } catch(error) { console.error(`Error in getTextForReference for ${referenceId}:`, error); return `Error looking up text.`; }
};


// --- Optimized Connection Filtering ---
export const getConnectionsFor = (allLinks, selectedBook, selectedChapter, viewMode) => {
     if (!referencesLookupMap) { loadAllReferences(); } if (!referencesLookupMap) return { nodes: [], links: [] };
     if (!selectedBook || !selectedChapter) return null;
    const normalizedBookForFiltering = normalizeBookNameForId(selectedBook);
    const sourcePrefix = `${normalizedBookForFiltering}${selectedChapter}v`;
    const originLinks = referencesLookupMap.get(sourcePrefix) || [];
    if (originLinks.length === 0) return { nodes: [], links: [] };
    let finalNodes = []; let finalLinks = []; const nodeMap = new Map();
    const ensureNode = (id) => { /* ... ensureNode helper logic ... */ if (!id || nodeMap.has(id)) return; const parsed = parseReferenceId(id); if (!parsed) { nodeMap.set(id, { id: id, label: id, book: 'Unknown' }); return; } const bookNameKey = normalizeBookNameForId(parsed.book); const bookNameLabel = normalizeBookNameForText(parsed.book); let label = parsed.verse !== null ? `${bookNameLabel} ${parsed.chapter}:${parsed.verse}` : `${bookNameLabel} ${parsed.chapter}`; nodeMap.set(id, { id: id, label: label, book: bookNameKey }); };
     if (viewMode === 'chapter') { /* ... Aggregate originLinks ... */ const chapterLinksAggregated = new Map(); const sourceChapterId = `${normalizedBookForFiltering}${selectedChapter}`; ensureNode(sourceChapterId); originLinks.forEach(link => { const targetParsed = parseReferenceId(link.target); if (targetParsed) { const targetBookNormalized = normalizeBookNameForId(targetParsed.book); const targetChapterId = `${targetBookNormalized}${targetParsed.chapter}`; ensureNode(targetChapterId); const key = `${sourceChapterId}->${targetChapterId}`; if (!chapterLinksAggregated.has(key)) chapterLinksAggregated.set(key, { source: sourceChapterId, target: targetChapterId, value: 0 }); chapterLinksAggregated.get(key).value += 1; } }); finalLinks = Array.from(chapterLinksAggregated.values()); } else { /* Verse view */ finalLinks = originLinks.map(link => ({ ...link, value: 1 })); finalLinks.forEach(link => { ensureNode(link.source); ensureNode(link.target); }); }
    finalNodes = Array.from(nodeMap.values());
    finalNodes.sort((a, b) => { /* ... canonical sort logic ... */ const indexA = getBookSortIndex(a.book); const indexB = getBookSortIndex(b.book); if (indexA !== indexB) return indexA - indexB; const parsedA = parseReferenceId(a.id); const parsedB = parseReferenceId(b.id); if (parsedA && parsedB) { if (parsedA.chapter !== parsedB.chapter) return parsedA.chapter - parsedB.chapter; const verseA = parsedA.verse === null ? 0 : parsedA.verse; const verseB = parsedB.verse === null ? 0 : parsedB.verse; if (verseA !== verseB) return verseA - verseB; } return a.id.localeCompare(b.id); });
    return { nodes: finalNodes, links: finalLinks };
};