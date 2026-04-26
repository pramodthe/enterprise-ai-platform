import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  chatMarkdownComponents,
  chatMarkdownRemarkPlugins,
  dataImageUrlTransform,
  splitLeadingDataImageMarkdown,
} from '../lib/markdownRendering';
import { Icons } from './Icons';
import { ChatMessage } from './ChatMessage';
import { DocumentResponseCard } from './DocumentResponseCard';
import { Message, AppMode, PersonProfile } from '../types';
import { chat, uploadDocument, listDocuments, deleteDocument } from '../lib/api';

/** True when fetch never reached the app (proxy down, wrong host, offline). */
function isLikelyNetworkFailure(err: unknown): boolean {
  const raw = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    raw.includes('failed to fetch') ||
    raw.includes('networkerror') ||
    raw.includes('load failed') ||
    raw.includes('err_connection_refused') ||
    raw.includes('aborted')
  );
}

/** Prefer FastAPI `detail` and strip noisy wrappers so 401/500 are visible in chat. */
function formatChatApiError(err: unknown): string | null {
  const raw = (err instanceof Error ? err.message : String(err)).trim();
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as { detail?: unknown };
    if (typeof j.detail === 'string' && j.detail.trim()) {
      let d = j.detail.trim();
      const prefixes = [
        'Error processing HR query: ',
        'Error processing analytics query: ',
        'Error processing query: ',
      ];
      for (const p of prefixes) {
        if (d.startsWith(p)) d = d.slice(p.length).trim();
      }
      return d.length > 800 ? `${d.slice(0, 800)}…` : d;
    }
  } catch {
    /* not JSON */
  }
  return raw.length > 800 ? `${raw.slice(0, 800)}…` : raw;
}

// -- Pre-defined initial states for different modes --

const ANALYTICS_MESSAGES: Message[] = [
  {
    id: 'init-analytics',
    sender: 'ai',
    timestamp: 'Just now',
    content: (
      <div className="flex flex-col gap-2">
        <p>Hello! I'm your <strong>Analytics Assistant</strong>.</p>
        <p>I can help you analyze performance metrics, review financial reports, or calculate growth projections.</p>
      </div>
    ),
    type: 'text'
  }
];

const HR_MESSAGES: Message[] = [
  {
    id: 'init-hr',
    sender: 'ai',
    timestamp: 'Just now',
    content: (
      <div className="flex flex-col gap-2">
        <p>Hello! I'm your <strong>HR Assistant</strong>.</p>
        <p>I can help you look up employee details, check organizational charts, or find the best candidates for a new project based on skills.</p>
      </div>
    ),
    type: 'text'
  }
];

const DOCS_MESSAGES: Message[] = [
  {
    id: 'init-docs',
    sender: 'ai',
    timestamp: 'Just now',
    content: (
      <div className="flex flex-col gap-2">
         <p><strong>Document Intelligence</strong> is ready.</p>
         <p>Please upload a PDF document in the sidebar to get started. I can summarize it or answer questions about its content.</p>
      </div>
    ),
    type: 'text'
  }
];

const ARC_MARKETPLACE_MESSAGES: Message[] = [
  {
    id: 'init-arc-marketplace',
    sender: 'ai',
    timestamp: 'Just now',
    content: (
      <div className="flex flex-col gap-2">
        <p>Hello! Welcome to <strong>Arc_Marketplace</strong>.</p>
        <p>
          Chat here uses the <strong>autonomous LLM buyer</strong> demo API (<code className="rounded bg-gray-100 px-1 text-xs">POST …/demo/autonomous-llm-buyer/chat</code>).
          Run the example <code className="rounded bg-gray-100 px-1 text-xs">chat_server.py</code> (default port 9095); in dev the UI proxies via{' '}
          <code className="rounded bg-gray-100 px-1 text-xs">/autonomous-buyer-proxy</code> unless you set <code className="rounded bg-gray-100 px-1 text-xs">VITE_AUTONOMOUS_BUYER_CHAT_URL</code>.
        </p>
      </div>
    ),
    type: 'text'
  }
];

const HR_QUERIES = [
  "Find employees with Python skills",
  "Show organizational chart for Engineering",
  "List employees with AWS certification",
  "Who are the team leads in Marketing?",
  "Draft a job description for a Senior React Dev",
  "What is the remote work policy?"
];

const ANALYTICS_QUERIES = [
  "Executive Summary Dashboard",
  "Revenue Deep Dive",
  "Product Performance Report",
  "Traffic & Engagement Analysis",
  "Profitability Dashboard",
  "Calculate 15% growth on $1.2M revenue"
];

const ARC_MARKETPLACE_QUERIES = [
  'Find a demo tool and invoke it once.',
  'List marketplace capabilities I can try.',
  'What agents or integrations are available?',
  'Search for a template and summarize it.',
  'Plan a short evaluation of two tools.',
  'What should I buy or enable next for my team?',
];

interface UploadedFile {
  name: string;
  data: string;
  mimeType: string;
}

interface ChatInterfaceProps {
  mode: AppMode;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, onBack }) => {
  const getInitials = (name: string) => name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();

  const renderPeopleCards = (people: PersonProfile[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      {people.map((person) => (
        <div key={person.id} className="flex gap-3 rounded-xl bg-white/70 border border-white/60 p-3 shadow-sm">
          {person.avatar_url ? (
            <img
              src={person.avatar_url}
              alt={person.name}
              className="w-12 h-12 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-900/90 text-white flex items-center justify-center text-xs font-semibold">
              {getInitials(person.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-gray-900 truncate">{person.name}</p>
              {person.department && (
                <span className="text-[10px] uppercase tracking-wide text-gray-500">
                  {person.department}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600">{person.title}</p>
            {person.bio && <p className="text-xs text-gray-500 mt-1">{person.bio}</p>}
            <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-gray-500">
              {person.email && <span>{person.email}</span>}
              {person.location && <span>{person.location}</span>}
            </div>
            {person.skills && person.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {person.skills.slice(0, 4).map((skill) => (
                  <span key={skill} className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
  const renderMarkdownText = (text: string) => {
    const { imageBlock, body } = splitLeadingDataImageMarkdown(text);
    const mdProps = {
      remarkPlugins: chatMarkdownRemarkPlugins,
      className: 'max-w-none text-gray-800',
      urlTransform: dataImageUrlTransform,
      components: chatMarkdownComponents,
    } as const;
    return (
      <>
        {imageBlock ? <ReactMarkdown {...mdProps}>{imageBlock}</ReactMarkdown> : null}
        <ReactMarkdown {...mdProps}>{imageBlock ? body : text}</ReactMarkdown>
      </>
    );
  };

  const renderDocumentResponse = (
    answerMarkdown: string,
    sources: Array<{ title?: string; url?: string; breadcrumbs?: string }>,
    followUpQuestions: string[],
    userNotices: string[]
  ) => (
    <DocumentResponseCard
      answerMarkdown={answerMarkdown}
      sources={sources}
      followUpQuestions={followUpQuestions}
      userNotices={userNotices}
      onFollowUpClick={(question) => handleSend(question)}
      isLatest
    />
  );
  const getInitialMessages = () => {
    switch(mode) {
      case 'analytics': return ANALYTICS_MESSAGES;
      case 'hr': return HR_MESSAGES;
      case 'docs': return DOCS_MESSAGES;
      case 'arc_marketplace': return ARC_MARKETPLACE_MESSAGES;
      default: return [];
    }
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const [documents, setDocuments] = useState<Array<{ id: string; name: string; uploaded_at: string }>>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [includeAutonomousBuyerTrace, setIncludeAutonomousBuyerTrace] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hrSessionIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    setMessages(getInitialMessages());
    setAttachedFiles([]);
    setSelectedDocumentId(null);
    setIncludeAutonomousBuyerTrace(false);
  }, [mode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDocuments = async () => {
    try {
      const { documents } = await listDocuments();
      const normalizedDocs = documents || [];
      setDocuments(normalizedDocs);
      if (selectedDocumentId && !normalizedDocs.some((doc) => doc.id === selectedDocumentId)) {
        setSelectedDocumentId(null);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setIsUploading(true);
      try {
        await uploadDocument(file);
        await loadDocuments();
      } catch (error) {
        console.error('Upload failed:', error);
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          sender: 'ai',
          timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          content: "Failed to upload document. Please try again.",
          type: 'text'
        }]);
      } finally {
        setIsUploading(false);
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await deleteDocument(docId);
      if (selectedDocumentId === docId) {
        setSelectedDocumentId(null);
      }
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setAttachedFiles([]);
  };

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocumentId((prev) => (prev === docId ? null : docId));
  };

  const handleSend = async (text?: string) => {
    const currentInput = typeof text === 'string' ? text : inputValue;
    if (!currentInput.trim() || isLoading) return;
    if (mode === 'docs') return;

    setInputValue('');

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      content: currentInput,
      type: 'text'
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const { text, people, isDocumentResponse, documentSources, followUpQuestions, userNotices, autonomousBuyerMeta } =
        await chat(
          mode,
          currentInput,
          undefined,
          mode === 'hr' ? hrSessionIdRef.current : undefined,
          mode === 'docs' ? selectedDocumentId : undefined,
          mode === 'arc_marketplace' ? includeAutonomousBuyerTrace : undefined
        );

      let replyText = text;
      if (mode === 'arc_marketplace' && autonomousBuyerMeta) {
        const { buyerId, model } = autonomousBuyerMeta;
        if (buyerId || model) {
          const bits: string[] = [];
          if (buyerId) bits.push(`Buyer \`${buyerId}\``);
          if (model) bits.push(model);
          replyText = `${text}\n\n---\n_${bits.join(' · ')}_`;
        }
      }

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        timestamp: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        content: isDocumentResponse
          ? renderDocumentResponse(
              text,
              documentSources || [],
              followUpQuestions || [],
              userNotices || []
            )
            : people && people.length > 0
            ? (
              <div>
                {replyText && <div className="mb-2">{renderMarkdownText(replyText)}</div>}
                {renderPeopleCards(people)}
              </div>
            )
            : replyText,
        type: isDocumentResponse ? 'doc' : 'text'
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("Error with API:", error);
      const errMsg =
        mode === 'arc_marketplace'
          ? `Could not reach the autonomous buyer chat service. Run the example chat server (e.g. port 9095), or set VITE_AUTONOMOUS_BUYER_CHAT_URL. Details: ${error instanceof Error ? error.message : String(error)}`
          : isLikelyNetworkFailure(error)
            ? 'Could not reach the server. Start the API on port 8000 (`npm run backend` or `npm run dev:full` from `new_frontend`). If you opened the app via a LAN URL (not localhost), remove `VITE_API_BASE` or avoid loopback URLs so requests use the Vite proxy.'
            : (() => {
                const detail = formatChatApiError(error);
                const hint =
                  detail && /401|invalid.*api.*key|unauthorized/i.test(detail)
                    ? '\n\n**Fix:** Set a valid `OPENAI_API_KEY` (and matching `OPENAI_BASE_URL` for your provider) in `backend/.env`, then restart the API.'
                    : '';
                return `**Request failed**\n\n${detail ?? (error instanceof Error ? error.message : String(error))}${hint}`;
              })();
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: 'ai',
        timestamp: new Date().toLocaleDateString(),
        content: errMsg,
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setIsClearDialogOpen(false);
  };

  const activeQueries =
    mode === 'hr' ? HR_QUERIES : mode === 'analytics' ? ANALYTICS_QUERIES : mode === 'arc_marketplace' ? ARC_MARKETPLACE_QUERIES : [];
  const shouldShowQueries = activeQueries.length > 0 && messages.length <= 1;
  const canSend = !!inputValue.trim() && !isLoading && (mode !== 'docs' || !!selectedDocumentId);

  return (
    <div className="w-full h-full flex overflow-hidden">
      {mode === 'docs' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-[#f3f4f6] p-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
          >
            <Icons.ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </button>
          <div className="w-full max-w-md rounded-2xl border border-amber-200/80 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
              <Icons.Library className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Doc Intelligence</h2>
            <p className="mt-2 text-sm text-gray-600">This feature is currently not available.</p>
          </div>
        </div>
      ) : (
      <>

      {/* Main Chat Area */}
      <div className="flex-1 h-full overflow-y-auto no-scrollbar relative flex flex-col items-center">

        {/* Floating Input Bar */}
        <div className="w-full sticky top-0 z-30 pt-6 pb-6">

          {/* Input Container */}
          <div className="w-full max-w-2xl mx-auto px-4">
            <div
              className={`
                relative
                w-full bg-white/60 backdrop-blur-xl rounded-lg p-1.5 pl-4 flex items-center justify-center gap-3 transition-all duration-300 ease-out
                ${isFocused
                  ? 'shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-2 ring-gray-900/5 border-gray-200 transform -translate-y-0.5'
                  : 'shadow-[0_8px_40px_rgba(0,0,0,0.12)] border border-white/40 ring-1 ring-black/5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] hover:border-white/60'
                }
              `}
            >
              <button
                className="absolute right-[calc(100%+16px)] top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center text-gray-500 hover:text-gray-900 bg-white/60 hover:bg-white/80 backdrop-blur-md w-10 h-10 rounded-full transition-all border border-white/40 shadow-sm hover:shadow-md group"
                onClick={onBack}
                title="Back to Dashboard"
              >
                <Icons.ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              {messages.length > 0 && (
                <button
                  className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center text-gray-500 hover:text-red-600 bg-white/60 hover:bg-red-50/80 backdrop-blur-md w-10 h-10 rounded-full transition-all border border-white/40 shadow-sm hover:shadow-md group"
                  onClick={() => setIsClearDialogOpen(true)}
                  title="Clear Chat History"
                >
                  <Icons.Trash className="w-5 h-5 transition-transform" />
                </button>
              )}

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icons.Sparkles className={`w-4 h-4 flex-shrink-0 transition-colors ${isFocused ? 'text-gray-900' : 'text-gray-500'}`} />
                {mode === 'arc_marketplace' && (
                  <label className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-gray-200/80 bg-white/50 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-white/80">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-gray-300"
                      checked={includeAutonomousBuyerTrace}
                      onChange={(e) => setIncludeAutonomousBuyerTrace(e.target.checked)}
                    />
                    Trace
                  </label>
                )}
                <input
                  type="text"
                  placeholder={
                    mode === 'hr'
                      ? "Ask about employees..."
                      : mode === 'docs'
                        ? (selectedDocumentId ? "Search documents or ask questions..." : "Select a document from the library to start...")
                        : mode === 'arc_marketplace'
                          ? "Ask about agents, integrations, or templates..."
                          : "Ask me anything..."
                  }
                  className="w-full text-gray-900 placeholder-gray-500 outline-none text-sm py-2 bg-transparent font-medium"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={() => handleSend()}
                disabled={!canSend}
                className={`flex items-center gap-2 bg-gray-900 text-white text-xs font-medium px-4 py-2 rounded-md hover:bg-black transition-all shadow-lg shadow-gray-200/50 ${!canSend ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Icons.CornerDownRight className="w-3 h-3" />
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Message List */}
        <div className="w-full max-w-2xl flex flex-col gap-2 pb-20 px-4 mt-[-1rem]">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Example Queries Grid */}
          {shouldShowQueries && (
            <div className="w-full mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
               <div className="flex items-center gap-2 mb-3 px-1">
                 <Icons.Sparkles className="w-3 h-3 text-purple-600" />
                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Example Queries</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {activeQueries.map((query, idx) => (
                   <button
                     key={idx}
                     onClick={() => handleSend(query)}
                     className="group flex items-center justify-between text-left p-3.5 rounded-xl bg-white/40 hover:bg-white/70 border border-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200"
                   >
                     <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">{query}</span>
                     <Icons.ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                   </button>
                 ))}
               </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Clear Chat Confirmation Dialog */}
      {isClearDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsClearDialogOpen(false)}
          />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-white/60 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Icons.AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Clear chat history?</h3>
                  <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  onClick={() => setIsClearDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100/50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearChat}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-all"
                >
                  Clear History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </>
      )}

    </div>
  );
};
