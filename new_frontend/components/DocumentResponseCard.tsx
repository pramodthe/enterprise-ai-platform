import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  chatMarkdownComponents,
  chatMarkdownRemarkPlugins,
  dataImageUrlTransform,
} from '../lib/markdownRendering';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle
} from 'lucide-react';

interface DocumentSource {
  title?: string;
  document_name?: string;
  url?: string;
  breadcrumbs?: string;
  section_hint?: string;
}

interface DocumentResponseCardProps {
  answerMarkdown: string;
  sources?: DocumentSource[];
  followUpQuestions?: string[];
  userNotices?: string[];
  onFollowUpClick?: (question: string) => void;
  isLatest?: boolean;
}

export const DocumentResponseCard: React.FC<DocumentResponseCardProps> = ({
  answerMarkdown,
  sources = [],
  followUpQuestions = [],
  userNotices = [],
  onFollowUpClick,
  isLatest = true
}) => {
  const [showSources, setShowSources] = useState(false);
  const hasSources = sources.length > 0;

  return (
    <div className="flex flex-col gap-3 max-w-3xl w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 overflow-hidden">
        <div className="p-4 text-sm text-gray-800">
          <ReactMarkdown
            remarkPlugins={chatMarkdownRemarkPlugins}
            className="max-w-none"
            urlTransform={dataImageUrlTransform}
            components={chatMarkdownComponents}
          >
            {answerMarkdown}
          </ReactMarkdown>
        </div>

        {userNotices.length > 0 && (
          <div className="mx-4 mb-4 p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex gap-3 text-xs text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <ul className="list-disc pl-4 space-y-1">
              {userNotices.map((notice, idx) => (
                <li key={idx}>{notice}</li>
              ))}
            </ul>
          </div>
        )}

        {hasSources ? (
          <div className="border-t border-slate-100/80">
            <button
              onClick={() => setShowSources(!showSources)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-500 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3 h-3" />
                <span>{sources.length} Sources Cited</span>
              </div>
              {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showSources && (
              <div className="px-4 pb-3 bg-slate-50/60 grid gap-2">
                {sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url || '#'}
                    className="flex items-center gap-3 p-2 rounded bg-white/90 border border-white/60 hover:border-orange-200 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-orange-500">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">
                        {source.title || source.document_name || 'Untitled Document'}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {source.breadcrumbs || source.section_hint || 'Internal Documentation'}
                      </p>
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-orange-500" />
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-2 border-t border-slate-100/80 text-[10px] text-slate-400 italic">
            No sources were cited for this response.
          </div>
        )}
      </div>

      {isLatest && followUpQuestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
          {followUpQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onFollowUpClick?.(q)}
              className="text-left p-2.5 rounded-lg bg-orange-50/60 border border-orange-100 hover:bg-orange-50 hover:border-orange-200 transition-all group flex items-start gap-2"
            >
              <HelpCircle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-orange-900 font-medium group-hover:text-orange-700 leading-snug">
                {q}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
