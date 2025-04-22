// tests/utils/dataService.test.js

// Import functions to test from dataService
import {
    parseReferenceId,
    normalizeBookNameForText, // Assuming this needs testing/verification
    normalizeBookNameForId,   // Assuming this needs testing/verification
    getNodeMetadata,
    getConnectionsFor,      // Requires significant mocking
    // Import load functions ONLY if testing their error handling or pre-processing side effects
    // loadBibleText, loadAllReferences,
    // Import getBooks/getChapters if testing their sorting/extraction with mocks
    // getBooks, getChapters
} from '@/utils/dataService';

// Mock the canonical order module if dataService imports it directly
// Or ensure test environment handles it if used implicitly
jest.mock('@/utils/canonicalOrder', () => ({
    BIBLE_BOOK_ORDER: ["Genesis", "Exodus", "Matthew", "John", "Acts", "Romans", "Hebrews", "1 John", "Revelation of John"], // Provide a minimal mock order
    BIBLE_BOOK_ORDER_MAP: new Map([["Genesis", 0], ["Exodus", 1], ["Matthew", 2], ["John", 3], ["Acts", 4], ["Romans", 5], ["Hebrews", 6], ["1 John", 7], ["Revelation of John", 8]]),
    getBookSortIndex: jest.fn((bookName) => {
        const map = new Map([["Genesis", 0], ["Exodus", 1], ["Matthew", 2], ["John", 3], ["Acts", 4], ["Romans", 5], ["Hebrews", 6], ["1 John", 7], ["Revelation of John", 8]]);
        return map.get(bookName) ?? 999;
    }),
}));

// --- Test Suite ---
describe('dataService Utilities', () => {

    // --- Tests for parseReferenceId ---
    describe('parseReferenceId', () => {
        // --- Add all test cases from MVP v5.1 ---
        test('should parse standard BookChvVs format', () => { /* ... */ expect(parseReferenceId('Genesis1v1')).toEqual({ book: 'Genesis', chapter: 1, verse: 1 }); });
        test('should parse numbered books (BookChvVs)', () => { /* ... */ expect(parseReferenceId('1Samuel2v10')).toEqual({ book: '1Samuel', chapter: 2, verse: 10 }); });
        test('should parse chapter-only format (BookCh)', () => { /* ... */ expect(parseReferenceId('Exodus20')).toEqual({ book: 'Exodus', chapter: 20, verse: null }); });
        test('should parse dot format (Book.Ch.Vs)', () => { /* ... */ expect(parseReferenceId('Gen.1.1')).toEqual({ book: 'Gen', chapter: 1, verse: 1 }); });
        test('should handle variations in verse separator (v or :)', () => { /* ... */ expect(parseReferenceId('Mark10:45')).toEqual({ book: 'Mark', chapter: 10, verse: 45 }); });
        test('should be case-insensitive', () => { /* ... */ expect(parseReferenceId('gEnEsiS1V1')).toEqual({ book: 'gEnEsiS', chapter: 1, verse: 1 }); });
        test('should return null for invalid formats', () => { /* ... */ expect(parseReferenceId('Genesis')).toBeNull(); });
    });

    // --- Tests for Normalization (Optional but Recommended) ---
    // It might be better to test these implicitly via getNodeMetadata or getConnectionsFor
    // describe('normalizeBookNameForText', () => { ... });
    // describe('normalizeBookNameForId', () => { ... });

    // --- Tests for getNodeMetadata ---
    describe('getNodeMetadata', () => {
        // --- Add all test cases from MVP v5.1 ---
        test('should return correct metadata for verse ID', () => { /* ... */ expect(getNodeMetadata('Genesis1v1')).toEqual({ book: 'Genesis', chapter: 1, verse: 1 }); });
        test('should return correct metadata for chapter ID', () => { /* ... */ expect(getNodeMetadata('Exodus20')).toEqual({ book: 'Exodus', chapter: 20, verse: null }); });
        test('should return raw ID if parsing fails', () => { /* ... */ expect(getNodeMetadata('InvalidReference')).toEqual({ rawId: 'InvalidReference' }); });
        test('should return null for null input', () => { /* ... */ expect(getNodeMetadata(null)).toBeNull(); });
    });


    // --- Tests for getConnectionsFor (More Involved) ---
    describe('getConnectionsFor', () => {
        // Define small, representative mock link data
        const mockAllLinks = [
            // Genesis 1 connections
            { source: "Genesis1v1", target: "John1v1", value: 10 }, // Value will be ignored/set to 1 by func
            { source: "Genesis1v1", target: "Hebrews1v10", value: 5 },
            { source: "Genesis1v3", target: "John1v1", value: 8 }, // Another link to John1v1
            { source: "Genesis1v5", target: "Exodus12v2", value: 3 },
            // Exodus 12 connections
            { source: "Exodus12v2", target: "Genesis1v5", value: 4 },
            { source: "Exodus12v40", target: "Acts7v6", value: 9 },
            // John 1 connections
            { source: "John1v1", target: "1John1v1", value: 12 },
            { source: "John1v14", target: "Genesis1v1", value: 7 },
        ];

        // Pre-processed mock data (simulating what loadAllReferences might do)
        // This assumes the optimization target is a Map grouped by source prefix
        const mockReferencesLookupMap = new Map();
        mockAllLinks.forEach(link => {
             const parsedSource = parseReferenceId(link.source);
             if(parsedSource && parsedSource.verse !== null) {
                const prefix = `${normalizeBookNameForId(parsedSource.book)}${parsedSource.chapter}v`;
                 if (!mockReferencesLookupMap.has(prefix)) { mockReferencesLookupMap.set(prefix, []); }
                 mockReferencesLookupMap.get(prefix).push(link);
             }
        });

        // Mock the internal state of dataService if necessary (alternative to mocking imports)
        // jest.spyOn(dataServiceModule, 'referencesLookupMap', 'get').mockReturnValue(mockReferencesLookupMap);


        test('should return correct nodes and links for verse view', () => {
            const result = getConnectionsFor(mockAllLinks, 'Genesis', 1, 'verse'); // Use mockAllLinks directly if map optimization isn't mocked/tested directly
            expect(result).not.toBeNull();
            expect(result.links).toHaveLength(4); // Gen1v1->J1v1, Gen1v1->H1v10, Gen1v3->J1v1, Gen1v5->E12v2
            expect(result.links.every(l => l.value === 1)).toBe(true); // Check value is 1
            // Check node IDs expected
            const expectedNodeIds = ["Genesis1v1", "Genesis1v3", "Genesis1v5", "John1v1", "Hebrews1v10", "Exodus12v2"];
            expect(result.nodes.map(n => n.id)).toEqual(expect.arrayContaining(expectedNodeIds));
            expect(result.nodes).toHaveLength(expectedNodeIds.length);
            // Check sorting (Genesis, Exodus, John, Hebrews based on mock canonical order)
            expect(result.nodes[0].id).toBe('Genesis1v1');
            expect(result.nodes[1].id).toBe('Genesis1v3');
            expect(result.nodes[2].id).toBe('Genesis1v5');
            expect(result.nodes[3].id).toBe('Exodus12v2');
             expect(result.nodes[4].id).toBe('John1v1');
             expect(result.nodes[5].id).toBe('Hebrews1v10');
        });

        test('should return correct nodes and aggregated links for chapter view', () => {
            const result = getConnectionsFor(mockAllLinks, 'Genesis', 1, 'chapter');
            expect(result).not.toBeNull();
            // Expect aggregated links
            expect(result.links).toHaveLength(3); // Gen1->John1, Gen1->Heb1, Gen1->Exo12
            expect(result.links).toEqual(expect.arrayContaining([
                 expect.objectContaining({ source: 'Genesis1', target: 'John1', value: 2 }), // 2 links aggregated (Gen1v1->J1v1, Gen1v3->J1v1), value = count
                 expect.objectContaining({ source: 'Genesis1', target: 'Hebrews1', value: 1 }),
                 expect.objectContaining({ source: 'Genesis1', target: 'Exodus12', value: 1 }),
             ]));
            // Check nodes derived (source chapter + unique target chapters)
             const expectedNodeIds = ["Genesis1", "Exodus12", "John1", "Hebrews1"];
             expect(result.nodes.map(n => n.id)).toEqual(expect.arrayContaining(expectedNodeIds));
             expect(result.nodes).toHaveLength(expectedNodeIds.length);
             // Check sorting
             expect(result.nodes[0].id).toBe('Genesis1');
             expect(result.nodes[1].id).toBe('Exodus12');
             expect(result.nodes[2].id).toBe('John1');
             expect(result.nodes[3].id).toBe('Hebrews1');
        });

        test('should return empty results for chapter with no connections', () => {
             const result = getConnectionsFor(mockAllLinks, 'Acts', 1, 'chapter');
             expect(result).toEqual({ nodes: [], links: [] });
        });

         test('should return null if required inputs are missing', () => {
             expect(getConnectionsFor(mockAllLinks, null, 1, 'chapter')).toBeNull();
             expect(getConnectionsFor(mockAllLinks, 'Genesis', null, 'chapter')).toBeNull();
             expect(getConnectionsFor(null, 'Genesis', 1, 'chapter')).toBeNull();
        });

    });

    // --- Add tests for getTextForReference (requires mockBibleData or mocking bibleLookupMap) ---
    // describe('getTextForReference', () => { ... });

});