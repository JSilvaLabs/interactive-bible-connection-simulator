// utils/dataService.js
import chapterData from '@/data/chapterData.json';
import verseData from '@/data/verseData.json';
// Assuming BSB.json is placed in the data folder and can be imported.
// If the file is very large, consider fetching it from /public instead.
import bibleDataRaw from '@/data/BSB.json';

/**
 * Loads the static chapter connection data.
 * @returns {object} The chapter connection data.
 */
export const loadChapterData = () => chapterData;

/**
 * Loads the static verse connection data.
 * @returns {object} The verse connection data.
 */
export const loadVerseData = () => verseData;

/**
 * Loads the static Bible text data.
 * @returns {object} The Bible text data.
 */
export const loadBibleText = () => bibleDataRaw;


/**
 * Normalizes common Bible book names/abbreviations to match BSB.json keys.
 * This needs to be expanded based on the actual keys in BSB.json and common input formats.
 * @param {string} inputName - The book name/abbreviation from the referenceId.
 * @returns {string} The normalized book name or the original if no match.
 */
const normalizeBookName = (inputName) => {
    const cleanedName = inputName.replace(/\s/g, '').toLowerCase();
    // Add more mappings as needed
    const map = {
        'gen': 'Genesis',
        'exo': 'Exodus',
        'lev': 'Leviticus',
        'mat': 'Matthew',
        'joh': 'John',
        'rom': 'Romans',
        'heb': 'Hebrews',
        '1joh': '1 John', // Adjust if BSB.json uses a different format like "1John"
        'rev': 'Revelation of John', // Critical: Match the name in BSB.json
        // Add other books as needed for your sample data
    };
    const lowerInput = cleanedName.toLowerCase();
    return map[lowerInput] || inputName; // Return original if no mapping found
}

/**
 * Retrieves formatted Bible text for a given reference ID (e.g., "Gen1", "Joh1v1").
 * @param {object} bibleData - The loaded Bible text JSON object.
 * @param {string} referenceId - The chapter or verse reference ID.
 * @returns {string} Formatted Bible text or an error/default message.
 */
export const getTextForReference = (bibleData, referenceId) => {
  // Initial checks
  if (!bibleData || !bibleData.books) return "Bible data not loaded.";
  if (!referenceId) return "Select a chapter/verse on the diagram to view text.";

  // Regex to parse reference IDs like Gen1, Joh1v1, 1Joh3v8
  // Group 1: Optional book number (1-3) and book name (may include space)
  // Group 2: Book name part
  // Group 3: Chapter number
  // Group 4: Optional 'v' and verse number
  // Group 5: Optional verse number
  const refRegex = /^([1-3]?\s?([A-Za-z]+))(\d+)(?:v(\d+))?$/;
  const match = referenceId.match(refRegex);

  if (!match) {
    console.warn(`Invalid reference format detected: ${referenceId}`);
    return `Invalid reference format: ${referenceId}`;
  }

  // Extract parts
  const rawBookName = match[1]; // e.g., "Gen", "Joh", "1 Joh"
  const chapterNum = parseInt(match[3], 10);
  const verseNum = match[5] ? parseInt(match[5], 10) : null; // null if only chapter

  // Normalize the book name to match keys in bibleData.books
  const normalizedBookName = normalizeBookName(rawBookName);

  // Find the book
  const book = bibleData.books.find(b => b.name === normalizedBookName);
  if (!book) {
      console.warn(`Book not found after normalization: Input='${rawBookName}', Normalized='${normalizedBookName}'`);
      return `Book not found: ${normalizedBookName}`;
  }

  // Find the chapter
  const chapter = book.chapters.find(c => c.chapter === chapterNum);
  if (!chapter) {
       console.warn(`Chapter not found: ${normalizedBookName} ${chapterNum}`);
      return `Chapter not found: ${normalizedBookName} ${chapterNum}`;
  }

  // --- Format Output ---
  let outputText = '';

  if (verseNum !== null) {
    // Find and return specific verse
    const verse = chapter.verses.find(v => v.verse === verseNum);
    if (verse) {
        outputText = `${book.name} ${chapterNum}:${verseNum}\n${verse.text.trim()}`;
    } else {
        console.warn(`Verse not found: ${normalizedBookName} ${chapterNum}:${verseNum}`);
        outputText = `Verse not found: ${referenceId}`;
    }
  } else {
    // Format and return all verses for the chapter
    const chapterHeader = `${book.name} ${chapterNum}\n--------------------\n`;
    const versesText = chapter.verses
      .map(v => `${v.verse} ${v.text.trim()}`)
      .join('\n\n'); // Add double newline for paragraph-like spacing
    outputText = chapterHeader + versesText;
  }

  return outputText;
};

// Example usage (for testing):
// const bible = loadBibleText();
// console.log(getTextForReference(bible, "Gen1"));
// console.log(getTextForReference(bible, "Joh1v1"));
// console.log(getTextForReference(bible, "Rev1")); // Depends on normalizeBookName mapping