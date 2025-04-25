// components/ReferenceSelector.js (MRP v1.2 - Increase Font Sizes)
"use client";

import React from 'react';

/**
 * Component providing dropdowns for selecting Bible Book, Chapter, and Verse (conditionally).
 * MRP v1.2: Increases font size for dropdowns.
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
    isDisabled = false,
    viewMode
}) {

    const handleBookSelect = (e) => { onBookChange(e.target.value); };
    const handleChapterSelect = (e) => { onChapterChange(e.target.value ? parseInt(e.target.value, 10) : null); };
    const handleVerseSelect = (e) => { onVerseChange(e.target.value ? parseInt(e.target.value, 10) : null); };

    // >> CHANGE 1: Update baseSelectClasses for font size <<
    const baseSelectClasses = "p-2 border rounded text-lg sm:text-xl bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-150"; // Use text-lg/xl
    const baseLabelClasses = "sr-only";

    return (
        <div className="flex flex-wrap gap-2 items-center">
            {/* --- Book Selector --- */}
            <label htmlFor="book-select" className={baseLabelClasses}>Select Bible Book</label>
            <select
                id="book-select"
                value={selectedBook || ""}
                onChange={handleBookSelect}
                disabled={isDisabled || bookList.length === 0}
                className={baseSelectClasses} // Apply updated classes
                aria-label="Select Bible Book"
                aria-disabled={isDisabled || bookList.length === 0}
                aria-describedby={bookList.length === 0 ? "book-select-loading-desc" : undefined}
            >
                <option value="" disabled>-- Select Book --</option>
                {bookList.map(book => (
                    <option key={book} value={book}>{book}</option>
                ))}
            </select>
             {bookList.length === 0 && <span id="book-select-loading-desc" className="sr-only">Book list is loading.</span>}

            {/* --- Chapter Selector --- */}
            <label htmlFor="chapter-select" className={baseLabelClasses}>Select Bible Chapter</label>
            <select
                id="chapter-select"
                value={selectedChapter || ""}
                onChange={handleChapterSelect}
                disabled={isDisabled || !selectedBook || chapterList.length === 0}
                className={baseSelectClasses} // Apply updated classes
                aria-label="Select Bible Chapter"
                aria-disabled={isDisabled || !selectedBook || chapterList.length === 0}
                aria-describedby={!selectedBook ? "chapter-select-disabled-desc" : undefined}
            >
                <option value="" disabled>-- Chapter --</option>
                {chapterList.map(chap => (
                    <option key={chap} value={chap}>{chap}</option>
                ))}
            </select>
             {!selectedBook && <span id="chapter-select-disabled-desc" className="sr-only">Select a book first to enable chapters.</span>}

            {/* --- Verse Selector (Conditional) --- */}
            {viewMode === 'verse' && selectedChapter && (
                <>
                    <label htmlFor="verse-select" className={baseLabelClasses}>Select Bible Verse</label>
                    <select
                        id="verse-select"
                        value={selectedVerse || ""}
                        onChange={handleVerseSelect}
                        disabled={isDisabled || verseList.length === 0}
                        className={baseSelectClasses} // Apply updated classes
                        aria-label="Select Bible Verse (Optional)"
                        aria-disabled={isDisabled || verseList.length === 0}
                        aria-describedby={verseList.length === 0 && selectedChapter ? "verse-select-loading-desc" : undefined}
                    >
                        <option value="" disabled>-- Verse --</option>
                        {verseList.map(verse => (
                            <option key={verse} value={verse}>{verse}</option>
                        ))}
                    </select>
                     {verseList.length === 0 && selectedChapter && <span id="verse-select-loading-desc" className="sr-only">Verses are loading or unavailable for this chapter.</span>}
                </>
            )}
        </div>
    );
}

export default ReferenceSelector;