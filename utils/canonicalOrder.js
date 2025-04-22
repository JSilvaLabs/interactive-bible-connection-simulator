// utils/canonicalOrder.js

// Standard 66-book Protestant canonical order
// IMPORTANT: Ensure these names EXACTLY match the normalized names
// you intend to use as keys or identifiers derived from your bibleData and referencesData.
// Adjust capitalization/spacing/abbreviations as necessary based on your dataService normalization.
export const BIBLE_BOOK_ORDER = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", // Or "Song" if that's your normalized standard
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
    "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
    "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", "1 John",
    "2 John", "3 John", "Jude",
    "Revelation of John" // Match the name used in BSB.json or your normalized standard
];

// Creates a Map for efficient lookup of a book's canonical index.
// Keys are the book names from BIBLE_BOOK_ORDER, values are their 0-based index.
export const BIBLE_BOOK_ORDER_MAP = new Map(
    BIBLE_BOOK_ORDER.map((book, index) => [book, index])
);

/**
 * Helper function to get the canonical sort index for a book name.
 * Returns a large number if the book is not found in the map, ensuring unknown books sort last.
 * @param {string} bookName - The normalized book name.
 * @returns {number} The 0-based canonical index or 999 if not found.
 */
export const getBookSortIndex = (bookName) => {
    return BIBLE_BOOK_ORDER_MAP.get(bookName) ?? 999; // Use Map for fast lookup
}