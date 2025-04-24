// components/ReferenceSelector.js (MRP v1.0 - Polished)
"use client";

import React from 'react';

/**
 * Component providing dropdowns for selecting Bible Book, Chapter, and Verse (conditionally).
 * MRP version includes polished styling and enhanced accessibility.
 */
function ReferenceSelector({
    bookList = [],
    chapterList = [],
    verseList = [],
    selectedBook,
    selectedChapter,
    selectedVerse,
    onBookChange,
    onChapterChange,
    onVerseChange,
    isDisabled = false, // Used to disable all selectors during loading/processing
    viewMode // Controls verse dropdown visibility
}) {

    // Handlers call parent functions passed via props
    const handleBookSelect = (e) => {
        onBookChange(e.target.value); // Pass selected book name (already canonical)
    };
    const handleChapterSelect = (e) => {
        // Ensure value is parsed or null if empty string selected
        onChapterChange(e.target.value ? parseInt(e.target.value, 10) : null);
    };
    const handleVerseSelect = (e) => {
         // Ensure value is parsed or null if empty string selected
        onVerseChange(e.target.value ? parseInt(e.target.value, 10) : null);
    };

    const baseSelectClasses = "p-2 border rounded text-sm sm:text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-150";
    const baseLabelClasses = "sr-only"; // Keep labels visually hidden but accessible

    return (
        // Use flex-wrap to allow dropdowns to wrap on smaller screens
        <div className="flex flex-wrap gap-2 items-center">
            {/* --- Book Selector --- */}
            <label htmlFor="book-select" className={baseLabelClasses}>Select Bible Book</label>
            <select
                id="book-select"
                value={selectedBook || ""} // Controlled component
                onChange={handleBookSelect}
                disabled={isDisabled || bookList.length === 0}
                className={baseSelectClasses}
                aria-label="Select Bible Book"
                aria-disabled={isDisabled || bookList.length === 0}
                aria-describedby={bookList.length === 0 ? "book-select-loading-desc" : undefined}
            >
                <option value="" disabled>-- Select Book --</option>
                {bookList.map(book => (
                    <option key={book} value={book}>{book}</option>
                ))}
            </select>
             {/* Accessible description for screen readers when disabled due to loading */}
             {bookList.length === 0 && <span id="book-select-loading-desc" className="sr-only">Book list is loading.</span>}


            {/* --- Chapter Selector --- */}
            <label htmlFor="chapter-select" className={baseLabelClasses}>Select Bible Chapter</label>
            <select
                id="chapter-select"
                value={selectedChapter || ""} // Controlled component
                onChange={handleChapterSelect}
                disabled={isDisabled || !selectedBook || chapterList.length === 0}
                className={baseSelectClasses}
                aria-label="Select Bible Chapter"
                aria-disabled={isDisabled || !selectedBook || chapterList.length === 0}
                aria-describedby={!selectedBook ? "chapter-select-disabled-desc" : undefined}
            >
                <option value="" disabled>-- Chapter --</option>
                {chapterList.map(chap => (
                    <option key={chap} value={chap}>{chap}</option>
                ))}
            </select>
             {/* Accessible description for screen readers when disabled */}
             {!selectedBook && <span id="chapter-select-disabled-desc" className="sr-only">Select a book first to enable chapters.</span>}

            {/* --- Verse Selector (Conditional) --- */}
            {viewMode === 'verse' && selectedChapter && ( // Only show if in verse mode AND a chapter is selected
                <>
                    <label htmlFor="verse-select" className={baseLabelClasses}>Select Bible Verse</label>
                    <select
                        id="verse-select"
                        value={selectedVerse || ""} // Controlled component
                        onChange={handleVerseSelect}
                        disabled={isDisabled || verseList.length === 0}
                        className={baseSelectClasses}
                        aria-label="Select Bible Verse (Optional)"
                        aria-disabled={isDisabled || verseList.length === 0}
                        aria-describedby={verseList.length === 0 && selectedChapter ? "verse-select-loading-desc" : undefined}
                    >
                        <option value="" disabled>-- Verse --</option>
                        {/* Optional: Add an 'All Verses' option explicitly if desired */}
                        {/* <option value="">(Chapter View)</option> */}
                        {verseList.map(verse => (
                            <option key={verse} value={verse}>{verse}</option>
                        ))}
                    </select>
                     {/* Accessible description for screen readers when disabled */}
                     {verseList.length === 0 && selectedChapter && <span id="verse-select-loading-desc" className="sr-only">Verses are loading or unavailable for this chapter.</span>}
                </>
            )}
        </div>
    );
}

export default ReferenceSelector;