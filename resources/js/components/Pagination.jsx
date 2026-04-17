import React from 'react';

const ITEMS_PER_PAGE_DEFAULT = 10;

function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, onLimitChange }) {
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <span>Menampilkan <strong className="text-gray-700">{startItem}-{endItem}</strong> dari <strong className="text-green-600">{totalItems}</strong> data</span>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-1">
                    <span>Tampilkan:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onLimitChange(Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-green-400"
                    >
                        {[10, 20, 50, 100].map(n => (
                            <option key={n} value={n}>{n} Baris</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] transition-all ${currentPage === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-600 hover:bg-green-600 hover:text-white hover:border-green-600'}`}
                >
                    <i className="fas fa-chevron-left text-[10px]"></i>
                </button>
                {getPageNumbers().map((page, idx) => (
                    <button
                        key={idx}
                        onClick={() => typeof page === 'number' && onPageChange(page)}
                        disabled={page === '...'}
                        className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded-lg text-[11px] font-semibold transition-all ${page === currentPage
                            ? 'bg-green-600 text-white shadow-sm'
                            : page === '...'
                                ? 'text-gray-400 cursor-default'
                                : 'bg-white border border-gray-300 text-gray-600 hover:bg-green-50'
                            }`}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[11px] transition-all ${currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-600 hover:bg-green-600 hover:text-white hover:border-green-600'}`}
                >
                    <i className="fas fa-chevron-right text-[10px]"></i>
                </button>
            </div>
        </div>
    );
}

export { ITEMS_PER_PAGE_DEFAULT };
export default Pagination;
