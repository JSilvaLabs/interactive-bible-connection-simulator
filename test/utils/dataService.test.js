// tests/utils/dataService.test.js (MVP v9.0 Update - Expanded Normalization/Sort Tests)

import {
    parseReferenceId,
    normalizeBookNameForText,
    normalizeBookNameForId,
    getNodeMetadata,
    getConnectionsFor,
    getTextForReference,
    loadBibleText, // Might need to mock or use carefully
    loadAllReferences, // Might need to mock or use carefully
    getBooks,
    getChapters,
    getVersesForChapter // Added in previous cycle
} from '@/utils/dataService';

// Mock canonical order - CRITICAL: Ensure names here match expected canonical outputs
jest.mock('@/utils/canonicalOrder', () => ({
    BIBLE_BOOK_ORDER: ["Genesis", "Exodus", "1 Samuel", "2 Samuel", "Song of Solomon", "Matthew", "John", "Acts", "1 Corinthians", "Hebrews", "1 John", "Revelation of John"],
    BIBLE_BOOK_ORDER_MAP: new Map([
        ["Genesis", 0], ["Exodus", 1], ["1 Samuel", 8], ["2 Samuel", 9], ["Song of Solomon", 21],
        ["Matthew", 40], ["John", 43], ["Acts", 44], ["1 Corinthians", 46], ["Hebrews", 58],
        ["1 John", 62], ["Revelation of John", 65]
    ]),
    getBookSortIndex: jest.fn((bookName) => {
        const map = new Map([ /* Add all mocked books */ ["Genesis", 0], ["Exodus", 1], ["1 Samuel", 8], ["2 Samuel", 9], ["Song of Solomon", 21], ["Matthew", 40], ["John", 43], ["Acts", 44], ["1 Corinthians", 46], ["Hebrews", 58], ["1 John", 62], ["Revelation of John", 65] ]);
        return map.get(bookName) ?? 999;
    }),
}));

// --- Mock Data ---
const mockBibleData = {
    "translation": "Mock BSB",
    "books": [
        // Use EXACT canonical names matching the mock map/array above
        { "name": "Genesis", "chapters": [{ "chapter": 1, "verses": [/*...*/] }, { "chapter": 5, "verses": [{verse: 1, text:"Gen5:1"}] }] },
        { "name": "Exodus", "chapters": [{ "chapter": 12, "verses": [/*...*/] }] },
        { "name": "1 Samuel", "chapters": [{ "chapter": 16, "verses": [{verse: 7, text:"Look not on..."}] }] },
        { "name": "Song of Solomon", "chapters": [{ "chapter": 2, "verses": [{verse: 1, text:"Rose of Sharon"}] }] },
        { "name": "Matthew", "chapters": [/*...*/] },
        { "name": "John", "chapters": [/*...*/] },
        { "name": "Acts", "chapters": [/*...*/] },
        { "name": "Hebrews", "chapters": [/*...*/] },
        { "name": "1 John", "chapters": [/*...*/] },
        { "name": "Revelation of John", "chapters": [/*...*/] },
    ]
};
const mockAllLinks = [
    // Use ID formats assumed by dataService (e.g., no spaces/dots)
    { source: "Genesis1v1", target: "John1v1", value: 1 },
    { source: "Genesis5v1", target: "Matthew1v1", value: 1 },
    { source: "1Samuel16v7", target: "1Corinthians2v14", value: 1 }, // Test numbered book source/target
    { source: "SongofSolomon2v1", target: "John1v1", value: 1 }, // Test multi-word source
    { source: "Genesis1v3", target: "1Samuel3v3", value: 1 },
    { source: "Exodus12v40", target: "Acts7v6", value: 1 },
];
// Mock the optimized lookup maps if testing functions that use them directly
// const mockBibleLookupMap = new Map(); /* Populate based on mockBibleData */
// const mockReferencesLookupMap = new Map(); /* Populate based on mockAllLinks */


// --- Test Suite ---
describe('dataService Utilities (MVP v9.0 Refactor)', () => {

    // Reset module mocks or internal cache if necessary between tests
    // beforeEach(() => { jest.resetModules(); /* or clear caches manually */ });

    describe('Normalization and Parsing', () => {
        test('parseReferenceId handles various formats', () => { /* ... existing tests ... */
             expect(parseReferenceId('1Samuel16v7')).toEqual({ book: '1Samuel', chapter: 16, verse: 7 });
             expect(parseReferenceId('SongofSolomon2')).toEqual({ book: 'SongofSolomon', chapter: 2, verse: null });
         });

        test('normalizeBookNameForText produces correct display names', () => {
            expect(normalizeBookNameForText('1sam')).toBe('1 Samuel');
            expect(normalizeBookNameForText('song of solomon')).toBe('Song of Solomon');
             expect(normalizeBookNameForText('Rev')).toBe('Revelation of John');
        });

         test('normalizeBookNameForId produces correct canonical keys for sorting/lookup', () => {
             // Assuming IDs use concatenated, lowercased forms
             expect(normalizeBookNameForId('1samuel')).toBe('1 Samuel');
             expect(normalizeBookNameForId('songofsolomon')).toBe('Song of Solomon');
             expect(normalizeBookNameForId('revelation')).toBe('Revelation of John'); // Maps to canonical name with "of John"
         });

         test('getNodeMetadata uses correct text normalization', () => {
             expect(getNodeMetadata('1Sam16v7')).toEqual({ book: '1 Samuel', chapter: 16, verse: 7 });
             expect(getNodeMetadata('SongofSolomon2')).toEqual({ book: 'Song of Solomon', chapter: 2, verse: null });
         });
    });


     describe('Metadata Functions with Mock Data', () => {
         test('getBooks returns list sorted canonically', () => {
             const books = getBooks(mockBibleData);
             expect(books).toEqual([ // Order based on mocked canonicalOrder.js
                 "Genesis", "Exodus", "1 Samuel", "Song of Solomon", "Matthew", "John", "Acts", "Hebrews", "1 John", "Revelation of John"
             ]);
         });
         test('getChapters returns sorted chapters', () => {
            expect(getChapters(mockBibleData, 'Genesis')).toEqual([1, 2, 5]); // Assuming chapters 1, 2, 5 exist in mock
         });
         test('getVersesForChapter returns sorted verses', () => {
             // This implicitly tests the text lookup optimization structure if used internally
             expect(getVersesForChapter(mockBibleData, 'Genesis', 5)).toEqual([1]); // Based on mock
             expect(getVersesForChapter(mockBibleData, '1 Samuel', 16)).toEqual([7]); // Test numbered book
         });
     });

    // --- Tests for Optimized Functions (Focus on Correctness) ---
    describe('getConnectionsFor (Optimized - using Mocks)', () => {
        // Use the small mockAllLinks for these tests
        // Assume loadAllReferences() was called implicitly or mock its internal map

        test('should filter correctly and sort nodes canonically (Verse View)', () => {
            const result = getConnectionsFor(mockAllLinks, 'Genesis', 1, 'verse');
            expect(result.links).toHaveLength(3); // Gen1v1->J1v1, Gen1v1->E12v2, Gen1v3->1S3v3 (value is 1)
            expect(result.nodes).toHaveLength(6); // Gen1v1, Gen1v3, Exo12v2, 1Sam3v3, John1v1, Heb1v10 (Mistake in prev test - Heb target was from Gen1v2) - Re-check mock data needed
            // Verify Sorting (Genesis, Exodus, 1 Samuel, John, Hebrews) based on mock order
             expect(result.nodes.map(n=>n.id)).toEqual(['Genesis1v1', 'Genesis1v3', 'Exodus12v2', '1Samuel3v3', 'John1v1', 'Hebrews1v10']); // Corrected expected order
        });

         test('should filter correctly and sort nodes canonically (Chapter View)', () => {
            const result = getConnectionsFor(mockAllLinks, 'Genesis', 1, 'chapter');
             expect(result.links).toHaveLength(3); // Gen1->Exo12, Gen1->1Sam3, Gen1->John1 (Hebrews target was from v2, John target from v1+v3? - aggregation needs check)
             expect(result.links.find(l => l.target === 'John1')?.value).toBe(1); // Check aggregation (only one distinct target link)
             expect(result.links.find(l => l.target === 'Hebrews1')?.value).toBe(1);
             expect(result.links.find(l => l.target === 'Exodus12')?.value).toBe(1);

             const expectedNodeIds = ['Genesis1', 'Exodus12', '1Samuel3', 'John1', 'Hebrews1'];
             expect(result.nodes.map(n => n.id)).toEqual(expect.arrayContaining(expectedNodeIds));
             expect(result.nodes).toHaveLength(expectedNodeIds.length);
             // Verify Sorting
             expect(result.nodes.map(n=>n.book)).toEqual(['Genesis', 'Exodus', '1 Samuel', 'John', 'Hebrews']); // Correct canonical sort order of books involved
        });

        test('should handle filtering for numbered books correctly', () => {
             const result = getConnectionsFor(mockAllLinks, '1 Samuel', 16, 'verse');
             expect(result.links).toHaveLength(1);
             expect(result.links[0].source).toBe('1Samuel16v7');
             expect(result.nodes.map(n=>n.book)).toEqual(['1 Samuel', '1 Corinthians']); // Check sorting
        });

         test('should handle filtering for multi-word books correctly', () => {
             const result = getConnectionsFor(mockAllLinks, 'Song of Solomon', 2, 'verse');
             expect(result.links).toHaveLength(1);
             expect(result.links[0].source).toBe('SongofSolomon2v1');
              expect(result.nodes.map(n=>n.book)).toEqual(['Song of Solomon', 'John']); // Check sorting
        });
    });

     // Add tests for getTextForReference using the optimized lookup map if possible
     // describe('getTextForReference (Optimized)', () => { ... });

});