// utils/canonicalOrder.js (MVP v8.3 - Ensure Canonical Names)

// Standard 66-book Protestant canonical order
// Use standard English names with Arabic numerals. These are the TARGET names for normalization.
export const BIBLE_BOOK_ORDER = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth",
    "1 Samuel", "2 Samuel", // Use Arabic numerals
    "1 Kings", "2 Kings",   // Use Arabic numerals
    "1 Chronicles", "2 Chronicles", // Use Arabic numerals
    "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", // Use full name
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
    "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
    "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", // Use Arabic numerals
    "Galatians", "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians", // Use Arabic numerals
    "1 Timothy", "2 Timothy", // Use Arabic numerals
    "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", // Use Arabic numerals
    "1 John", "2 John", "3 John", // Use Arabic numerals
    "Jude",
    "Revelation of John" // Keep consistent with likely BSB.json name
];

// Creates a Map for efficient lookup of a book's canonical index.
// Keys are the EXACT canonical book names from BIBLE_BOOK_ORDER above.
export const BIBLE_BOOK_ORDER_MAP = new Map(
    BIBLE_BOOK_ORDER.map((book, index) => [book, index])
);

/**
 * Helper function to get the canonical sort index for a book name.
 * Returns a large number if the book is not found in the map, ensuring unknown books sort last.
 * Expects the input bookName to be ALREADY NORMALIZED to the canonical format.
 * @param {string} canonicalBookName - The normalized, canonical book name.
 * @returns {number} The 0-based canonical index or 999 if not found.
 */
export const getBookSortIndex = (canonicalBookName) => {
    const index = BIBLE_BOOK_ORDER_MAP.get(canonicalBookName);
    if (index === undefined) {
        // This warning should NOT appear if normalization is correct
        console.warn(`[getBookSortIndex] Canonical index not found for: '${canonicalBookName}'`);
        return 999;
    }
    return index;
}