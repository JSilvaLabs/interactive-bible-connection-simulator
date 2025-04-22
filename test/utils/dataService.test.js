// tests/utils/dataService.test.js

// Import functions to test (adjust path if needed)
import {
    parseReferenceId,
    getNodeMetadata,
    // Assume normalization functions are tested implicitly via getNodeMetadata or directly
    // Add imports for getConnectionsFor, getTextForReference if testing those
} from '@/utils/dataService';
// Mock data might be needed for functions requiring loaded data
// import mockBibleData from '../mocks/mockBibleData.json'; // Example mock
// import mockReferences from '../mocks/mockReferences.json'; // Example mock

describe('dataService Utilities', () => {

    // --- Tests for parseReferenceId ---
    describe('parseReferenceId', () => {
        test('should parse standard BookChvVs format', () => {
            expect(parseReferenceId('Genesis1v1')).toEqual({ book: 'Genesis', chapter: 1, verse: 1 });
            expect(parseReferenceId('John3v16')).toEqual({ book: 'John', chapter: 3, verse: 16 });
        });

        test('should parse numbered books (BookChvVs)', () => {
            expect(parseReferenceId('1Samuel2v10')).toEqual({ book: '1Samuel', chapter: 2, verse: 10 }); // Note: book name is raw here
            expect(parseReferenceId('2Corinthians5v1')).toEqual({ book: '2Corinthians', chapter: 5, verse: 1 });
        });

        test('should parse chapter-only format (BookCh)', () => {
            expect(parseReferenceId('Exodus20')).toEqual({ book: 'Exodus', chapter: 20, verse: null });
            expect(parseReferenceId('Psalms23')).toEqual({ book: 'Psalms', chapter: 23, verse: null });
             expect(parseReferenceId('1Kings8')).toEqual({ book: '1Kings', chapter: 8, verse: null });
        });

         test('should parse dot format (Book.Ch.Vs)', () => {
            expect(parseReferenceId('Gen.1.1')).toEqual({ book: 'Gen', chapter: 1, verse: 1 });
            expect(parseReferenceId('1Sam.16.7')).toEqual({ book: '1Sam', chapter: 16, verse: 7 });
            expect(parseReferenceId('Jn.3.16')).toEqual({ book: 'Jn', chapter: 3, verse: 16 });
         });

        test('should handle variations in verse separator (v or :)', () => {
             expect(parseReferenceId('Mark10:45')).toEqual({ book: 'Mark', chapter: 10, verse: 45 });
             expect(parseReferenceId('Mark10v45')).toEqual({ book: 'Mark', chapter: 10, verse: 45 });
        });

        test('should be case-insensitive', () => {
             expect(parseReferenceId('gEnEsiS1V1')).toEqual({ book: 'gEnEsiS', chapter: 1, verse: 1 });
             expect(parseReferenceId('john3v16')).toEqual({ book: 'john', chapter: 3, verse: 16 });
        });


        test('should return null for invalid formats', () => {
            expect(parseReferenceId('Genesis')).toBeNull();
            expect(parseReferenceId('Genesis1v')).toBeNull();
            expect(parseReferenceId('GenesisV1')).toBeNull();
            expect(parseReferenceId('12345')).toBeNull();
            expect(parseReferenceId('Book Chapter Verse')).toBeNull();
            expect(parseReferenceId(null)).toBeNull();
            expect(parseReferenceId('')).toBeNull();
        });
    });

    // --- Tests for getNodeMetadata ---
    // These tests rely on parseReferenceId AND normalizeBookNameForText working correctly
    describe('getNodeMetadata', () => {
        test('should return correct metadata for verse ID', () => {
            // Assumes normalizeBookNameForText maps 'Gen' -> 'Genesis'
            expect(getNodeMetadata('Genesis1v1')).toEqual({ book: 'Genesis', chapter: 1, verse: 1 });
            // Assumes normalizeBookNameForText maps '1Sam' -> '1 Samuel'
            expect(getNodeMetadata('1Sam16v7')).toEqual({ book: '1 Samuel', chapter: 16, verse: 7 });
            // Assumes normalizeBookNameForText maps 'rev' -> 'Revelation of John'
             expect(getNodeMetadata('Rev22v20')).toEqual({ book: 'Revelation of John', chapter: 22, verse: 20 });
        });

        test('should return correct metadata for chapter ID', () => {
            expect(getNodeMetadata('Exodus20')).toEqual({ book: 'Exodus', chapter: 20, verse: null });
            expect(getNodeMetadata('Psalms23')).toEqual({ book: 'Psalms', chapter: 23, verse: null });
        });

        test('should return raw ID if parsing fails', () => {
            expect(getNodeMetadata('InvalidReference')).toEqual({ rawId: 'InvalidReference' });
        });

        test('should return null for null input', () => {
            expect(getNodeMetadata(null)).toBeNull();
        });
    });

    // --- Tests for getConnectionsFor (Conceptual - requires mock data) ---
    // describe('getConnectionsFor', () => {
    //     const mockAllLinks = [
    //         { source: "Genesis1v1", target: "John1v1", value: 1 },
    //         { source: "Genesis1v2", target: "John1v3", value: 1 },
    //         { source: "Genesis1v3", target: "Hebrews1v1", value: 1 },
    //         { source: "Exodus20v1", target: "Matthew5v21", value: 1 },
    //         { source: "Genesis1v1", target: "Genesis2v4", value: 1 }, // Link within same chapter
    //         { source: "Genesis1v5", target: "Exodus12v2", value: 1 },
    //     ];
    //     // Mock nodes derived from links (assuming getConnectionsFor derives nodes)
    //     const expectedNodesGen1Chapter = expect.arrayContaining([
    //          expect.objectContaining({ id: 'Genesis1', book: 'Genesis' }),
    //          expect.objectContaining({ id: 'John1', book: 'John' }),
    //          expect.objectContaining({ id: 'Hebrews1', book: 'Hebrews' }),
    //          expect.objectContaining({ id: 'Genesis2', book: 'Genesis' }), // Target derived
    //          expect.objectContaining({ id: 'Exodus12', book: 'Exodus' }), // Target derived
    //     ]);
    //     const expectedNodesGen1Verse = expect.arrayContaining([
    //         expect.objectContaining({ id: 'Genesis1v1', book: 'Genesis' }),
    //         expect.objectContaining({ id: 'Genesis1v2', book: 'Genesis' }),
    //         expect.objectContaining({ id: 'Genesis1v3', book: 'Genesis' }),
    //         expect.objectContaining({ id: 'Genesis1v5', book: 'Genesis' }),
    //         expect.objectContaining({ id: 'John1v1', book: 'John' }),
    //         expect.objectContaining({ id: 'John1v3', book: 'John' }),
    //         expect.objectContaining({ id: 'Hebrews1v1', book: 'Hebrews' }),
    //         expect.objectContaining({ id: 'Genesis2v4', book: 'Genesis' }),
    //         expect.objectContaining({ id: 'Exodus12v2', book: 'Exodus' }),
    //     ]);

    //     test('should filter correctly for chapter view (and aggregate - if still doing that)', () => {
    //         const result = getConnectionsFor(mockAllLinks, 'Genesis', 1, 'chapter');
    //         expect(result).not.toBeNull();
    //         // Check if links are correctly aggregated (or filtered if aggregation removed)
    //         // Example check if aggregation happened (adjust based on actual logic)
    //         // expect(result.links).toHaveLength(4); // Gen1->John1, Gen1->Heb1, Gen1->Gen2, Gen1->Exo12
    //         // expect(result.links).toEqual(expect.arrayContaining([
    //         //     expect.objectContaining({ source: 'Genesis1', target: 'John1', value: 2 }), // Aggregated value
    //         //     expect.objectContaining({ source: 'Genesis1', target: 'Hebrews1', value: 1 }),
    //         // ]));
    //         // Check nodes are derived and sorted correctly
    //         expect(result.nodes).toHaveLength(5); // Gen1, John1, Heb1, Gen2, Exo12
    //         // Check canonical sort order based on BIBLE_BOOK_ORDER
    //         expect(result.nodes.map(n=>n.book)).toEqual(['Genesis', 'Genesis', 'Exodus', 'John', 'Hebrews']); // Example order
    //     });

    //     test('should filter correctly for verse view (and sort nodes)', () => {
    //         const result = getConnectionsFor(mockAllLinks, 'Genesis', 1, 'verse');
    //         expect(result).not.toBeNull();
    //         expect(result.links).toHaveLength(5); // All 5 links starting Gen1v...
    //         expect(result.links.every(l => l.value === 1)).toBe(true); // Check value is 1
    //         expect(result.nodes).toHaveLength(9); // Check all unique source/targets derived
    //         // Check canonical sort order based on BIBLE_BOOK_ORDER
    //          expect(result.nodes.map(n=>n.book)).toEqual(['Genesis','Genesis','Genesis','Genesis','Genesis','Exodus','John','John','Hebrews']); // Example order
    //     });

    //     test('should return empty for non-existent chapter', () => {
    //          const result = getConnectionsFor(mockAllLinks, 'Genesis', 99, 'verse');
    //          expect(result).toEqual({ nodes: [], links: [] });
    //     });
    // });

    // Add tests for getTextForReference using mock bibleData if needed

});