import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
  chatMarkdownComponents,
  chatMarkdownRemarkPlugins,
  dataImageUrlTransform,
  splitLeadingDataImageMarkdown,
} from '../lib/markdownRendering';
import { Message } from '../types';
import { Icons } from './Icons';

interface ChatMessageProps {
  message: Message;
}

/** Legacy analytics API returned raw JSON; convert so markdown + images work. */
function coerceAnalyticsContentToMarkdown(content: string): string {
  const t = content.trim();
  if (!t.startsWith('{') || !t.includes('"image_base64"')) return content;
  try {
    const o = JSON.parse(t) as Record<string, unknown>;
    const b64 = o.image_base64;
    if (typeof b64 !== 'string' || !b64) return content;
    const fmt = String(o.format || 'png').toLowerCase();
    const mime = fmt === 'jpg' || fmt === 'jpeg' ? 'image/jpeg' : `image/${fmt === 'webp' ? 'webp' : 'png'}`;
    const desc = String(o.description || 'Chart').replace(/[[\]]/g, '');
    const parts: string[] = [`![${desc}](data:${mime};base64,${b64})`];
    const analysis = o.analysis;
    if (analysis && typeof analysis === 'object') {
      parts.push('\n### Key metrics\n');
      for (const [k, v] of Object.entries(analysis)) {
        parts.push(`- **${k.replace(/_/g, ' ')}:** ${String(v)}`);
      }
    }
    if (typeof o.report === 'string' && o.report.trim()) {
      parts.push('\n\n', o.report.trim());
    }
    return parts.join('\n');
  } catch {
    return content;
  }
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.sender === 'ai';
  const isMarkdown = typeof message.content === 'string';
  const isDocResponse = message.type === 'doc';
  const markdownSource =
    isMarkdown && typeof message.content === 'string'
      ? coerceAnalyticsContentToMarkdown(message.content)
      : '';

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
              (() => {
                const { imageBlock, body } = splitLeadingDataImageMarkdown(markdownSource);
                const mdProps = {
                  remarkPlugins: chatMarkdownRemarkPlugins,
                  className: 'max-w-none text-gray-800',
                  urlTransform: dataImageUrlTransform,
                  components: chatMarkdownComponents,
                } as const;
                return (
                  <>
                    {imageBlock ? (
                      <ReactMarkdown {...mdProps}>{imageBlock}</ReactMarkdown>
                    ) : null}
                    <ReactMarkdown {...mdProps}>{imageBlock ? body : markdownSource}</ReactMarkdown>
                  </>
                );
              })()
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
