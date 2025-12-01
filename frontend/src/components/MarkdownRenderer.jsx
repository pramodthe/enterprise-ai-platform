import React from 'react';

// Helper to parse inline styles (bold, etc.)
const parseInlineStyles = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
        ) : (
            <span key={i}>{part}</span>
        )
    );
};

// Helper to render a table from an array of Markdown table lines
const renderTable = (rows, key) => {
    if (rows.length < 2) return null; // Need at least header and separator

    // Clean and split rows
    const parseRow = (row) => row.split('|').filter(c => c.trim().length > 0).map(c => c.trim());

    const headers = parseRow(rows[0]);

    const bodyRows = rows.slice(2).map(parseRow);

    return (
        <div key={key} className="overflow-x-auto my-3 border border-slate-200 rounded-lg shadow-sm">
            <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 whitespace-nowrap">{parseInlineStyles(h)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {bodyRows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-slate-50/50 transition-colors">
                            {row.map((cell, ci) => (
                                <td key={ci} className="px-3 py-2 text-slate-600">
                                    {/* Basic cell rendering */}
                                    {parseInlineStyles(cell)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// A lightweight Markdown parser
const MarkdownRenderer = ({ content }) => {
    if (!content) return null;

    const lines = content.split('\n');
    const rendered = [];
    let tableBuffer = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // 1. Table Detection
        if (trimmed.startsWith('|')) {
            tableBuffer.push(trimmed);
            if (index === lines.length - 1) {
                rendered.push(renderTable(tableBuffer, `tbl-${index}`));
            }
            return;
        }

        if (tableBuffer.length > 0) {
            rendered.push(renderTable(tableBuffer, `tbl-${index}`));
            tableBuffer = [];
        }

        // 2. Headers (# or ##)
        // Adjusted to text-sm font-bold for consistency
        if (trimmed.startsWith('#')) {
            const headerContent = trimmed.replace(/^#+\s*/, '');
            rendered.push(
                <h2 key={index} className="text-sm font-bold text-slate-900 mt-3 mb-2">
                    {parseInlineStyles(headerContent)}
                </h2>
            );
            return;
        }

        // 3. Lists (- )
        if (trimmed.startsWith('- ')) {
            rendered.push(
                <div key={index} className="flex items-start gap-2 ml-1 mb-1">
                    <span className="mt-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0" />
                    <span className="text-slate-700 leading-normal text-xs">
                        {parseInlineStyles(trimmed.replace('- ', ''))}
                    </span>
                </div>
            );
            return;
        }

        // 4. Standard Paragraphs
        if (trimmed.length > 0) {
            rendered.push(
                <p key={index} className="text-slate-700 mb-2 leading-normal text-xs">
                    {parseInlineStyles(trimmed)}
                </p>
            );
        }
    });

    return <div className="text-xs">{rendered}</div>;
};

export default MarkdownRenderer;
