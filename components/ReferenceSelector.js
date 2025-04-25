// components/ReferenceSelector.js (MRP v1.10 - Simplified Widths)
"use client";

import React from 'react';

/**
 * Component providing dropdowns for selecting Bible Book, Chapter, and Verse.
 * MRP v1.10: Removes explicit mobile widths, relies on flex-wrap in parent.
 */
function ReferenceSelector({
    bookList = [], chapterList = [], verseList = [],
    selectedBook, selectedChapter, selectedVerse,
    onBookChange, onChapterChange, onVerseChange,
    isDisabled = false, viewMode
}) {

    const handleBookSelect = (e) => { onBookChange(e.target.value); };
    const handleChapterSelect = (e) => { onChapterChange(e.target.value ? parseInt(e.target.value, 10) : null); };
    const handleVerseSelect = (e) => { onVerseChange(e.target.value ? parseInt(e.target.value, 10) : null); };

    // Base classes + Larger font size from previous step
    const baseSelectClasses = "p-2 border rounded text-lg sm:text-xl bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors duration-150";
    const baseLabelClasses = "sr-only";

    return (
        // Use flex-wrap and let items take natural width, allow shrinking
        <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start">
            {/* --- Book Selector --- */}
            {/* REMOVED Width classes, added flex-shrink */}
            <label htmlFor="book-select" className={baseLabelClasses}>Select Bible Book</label>
            <select
                id="book-select"
                value={selectedBook || ""}
                onChange={handleBookSelect}
                disabled={isDisabled || bookList.length === 0}
                className={`${baseSelectClasses} flex-shrink min-w-[80px]`} // Allow shrinking, set a min-width
                aria-label="Select Bible Book"
                aria-disabled={isDisabled || bookList.length === 0}
                aria-describedby={bookList.length === 0 ? "book-select-loading-desc" : undefined}
            >
                <option value="" disabled>-- Book --</option> {/* Shortened default */}
                {bookList.map(book => (
                    <option key={book} value={book}>{book}</option>
                ))}
            </select>
             {bookList.length === 0 && <span id="book-select-loading-desc" className="sr-only">Book list is loading.</span>}


            {/* --- Chapter Selector --- */}
            {/* REMOVED Width classes, added flex-shrink */}
            <label htmlFor="chapter-select" className={baseLabelClasses}>Select Bible Chapter</label>
            <select
                id="chapter-select"
                value={selectedChapter || ""}
                onChange={handleChapterSelect}
                disabled={isDisabled || !selectedBook || chapterList.length === 0}
                className={`${baseSelectClasses} flex-shrink min-w-[60px]`} // Allow shrinking, set a min-width
                aria-label="Select Bible Chapter"
                aria-disabled={isDisabled || !selectedBook || chapterList.length === 0}
                aria-describedby={!selectedBook ? "chapter-select-disabled-desc" : undefined}
            >
                <option value="" disabled>Ch</option> {/* Shortened default */}
                {chapterList.map(chap => (
                    <option key={chap} value={chap}>{chap}</option>
                ))}
            </select>
             {!selectedBook && <span id="chapter-select-disabled-desc" className="sr-only">Select a book first.</span>}

            {/* --- Verse Selector (Conditional) --- */}
            {viewMode === 'verse' && (
                <>
                    {/* REMOVED Width classes, added flex-shrink */}
                    <label htmlFor="verse-select" className={baseLabelClasses}>Select Bible Verse</label>
                    <select
                        id="verse-select"
                        value={selectedVerse || ""}
                        onChange={handleVerseSelect}
                        disabled={isDisabled || !selectedChapter || verseList.length === 0} // Disable if no chapter selected
                        className={`${baseSelectClasses} flex-shrink min-w-[60px]`} // Allow shrinking, set a min-width
                        aria-label="Select Bible Verse (Optional)"
                        aria-disabled={isDisabled || !selectedChapter || verseList.length === 0}
                        aria-describedby={verseList.length === 0 && selectedChapter ? "verse-select-loading-desc" : undefined}
                    >
                        <option value="" disabled>Vs</option> {/* Shortened default */}
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