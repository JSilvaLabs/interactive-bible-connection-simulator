// tests/utils/dataService.test.js (MVP v6.1 Update - Testing Normalization/Sorting)

import {
    parseReferenceId,
    normalizeBookNameForText,
    normalizeBookNameForId,
    getNodeMetadata,
    getConnectionsFor,
    getBooks,
    getChapters,
    // loadBibleText, // Usually avoid direct load in unit tests, use mocks
    // loadAllReferences,
} from '@/utils/dataService';

// Mock canonical order - Ensure it includes the books being tested
jest.mock('@/utils/canonicalOrder', () => ({
    BIBLE_BOOK_ORDER: [
        "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
        "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", // Numbered books
        "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", // Multi-word
        "Isaiah", /*...*/ "Matthew", /*...*/ "John", /*...*/ "Acts", /*...*/ "Hebrews", /*...*/ "1 John", /*...*/ "Revelation of John"
    ],
    BIBLE_BOOK_ORDER_MAP: new Map([
        ["Genesis", 0], ["Exodus", 1], ["Leviticus", 2], /*...*/ ["Ruth", 7],
        ["1 Samuel", 8], ["2 Samuel", 9], ["1 Kings", 10], ["2 Kings", 11], ["1 Chronicles", 12], ["2 Chronicles", 13], /*...*/
        ["Psalms", 18], ["Proverbs", 19], ["Ecclesiastes", 20], ["Song of Solomon", 21], /*...*/
        ["Matthew", 40], ["John", 43], ["Acts", 44], ["Hebrews", 58], ["1 John", 62], ["Revelation of John", 65]
        // Add mappings for all books in the mock order
    ]),
    getBookSortIndex: jest.fn((bookName) => {
        // Simplified mock lookup based on the map above
        const map = new Map([["Genesis", 0], ["Exodus", 1], ["1 Samuel", 8], ["2 Samuel", 9], ["Song of Solomon", 21], ["Matthew", 40], ["John", 43], ["Acts", 44], ["Hebrews", 58], ["1 John", 62], ["Revelation of John", 65]]);
        return map.get(bookName) ?? 999;
    }),
}));

// --- Mock Data ---
const mockBibleData = {
    "translation": "Mock BSB",
    "books": [
        // Ensure this includes names exactly as expected after text normalization
        { "name": "Genesis", "chapters": [/*...*/] },
        { "name": "Exodus", "chapters": [/*...*/] },
        { "name": "1 Samuel", "chapters": [/*...*/] }, // Canonical name with space
        { "name": "2 Samuel", "chapters": [/*...*/] },
        { "name": "Song of Solomon", "chapters": [/*...*/] },
        { "name": "Matthew", "chapters": [/*...*/] },
        { "name": "John", "chapters": [/*...*/] },
        { "name": "Acts", "chapters": [/*...*/] },
        { "name": "Hebrews", "chapters": [/*...*/] },
        { "name": "1 John", "chapters": [/*...*/] }, // Canonical name with space
        { "name": "Revelation of John", "chapters": [/*...*/] }, // Canonical name
    ]
};
const mockAllLinks = [
    { source: "Genesis1v1", target: "John1v1", value: 1 },
    { source: "1Samuel2v1", target: "Luke1v52", value: 1 }, // Assumes ID uses "1Samuel"
    { source: "SongofSolomon2v1", target: "John1v1", value: 1 }, // Assumes ID uses "SongofSolomon"
    { source: "Genesis1v3", target: "1Samuel3v3", value: 1 },
];


// --- Test Suite ---
describe('dataService Utilities (MVP v6.1 Refinements)', () => {

    describe('parseReferenceId', () => {
        // (Keep existing tests)
         test('should parse numbered books correctly', () => {
             expect(parseReferenceId('1Samuel2v10')).toEqual({ book: '1Samuel', chapter: 2, verse: 10 });
             expect(parseReferenceId('2Kings5')).toEqual({ book: '2Kings', chapter: 5, verse: null });
             expect(parseReferenceId('1 Chr.10.1')).toEqual({ book: '1 Chr', chapter: 10, verse: 1 }); // Test dot variant if used
         });
    });

    describe('Normalization Functions', () => {
        test('normalizeBookNameForText handles numbered/multi-word books', () => {
            expect(normalizeBookNameForText('1sam')).toBe('1 Samuel');
            expect(normalizeBookNameForText('1 samuel')).toBe('1 Samuel');
            expect(normalizeBookNameForText('song')).toBe('Song of Solomon');
            expect(normalizeBookNameForText('Song of Solomon')).toBe('Song of Solomon');
            expect(normalizeBookNameForText('rev')).toBe('Revelation of John');
        });
         test('normalizeBookNameForId handles numbered/multi-word books from ID format', () => {
            // Assumes IDs use concatenated format like '1samuel', 'songofsolomon'
            expect(normalizeBookNameForId('1samuel')).toBe('1 Samuel'); // -> Canonical with space
            expect(normalizeBookNameForId('songofsolomon')).toBe('Song of Solomon');
            expect(normalizeBookNameForId('revelation')).toBe('Revelation of John'); // -> Canonical full name
        });
    });

    describe('getNodeMetadata', () => {
        // (Keep existing tests)
        test('should return correct metadata for numbered/multi-word books', () => {
             expect(getNodeMetadata('1Sam16v7')).toEqual({ book: '1 Samuel', chapter: 16, verse: 7 });
             expect(getNodeMetadata('SongofSolomon8')).toEqual({ book: 'Song of Solomon', chapter: 8, verse: null });
        });
    });

    describe('getBooks', () => {
         test('should return canonically sorted list including numbered/multi-word books', () => {
             const books = getBooks(mockBibleData);
             // Check order based on the mocked canonical order
             expect(books).toEqual([
                 "Genesis", "Exodus", "1 Samuel", "2 Samuel", "Song of Solomon", "Matthew", "John", "Acts", "Hebrews", "1 John", "Revelation of John"
             ]);
         });
    });

    describe('getConnectionsFor', () => {
        test('should filter correctly for numbered books (e.g., 1 Samuel 2)', () => {
            const result = getConnectionsFor(mockAllLinks, '1 Samuel', 2, 'verse'); // Use canonical name for selection
            expect(result).not.toBeNull();
            // Check if the link originating from "1Samuel2v..." was found
            expect(result.links).toHaveLength(1);
            expect(result.links[0].source).toBe('1Samuel2v1');
            // Check nodes derived include 1 Samuel and Luke (based on mock link)
            const nodeIds = result.nodes.map(n => n.id);
            expect(nodeIds).toEqual(expect.arrayContaining(['1Samuel2v1', 'Luke1v52']));
             // Check sorting of nodes derived
             expect(result.nodes[0].book).toBe('1 Samuel'); // Should come before Luke
             expect(result.nodes[1].book).toBe('Luke');
        });

        test('should derive nodes with correct canonical book name for sorting', () => {
             const result = getConnectionsFor(mockAllLinks, 'Song of Solomon', 2, 'verse');
             expect(result).not.toBeNull();
             expect(result.links).toHaveLength(1);
             // Check node derived from 'SongofSolomon2v1' has book: 'Song of Solomon'
             const sourceNode = result.nodes.find(n => n.id === 'SongofSolomon2v1');
             expect(sourceNode?.book).toBe('Song of Solomon');
             // Check node derived from 'John1v1' has book: 'John'
             const targetNode = result.nodes.find(n => n.id === 'John1v1');
             expect(targetNode?.book).toBe('John');
             // Check overall sort order (John should come after Song of Solomon)
             expect(result.nodes[0].book).toBe('Song of Solomon');
             expect(result.nodes[1].book).toBe('John');
        });
    });

});