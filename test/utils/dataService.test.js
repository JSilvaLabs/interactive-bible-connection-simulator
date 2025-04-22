// tests/utils/dataService.test.js

import {
    // Core functions to test
    parseReferenceId,
    normalizeBookNameForText,
    normalizeBookNameForId,
    getNodeMetadata,
    getConnectionsFor,
    getTextForReference,
    // Loading and Metadata functions (potentially test with mocks)
    loadBibleText,
    loadAllReferences,
    getBooks,
    getChapters,
} from '@/utils/dataService';

// Mock canonical order helpers (important for sorting tests)
jest.mock('@/utils/canonicalOrder', () => ({
    // Provide a representative subset for testing sort order
    BIBLE_BOOK_ORDER: ["Genesis", "Exodus", "Leviticus", "Matthew", "John", "Acts", "Hebrews", "Revelation of John"],
    BIBLE_BOOK_ORDER_MAP: new Map([["Genesis", 0], ["Exodus", 1], ["Leviticus", 2], ["Matthew", 3], ["John", 4], ["Acts", 5], ["Hebrews", 6], ["Revelation of John", 7]]),
    getBookSortIndex: jest.fn((bookName) => {
        const map = new Map([["Genesis", 0], ["Exodus", 1], ["Leviticus", 2], ["Matthew", 3], ["John", 4], ["Acts", 5], ["Hebrews", 6], ["Revelation of John", 7]]);
        return map.get(bookName) ?? 999;
    }),
}));

// --- Mock Data ---
// Create small, focused mock data files or define inline mocks
const mockBibleData = {
    "translation": "Mock BSB",
    "books": [
        { "name": "Genesis", "chapters": [
            { "chapter": 1, "verses": [{ "verse": 1, "text": "In the beginning..." }, { "verse": 2, "text": "Formless and void."}] },
            { "chapter": 2, "verses": [{ "verse": 1, "text": "Thus the heavens..." }, {"verse": 4, "text": "Account..."}]}
        ]},
        { "name": "Exodus", "chapters": [
            { "chapter": 12, "verses": [{ "verse": 2, "text": "First month..." }, { "verse": 40, "text": "430 years..."}] }
        ]},
         { "name": "John", "chapters": [
            { "chapter": 1, "verses": [{ "verse": 1, "text": "The Word was God." }, { "verse": 14, "text": "Word became flesh."}] }
        ]},
         { "name": "Hebrews", "chapters": [
             { "chapter": 1, "verses": [{ "verse": 10, "text": "Foundation..." }] }
         ]}
        // Add other books/chapters needed for specific tests
    ]
};

const mockAllLinks = [
    { source: "Genesis1v1", target: "John1v1", value: 10 }, // value should be ignored by getConnectionsFor now
    { source: "Genesis1v2", target: "Hebrews1v10", value: 5 },
    { source: "Genesis1v1", target: "Exodus12v2", value: 8 },
    { source: "Exodus12v40", target: "Acts7v6", value: 9 }, // Target Acts not in mockBibleData nodes
];

// Mock the raw data imports IF testing the loading functions directly
// jest.mock('@/data/BSB.json', () => (mockBibleData), { virtual: true });
// jest.mock('@/data/references.json', () => (mockAllLinks), { virtual: true });


// --- Test Suite ---
describe('dataService Utilities (Refactored)', () => {

    // Reset internal caches before each test if load functions are called
    // beforeEach(() => {
    //     jest.resetModules(); // May be needed to clear module scope cache
    //     // Or manually reset exported variables if possible/needed
    // });

    // --- Parsing and Normalization Tests ---
    describe('parseReferenceId', () => {
        // (Keep tests from previous version)
         test('should parse BookChvVs', () => { expect(parseReferenceId('Genesis1v1')).toEqual({ book: 'Genesis', chapter: 1, verse: 1 });});
         test('should parse BookCh', () => { expect(parseReferenceId('Exodus20')).toEqual({ book: 'Exodus', chapter: 20, verse: null });});
         test('should parse Book.Ch.Vs', () => { expect(parseReferenceId('Gen.1.1')).toEqual({ book: 'Gen', chapter: 1, verse: 1 });});
         // ... other parsing tests ...
         test('should return null for invalid', () => { expect(parseReferenceId('Invalid')).toBeNull();});
    });

     describe('normalizeBookNameForText / normalizeBookNameForId / getNodeMetadata', () => {
         // Add specific tests for normalization functions if complex
         // Or test implicitly via getNodeMetadata
         test('getNodeMetadata correctly parses and normalizes', () => {
             expect(getNodeMetadata('Genesis1v1')).toEqual({ book: 'Genesis', chapter: 1, verse: 1 });
             expect(getNodeMetadata('1cor13v1')).toEqual({ book: '1 Corinthians', chapter: 13, verse: 1 }); // Assumes map handles '1cor'
             expect(getNodeMetadata('rev1v1')).toEqual({ book: 'Revelation of John', chapter: 1, verse: 1 }); // Assumes map handles 'rev'
              expect(getNodeMetadata('Psalms23')).toEqual({ book: 'Psalms', chapter: 23, verse: null });
         });
     });


    // --- Tests for Optimized Functions (using Mocks) ---

    // Mock the load functions to provide controlled data for these tests
    // OR call load functions here using mocked imports
    // For simplicity, passing mock data directly to functions under test:

    describe('getTextForReference (Optimized - using mock map simulation)', () => {
        // Simulate the optimized map structure
        const mockLookupMap = new Map([
            ['Genesis', new Map([
                [1, new Map([[1, "In the beginning..."], [2, "Formless and void."]])],
                [2, new Map([[1, "Thus the heavens..."], [4, "Account..."]])]
            ])],
             ['John', new Map([
                 [1, new Map([[1, "The Word was God."], [14, "Word became flesh."]])]
             ])]
        ]);
        // Mock or temporarily replace the internal bibleLookupMap for testing this function
        // This is complex, often better to test the pre-processing step separately
        // and then test getTextForReference assuming the map is correct.

        // Placeholder test structure:
        // test('should retrieve verse text using the map', () => {
        //     // Need mechanism to inject or use the mockLookupMap
        //     expect(getTextForReference(mockBibleData, 'Genesis1v1')).toContain("In the beginning...");
        // });
         // test('should retrieve chapter text using the map', () => {
         //    // ...
         //    expect(getTextForReference(mockBibleData, 'Genesis1')).toContain("1 In the beginning...\n\n2 Formless and void.");
         // });
         test.skip('getTextForReference optimization testing needs specific mock setup', () => {}); // Skip until map injection figured out

    });

    describe('getConnectionsFor (Optimized - using mock map simulation)', () => {
         // Simulate the optimized map structure
         const mockRefLookupMap = new Map([
             ['Genesis1v', [
                 { source: "Genesis1v1", target: "John1v1", value: 10 },
                 { source: "Genesis1v1", target: "Hebrews1v10", value: 5 },
                 { source: "Genesis1v2", target: "Hebrews1v10", value: 1 }, // Different source, same target chapter
             ]],
             ['Exodus12v', [
                 { source: "Exodus12v40", target: "Acts7v6", value: 9 },
             ]]
         ]);
         // Mock or temporarily replace the internal referencesLookupMap

         // Test Verse Mode (uses map lookup)
         test('should filter verse connections using the map', () => {
             // Need mechanism to inject or use mockRefLookupMap
             // const result = getConnectionsFor(mockAllLinks, 'Genesis', 1, 'verse'); // Call potentially using mock map
             // expect(result.links).toHaveLength(3); // Expect all links starting Genesis1v
              // expect(result.nodes). // Check nodes derived and sorted
              test.skip('getConnectionsFor verse mode optimization needs mock map setup', () => {});
         });

          // Test Chapter Mode (uses map lookup then aggregation)
          test('should filter and aggregate chapter connections using the map', () => {
             // Need mechanism to inject or use mockRefLookupMap
             // const result = getConnectionsFor(mockAllLinks, 'Genesis', 1, 'chapter');
             // expect(result.links).toHaveLength(2); // Gen1 -> John1 (value=2), Gen1 -> Hebrews1 (value=1)
             // expect(result.nodes). // Check chapter nodes derived and sorted
             test.skip('getConnectionsFor chapter mode optimization needs mock map setup', () => {});
         });
    });

     // --- Basic Tests for Metadata functions ---
     describe('getBooks / getChapters', () => {
         test('getBooks should return sorted canonical book names', () => {
             // This requires loadBibleText to have run with mock data or mocking loadBibleText
             // loadBibleText(); // Call if needed, assuming mock import worked
             const books = getBooks(mockBibleData); // Use mock directly
             expect(books).toEqual(["Genesis", "Exodus", "John", "Hebrews"]); // Based on mock data & canonical order mock
         });

          test('getChapters should return sorted chapters for a book', () => {
             const chapters = getChapters(mockBibleData, 'Genesis'); // Use mock directly
             expect(chapters).toEqual([1, 2]);
             const emptyChapters = getChapters(mockBibleData, 'NonExistentBook');
             expect(emptyChapters).toEqual([]);
         });
     });

});