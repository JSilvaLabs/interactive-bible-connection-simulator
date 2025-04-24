// tests/utils/dataService.test.js (MRP v1.0.2 - Corrected Expectations & Mocking)

// Import functions using ALIAS
import {
    parseReferenceId,
    normalizeBookNameForText,
    normalizeBookNameForId,
    getNodeMetadata,
    getConnectionsFor,
    getTextForReference,
    loadBibleText,
    loadAllReferences,
    getBooks,
    getChapters,
    getVersesForChapter
} from '@/utils/dataService'; // Use alias

// --- Mock Dependencies ---

// Mock canonicalOrder using ALIAS
jest.mock('@/utils/canonicalOrder', () => { // Use alias
    // Ensure this list EXACTLY matches your actual canonicalOrder.js file
    const originalOrder = [
        "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
        "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
        "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
        "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
        "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah",
        "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
        "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
        "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians",
        "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy",
        "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John",
        "2 John", "3 John", "Jude", "Revelation of John"
    ];
    const orderMap = new Map(originalOrder.map((book, index) => [book, index]));
    return {
        BIBLE_BOOK_ORDER: originalOrder,
        BIBLE_BOOK_ORDER_MAP: orderMap,
        // Mock the function to use the map we just created
        getBookSortIndex: jest.fn((canonicalBookName) => {
            // console.log(`Mock getBookSortIndex called with: ${canonicalBookName}`); // Debugging line
            return orderMap.get(canonicalBookName) ?? 999;
        }),
    };
});

// Mock the JSON data modules using ALIAS and define data *inside* the factory function
jest.mock('@/data/BSB.json', () => ({ // Use alias
    "translation": "Mock BSB",
    "books": [
        // Use canonical names matching canonicalOrder mock
        { "name": "Genesis", "chapters": [
            { "chapter": 1, "verses": [{ "verse": 1, "text": "In the beginning..." }, { "verse": 3, "text": "Let there be light." }] },
            { "chapter": 5, "verses": [{ "verse": 1, "text": "This is the book..." }] }
        ]},
        { "name": "Exodus", "chapters": [
            { "chapter": 12, "verses": [{ "verse": 2, "text": "This month..." }, { "verse": 40, "text": "Now the length of time..."}] }
        ]},
        { "name": "1 Samuel", "chapters": [
            { "chapter": 3, "verses": [{ "verse": 3, "text": "The lamp of God..."}]},
            { "chapter": 16, "verses": [{ "verse": 7, "text": "Do not look..." }] }
        ]},
        { "name": "Song of Solomon", "chapters": [
            { "chapter": 2, "verses": [{ "verse": 1, "text": "I am a rose..." }] }
        ]},
        { "name": "Matthew", "chapters": [ // Added for testing node creation even if text isn't present
             { "chapter": 1, "verses": [{ "verse": 1, "text": "Genealogy..."}] } // Need at least one verse for chapter to exist
        ]},
        { "name": "John", "chapters": [
            { "chapter": 1, "verses": [{ "verse": 1, "text": "In the beginning was the Word..." }] }
        ]},
        { "name": "Acts", "chapters": [
             { "chapter": 7, "verses": [{ "verse": 6, "text": "God spoke to this effect..."}] }
        ]},
         { "name": "1 Corinthians", "chapters": [
            { "chapter": 2, "verses": [{ "verse": 14, "text": "The natural person..."}] }
        ]},
         // No 3 John in mock text data, only in references
    ]
}), { virtual: true });

jest.mock('@/data/references.json', () => ([ // Use alias, return array directly
    // Ensure IDs here can be parsed correctly by parseReferenceId
    { source: "Genesis1v1", target: "John1v1", value: 1 },
    { source: "Genesis1v1", target: "1Corinthians2v14", value: 1 },
    { source: "Genesis5v1", target: "Matthew1v1", value: 1 }, // Target Matthew
    { source: "1Samuel16v7", target: "1Corinthians2v14", value: 1 },
    { source: "SongofSolomon2v1", target: "John1v1", value: 1 }, // Another link to John1v1
    { source: "Genesis1v3", target: "1Samuel3v3", value: 1 },
    { source: "Exodus12v40", target: "Acts7v6", value: 1 },
    { source: "Genesis1v3", target: "Exodus12v2", value: 1 },
]), { virtual: true });


// --- Test Suite ---
describe('dataService Utilities (MRP v1.0 - Optimized)', () => {

    // Ensure maps are built before tests that rely on them
    beforeAll(() => {
        try {
            // These calls now use the mocked JSON data defined above
            loadBibleText();
            loadAllReferences();
        } catch (e) {
            console.error("Error during test setup (beforeAll):", e);
            throw new Error(`Test setup failed: Could not load/process mock data - ${e.message}`);
        }
    });

    describe('Normalization and Parsing (MRP)', () => {
        test('parseReferenceId handles various formats', () => {
            expect(parseReferenceId('Genesis1v1')).toEqual({ book: 'Genesis', chapter: 1, verse: 1 });
            expect(parseReferenceId('1 Samuel 16v7')).toEqual({ book: '1 Samuel', chapter: 16, verse: 7 });
            expect(parseReferenceId('Song of Solomon 2')).toEqual({ book: 'Song of Solomon', chapter: 2, verse: null });
            expect(parseReferenceId('John.1.1')).toEqual({ book: 'John', chapter: 1, verse: 1 });
            expect(parseReferenceId('1 John.3.16')).toEqual({ book: '1 John', chapter: 3, verse: 16 });
            expect(parseReferenceId('Exo12:40')).toEqual({ book: 'Exo', chapter: 12, verse: 40 });
            expect(parseReferenceId('Acts7')).toEqual({ book: 'Acts', chapter: 7, verse: null });
            expect(parseReferenceId(' Invalid ID ')).toBeNull();
            expect(parseReferenceId(null)).toBeNull();
            expect(parseReferenceId('')).toBeNull();
            expect(parseReferenceId('Genesis')).toBeNull();
        });

        test('normalizeBookNameForText produces canonical names for display/map keys', () => {
            expect(normalizeBookNameForText('gen')).toBe('Genesis');
            expect(normalizeBookNameForText('Exo')).toBe('Exodus');
            expect(normalizeBookNameForText('1sam')).toBe('1 Samuel');
            expect(normalizeBookNameForText('i samuel')).toBe('1 Samuel');
            expect(normalizeBookNameForText('2 Kings')).toBe('2 Kings');
            expect(normalizeBookNameForText('Song of Solomon')).toBe('Song of Solomon');
            expect(normalizeBookNameForText('song')).toBe('Song of Solomon');
            expect(normalizeBookNameForText('canticles')).toBe('Song of Solomon');
            expect(normalizeBookNameForText('phil')).toBe('Philippians');
            expect(normalizeBookNameForText('1 Cor')).toBe('1 Corinthians'); // Should pass now
            expect(normalizeBookNameForText('Revelation')).toBe('Revelation of John');
            expect(normalizeBookNameForText('REV')).toBe('Revelation of John');
            expect(normalizeBookNameForText('Unknown Book')).toBe('Unknown Book');
            expect(normalizeBookNameForText('')).toBe('');
            expect(normalizeBookNameForText(null)).toBe('');
        });

        test('normalizeBookNameForId produces canonical names from typical ID parts', () => {
            expect(normalizeBookNameForId('Genesis')).toBe('Genesis');
            expect(normalizeBookNameForId('1Samuel')).toBe('1 Samuel');
            expect(normalizeBookNameForId('SongofSolomon')).toBe('Song of Solomon');
            expect(normalizeBookNameForId('1corinthians')).toBe('1 Corinthians');
            expect(normalizeBookNameForId('2Thessalonians')).toBe('2 Thessalonians');
            expect(normalizeBookNameForId('Revelation')).toBe('Revelation of John');
            expect(normalizeBookNameForId('Acts')).toBe('Acts');
            expect(normalizeBookNameForId('WeirdBook')).toBe('Unknown');
            expect(normalizeBookNameForId('')).toBe('Unknown');
            expect(normalizeBookNameForId(null)).toBe('Unknown');
             // Test specific numbered book logic
             expect(normalizeBookNameForId('1 John')).toBe('1 John');
             expect(normalizeBookNameForId('2Sam')).toBe('2 Samuel');
             // This should now pass with the updated function logic
             expect(normalizeBookNameForId('3Jn')).toBe('3 John');
        });

        test('getNodeMetadata uses correct parsing and normalization for display', () => {
            expect(getNodeMetadata('Genesis1v1')).toEqual({ book: 'Genesis', chapter: 1, verse: 1, rawId: 'Genesis1v1' });
            expect(getNodeMetadata('1Samuel16v7')).toEqual({ book: '1 Samuel', chapter: 16, verse: 7, rawId: '1Samuel16v7' });
            expect(getNodeMetadata('SongofSolomon2')).toEqual({ book: 'Song of Solomon', chapter: 2, verse: null, rawId: 'SongofSolomon2' });
            expect(getNodeMetadata('InvalidId')).toEqual({ book: 'Unknown', chapter: null, verse: null, rawId: 'InvalidId' });
        });
    });

    describe('Metadata Functions (using Optimized Maps)', () => {
        test('getBooks returns list sorted canonically from map', () => {
            const books = getBooks(null); // Force map usage
            // Expect books present in the mockBibleJson, sorted according to canonicalOrder mock
            expect(books).toEqual([
                "Genesis", "Exodus", "1 Samuel", "Song of Solomon", "Matthew", "John", "Acts", "1 Corinthians"
            ]);
        });

        test('getChapters returns sorted chapters from map', () => {
            expect(getChapters(null, 'Genesis')).toEqual([1, 5]);
            expect(getChapters(null, '1 Samuel')).toEqual([3, 16]);
            expect(getChapters(null, 'Matthew')).toEqual([1]); // From stub added to mock data
            expect(getChapters(null, 'NonExistentBook')).toEqual([]);
        });

        test('getVersesForChapter returns sorted verses from map', () => {
            expect(getVersesForChapter(null, 'Genesis', 1)).toEqual([1, 3]);
            expect(getVersesForChapter(null, '1 Samuel', 16)).toEqual([7]);
            expect(getVersesForChapter(null, 'Genesis', 99)).toEqual([]); // Non-existent chapter
            expect(getVersesForChapter(null, 'Exodus', 12)).toEqual([2, 40]);
        });
    });

    describe('getTextForReference (using Optimized Map)', () => {
        test('returns correct verse text', () => {
            const expectedGen = `Genesis 1:1\nIn the beginning...`;
            expect(getTextForReference(null, 'Genesis1v1')).toBe(expectedGen);
            const expected1Sam = `1 Samuel 16:7\nDo not look...`;
            expect(getTextForReference(null, '1Samuel16v7')).toBe(expected1Sam);
        });

        test('returns correct chapter text', () => {
            const expectedGen1 = `Genesis 1\n${'-'.repeat(20)}\n1 In the beginning...\n\n3 Let there be light.`;
            expect(getTextForReference(null, 'Genesis1')).toBe(expectedGen1);
            const expectedEx12 = `Exodus 12\n${'-'.repeat(20)}\n2 This month...\n\n40 Now the length of time...`;
            expect(getTextForReference(null, 'Exodus12')).toBe(expectedEx12);
        });

        test('returns appropriate messages for not found items', () => {
            expect(getTextForReference(null, 'Genesis1v99')).toBe('Verse not found: Genesis1v99');
            expect(getTextForReference(null, 'Genesis99')).toBe('Chapter not found in lookup map: Genesis 99');
            // Corrected expected message case
            expect(getTextForReference(null, 'NonExistentBook1v1')).toBe('Book not found in lookup map: NonExistentBook');
            expect(getTextForReference(null, 'InvalidId')).toBe('Invalid Reference ID: InvalidId');
        });
    });

    describe('getConnectionsFor (using Optimized Maps)', () => {
         test('filters correctly for Verse Mode and sorts nodes canonically', () => {
            const result = getConnectionsFor(null, 'Genesis', 1, 'verse'); // Use canonical "Genesis"
            const expectedLinks = [
                { source: "Genesis1v1", target: "John1v1", value: 1 },
                { source: "Genesis1v1", target: "1Corinthians2v14", value: 1 },
                { source: "Genesis1v3", target: "1Samuel3v3", value: 1 },
                { source: "Genesis1v3", target: "Exodus12v2", value: 1 },
            ];
            expect(result.links).toEqual(expect.arrayContaining(expectedLinks));
            expect(result.links.length).toBe(expectedLinks.length);

            const expectedNodeIds = new Set(['Genesis1v1', 'Genesis1v3', 'John1v1', '1Corinthians2v14', '1Samuel3v3', 'Exodus12v2']);
            expect(result.nodes.length).toBe(expectedNodeIds.size);

            // Expect CORRECT canonical sort order
            const sortedNodeIds = result.nodes.map(n => n.id);
            expect(sortedNodeIds).toEqual([
                'Genesis1v1',
                'Genesis1v3',
                'Exodus12v2',
                '1Samuel3v3',
                'John1v1',          // John (43) before 1 Cor (46)
                '1Corinthians2v14'
            ]);
        });

         test('filters correctly for Chapter Mode and sorts nodes canonically', () => {
            const result = getConnectionsFor(null, 'Genesis', 1, 'chapter'); // Use canonical "Genesis"
            expect(result.links).toHaveLength(4);
            // Corrected aggregation count and target ID format
            expect(result.links.find(l => l.target === 'John1')?.value).toBe(1);
            expect(result.links.find(l => l.target === '1 Corinthians2')?.value).toBe(1); // Note the space
            expect(result.links.find(l => l.target === '1 Samuel3')?.value).toBe(1);   // Note the space
            expect(result.links.find(l => l.target === 'Exodus12')?.value).toBe(1);

            // Node IDs should reflect the space from canonical names
            const expectedNodeIds = new Set(['Genesis1', 'Exodus12', '1 Samuel3', 'John1', '1 Corinthians2']);
            expect(result.nodes.length).toBe(expectedNodeIds.size);
            result.nodes.forEach(node => expect(expectedNodeIds).toContain(node.id));

            // Check sorting with correct Node IDs
            const sortedNodeIds = result.nodes.map(n => n.id);
            expect(sortedNodeIds).toEqual(['Genesis1', 'Exodus12', '1 Samuel3', 'John1', '1 Corinthians2']);
        });

        test('returns empty results for chapter with no connections', () => {
            const resultVerse = getConnectionsFor(null, 'Genesis', 99, 'verse');
            expect(resultVerse).toEqual({ nodes: [], links: [] });
            const resultChap = getConnectionsFor(null, 'Genesis', 99, 'chapter');
            expect(resultChap).toEqual({ nodes: [], links: [] });
        });

         test('returns null if book/chapter selection is invalid', () => {
            expect(getConnectionsFor(null, null, 1, 'verse')).toBeNull();
            expect(getConnectionsFor(null, 'Genesis', null, 'chapter')).toBeNull();
         });

         test('handles numbered source book correctly', () => {
             const result = getConnectionsFor(null, '1 Samuel', 16, 'verse'); // Use canonical "1 Samuel"
             expect(result.links).toHaveLength(1);
             expect(result.links[0]).toEqual(expect.objectContaining({ source: '1Samuel16v7', target: '1Corinthians2v14', value: 1 }));
             expect(result.nodes).toHaveLength(2);
             // Verify Sorting: 1 Samuel -> 1 Corinthians
             expect(result.nodes.map(n => n.id)).toEqual(['1Samuel16v7', '1Corinthians2v14']);
         });
    });
});