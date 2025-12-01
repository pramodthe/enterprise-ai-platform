import React, { useState } from 'react';
import {
    BookOpen,
    HelpCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    FileText,
    ArrowRight
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const RagResponseCard = ({ data, onFollowUpClick, isLatest }) => {
    const [showSources, setShowSources] = useState(false);

    if (!data) return null;

    // Handle both structured sources and legacy source_documents
    const sources = data.sources || data.source_documents || [];
    const hasSources = sources.length > 0;

    return (
        <div className="flex flex-col gap-3 max-w-3xl w-full animate-fade-in-up">

            {/* 1. Main Answer Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Markdown Content */}
                <div className="p-4">
                    <MarkdownRenderer content={data.answer_markdown} />
                </div>

                {/* Notices/Warnings if any */}
                {data.user_notices && data.user_notices.length > 0 && (
                    <div className="mx-6 mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-xs text-amber-800">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <ul className="list-disc pl-4">
                            {data.user_notices.map((notice, idx) => <li key={idx}>{notice}</li>)}
                        </ul>
                    </div>
                )}

                {/* Sources Section (Collapsible) */}
                {hasSources ? (
                    <div className="border-t border-slate-100">
                        <button
                            onClick={() => setShowSources(!showSources)}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-3 h-3" />
                                <span>{sources.length} Sources Cited</span>
                            </div>
                            {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {showSources && (
                            <div className="px-4 pb-3 bg-slate-50 grid gap-2">
                                {sources.map((source, idx) => (
                                    <a key={idx} href={source.url || '#'} className="flex items-center gap-3 p-2 rounded bg-white border border-slate-200 hover:border-purple-300 transition-colors group">
                                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-purple-500">
                                            <FileText className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-slate-700 truncate">{source.title || source.document_name || 'Untitled Document'}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{source.breadcrumbs || source.section_hint || 'Internal Documentation'}</p>
                                        </div>
                                        <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-purple-500" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 italic">
                        No external sources cited for this summary.
                    </div>
                )}
            </div>

            {/* 3. Follow-up Questions (Action Buttons) - ADJUSTED SIZE */}
            {isLatest && data.follow_up_questions && data.follow_up_questions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1 animate-fade-in">
                    {data.follow_up_questions.map((q, idx) => (
                        <button
                            key={idx}
                            onClick={() => onFollowUpClick(q)}
                            className="text-left p-2.5 rounded-lg bg-purple-50/50 border border-purple-100 hover:bg-purple-50 hover:border-purple-300 transition-all group flex items-start gap-2"
                        >
                            <HelpCircle className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-purple-900 font-medium group-hover:text-purple-700 leading-snug">{q}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RagResponseCard;
