import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { Message } from '../types';
import { Icons } from './Icons';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.sender === 'ai';
  const isMarkdown = typeof message.content === 'string';
  const isDocResponse = message.type === 'doc';

  if (isDocResponse) {
    return (
      <div className="w-full animate-in fade-in duration-500 slide-in-from-bottom-2">
        {message.content}
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-500 slide-in-from-bottom-2 group">
      {/* The Card Bubble - Increased transparency as requested (approx 50%) */}
      <div className="relative bg-white/50 backdrop-blur-xl rounded-lg p-4 shadow-sm border border-white/40 flex gap-4 items-start hover:bg-white/60 transition-colors">
        
        {/* Avatar Section */}
        <div className="flex-shrink-0 mt-0.5">
          {isAI ? (
            <div className="w-7 h-7 bg-gray-900/90 rounded-lg flex items-center justify-center text-white shadow-md shadow-gray-200/50">
              <Icons.Sparkles className="w-3.5 h-3.5 fill-white" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full overflow-hidden shadow-sm border border-white/50">
              <img 
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" 
                alt="User" 
                className="w-full h-full object-cover" 
              />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-grow min-w-0">
          {/* Text Content */}
          <div className="text-gray-800 text-sm leading-relaxed font-normal">
            {isMarkdown ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                className="max-w-none"
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  a: ({ children, ...props }) => (
                    <a
                      className="text-blue-600 hover:text-blue-700 underline"
                      target="_blank"
                      rel="noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  code: ({ children, ...props }) => (
                    <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-900 text-xs" {...props}>
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="my-2 rounded-lg bg-slate-900 text-slate-100 text-xs p-3 overflow-x-auto">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-slate-300 pl-3 my-2 text-slate-600">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              message.content
            )}
          </div>

          {/* Footer Actions */}
          {isAI && (
             <div className="flex gap-2 text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity w-fit">
               <button className="hover:text-gray-800 transition-colors hover:bg-white/60 p-1 rounded">
                  <Icons.ThumbsUp className="w-3.5 h-3.5" />
               </button>
               <button className="hover:text-gray-800 transition-colors hover:bg-white/60 p-1 rounded">
                  <Icons.ThumbsDown className="w-3.5 h-3.5" />
               </button>
             </div>
          )}
        </div>

      </div>
    </div>
  );
};
