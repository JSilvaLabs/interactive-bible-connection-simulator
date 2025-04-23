"use client";

import React from 'react';

/**
 * Component providing dropdowns for selecting Bible Book, Chapter, and Verse (conditionally).
 */
function ReferenceSelector({
    bookList = [],
    chapterList = [],
    verseList = [], // New: List of verse numbers for selected chapter
    selectedBook,
    selectedChapter,
    selectedVerse,  // New: Currently selected verse
    onBookChange,
    onChapterChange,
    onVerseChange, // New: Handler for verse selection
    isDisabled = false,
    viewMode // New: To control verse dropdown visibility
}) {

    // Handlers call parent functions passed via props
    const handleBookSelect = (e) => {
        onBookChange(e.target.value); // Pass selected book name
    };
    const handleChapterSelect = (e) => {
        onChapterChange(e.target.value ? parseInt(e.target.value, 10) : null); // Pass selected chapter number
    };
    const handleVerseSelect = (e) => {
        onVerseChange(e.target.value ? parseInt(e.target.value, 10) : null); // Pass selected verse number
    };

    return (
        // Use flex-wrap to allow dropdowns to wrap on smaller screens if needed
        <div className="flex flex-wrap gap-2 items-center p-2 bg-gray-200 dark:bg-gray-700 rounded shadow">
            {/* Book Selector */}
            <label htmlFor="book-select" className="sr-only">Select Book</label>
            <select
                id="book-select"
                value={selectedBook || ""} // Controlled component
                onChange={handleBookSelect}
                disabled={isDisabled || bookList.length === 0}
                className="p-2 border rounded text-sm sm:text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select Bible Book"
            >
                <option value="" disabled>-- Select Book --</option>
                {bookList.map(book => (
                    <option key={book} value={book}>{book}</option>
                ))}
            </select>

            {/* Chapter Selector */}
            <label htmlFor="chapter-select" className="sr-only">Select Chapter</label>
            <select
                id="chapter-select"
                value={selectedChapter || ""} // Controlled component
                onChange={handleChapterSelect}
                disabled={isDisabled || !selectedBook || chapterList.length === 0}
                className="p-2 border rounded text-sm sm:text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select Bible Chapter"
            >
                <option value="" disabled>-- Select Chapter --</option>
                {chapterList.map(chap => (
                    <option key={chap} value={chap}>{chap}</option>
                ))}
            </select>

            {/* --- Verse Selector (Conditional) --- */}
            {viewMode === 'verse' && selectedChapter && ( // Only show if in verse mode AND a chapter is selected
                <>
                    <label htmlFor="verse-select" className="sr-only">Select Verse</label>
                    <select
                        id="verse-select"
                        value={selectedVerse || ""} // Controlled component
                        onChange={handleVerseSelect}
                        disabled={isDisabled || verseList.length === 0}
                        className="p-2 border rounded text-sm sm:text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-blue-500 focus:border-blue-500"
                        aria-label="Select Bible Verse"
                    >
                        <option value="" disabled>-- Select Verse --</option>
                        {/* Optional: Add an 'All Verses' or similar option */}
                        {/* <option value="">(All Verses in Chapter)</option> */}
                        {verseList.map(verse => (
                            <option key={verse} value={verse}>{verse}</option>
                        ))}
                    </select>
                </>
            )}
             {/* --- End Verse Selector --- */}
        </div>
    );
}

export default ReferenceSelector;