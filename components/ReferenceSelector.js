"use client";

import React from 'react';

/**
 * Component providing dropdowns for selecting Bible Book and Chapter.
 */
function ReferenceSelector({
    bookList = [], // Default to empty array
    chapterList = [], // Default to empty array
    selectedBook,
    selectedChapter,
    onBookChange,
    onChapterChange,
    isDisabled = false // Default to not disabled
}) {

    // Handler for book selection change
    const handleBookSelect = (e) => {
        const bookName = e.target.value;
        onBookChange(bookName); // Notify parent
    };

    // Handler for chapter selection change
    const handleChapterSelect = (e) => {
        const chapterNum = e.target.value ? parseInt(e.target.value, 10) : null;
        onChapterChange(chapterNum); // Notify parent
    };

    return (
        <div className="flex flex-wrap gap-2 items-center p-2 bg-gray-200 dark:bg-gray-700 rounded shadow">
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
                {/* Populate book options */}
                {bookList.map(book => (
                    <option key={book} value={book}>{book}</option>
                ))}
            </select>

            <label htmlFor="chapter-select" className="sr-only">Select Chapter</label>
            <select
                id="chapter-select"
                value={selectedChapter || ""} // Controlled component
                onChange={handleChapterSelect}
                // Disable if loading, no book selected, or no chapters for the selected book
                disabled={isDisabled || !selectedBook || chapterList.length === 0}
                className="p-2 border rounded text-sm sm:text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select Bible Chapter"
            >
                <option value="" disabled>-- Select Chapter --</option>
                {/* Populate chapter options */}
                {chapterList.map(chap => (
                    <option key={chap} value={chap}>{chap}</option>
                ))}
            </select>
        </div>
    );
}

export default ReferenceSelector;