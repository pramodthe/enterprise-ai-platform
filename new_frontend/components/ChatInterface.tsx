import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { Icons } from './Icons';
import { ChatMessage } from './ChatMessage';
import { DocumentResponseCard } from './DocumentResponseCard';
import { Message, AppMode, User, PersonProfile } from '../types';
import { chat, uploadDocument, listDocuments, deleteDocument } from '../lib/api';

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

interface UploadedFile {
  name: string;
  data: string;
  mimeType: string;
}

interface ChatInterfaceProps {
  mode: AppMode;
  onBack: () => void;
  user: User | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ mode, onBack, user }) => {
  const { getToken } = useAuth();
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
  const renderMarkdownText = (text: string) => (
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
      {text}
    </ReactMarkdown>
  );

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hrSessionIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    setMessages(getInitialMessages());
    setAttachedFiles([]);
    setSelectedDocumentId(null);
    if (mode === 'docs') {
      loadDocuments();
    }
  }, [mode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDocuments = async () => {
    try {
      const token = await getToken();
      const { documents } = await listDocuments(token ?? undefined);
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
        const token = await getToken();
        await uploadDocument(file, token ?? undefined);
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
      const token = await getToken();
      await deleteDocument(docId, token ?? undefined);
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
    if (mode === 'docs' && !selectedDocumentId) return;

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
      const token = await getToken();
      const { text, people, isDocumentResponse, documentSources, followUpQuestions, userNotices } = await chat(
        mode,
        currentInput,
        token ?? undefined,
        mode === 'hr' ? hrSessionIdRef.current : undefined,
        mode === 'docs' ? selectedDocumentId : undefined
      );

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
                {text && <div className="mb-2">{renderMarkdownText(text)}</div>}
                {renderPeopleCards(people)}
              </div>
            )
            : text,
        type: isDocumentResponse ? 'doc' : 'text'
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error("Error with API:", error);
       setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: 'ai',
        timestamp: new Date().toLocaleDateString(),
        content: user ? "I'm sorry, I encountered an error. Please check your connection and try again." : "Please sign in to use the AI assistant.",
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

  const activeQueries = mode === 'hr' ? HR_QUERIES : mode === 'analytics' ? ANALYTICS_QUERIES : [];
  const shouldShowQueries = activeQueries.length > 0 && messages.length <= 1;
  const canSend = !!inputValue.trim() && !isLoading && (mode !== 'docs' || !!selectedDocumentId);

  return (
    <div className="w-full h-full flex overflow-hidden">

      {/* Sidebar - Visible only in Docs mode */}
      {mode === 'docs' && (
        <div className="w-80 flex-shrink-0 bg-white/40 backdrop-blur-xl border-r border-white/40 flex flex-col animate-in slide-in-from-left-5 duration-500 z-30">
          <div className="p-6 border-b border-white/40 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Icons.Library className="w-5 h-5 text-orange-600" />
                Knowledge Base
              </h2>
              <p className="text-xs text-gray-500 mt-1">Upload PDFs to chat with.</p>
            </div>
            {(attachedFiles.length > 0 || documents.length > 0) && (
              <button
                onClick={() => { setAttachedFiles([]); setDocuments([]); setSelectedDocumentId(null); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             {documents.length === 0 && attachedFiles.length === 0 ? (
               <div className="text-center py-10 px-4 border-2 border-dashed border-gray-300 rounded-xl bg-white/20">
                 <Icons.Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                 <p className="text-sm text-gray-500">No documents yet</p>
               </div>
             ) : (
               <>
                {documents.map((doc) => {
                  const isSelected = doc.id === selectedDocumentId;
                  return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocumentSelection(doc.id)}
                    className={`group relative bg-white/60 border border-white/40 rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-pointer ${isSelected ? 'ring-2 ring-orange-400/60 bg-orange-50/40' : ''}`}
                    title={isSelected ? 'Selected document' : 'Select document'}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center flex-shrink-0 border border-red-100">
                        <Icons.FileText className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1 pr-6">
                        <p className="text-sm font-medium text-gray-800 truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-[10px] text-gray-500">PDF Document</p>
                      </div>
                    </div>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteDocument(doc.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100/80 rounded-md transition-all"
                      title="Remove file"
                    >
                      <Icons.Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
                })}
                {attachedFiles.map((file, idx) => (
                  <div key={`att-${idx}`} className="group relative bg-white/60 border border-white/40 rounded-lg p-3 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center flex-shrink-0 border border-red-100">
                        <Icons.FileText className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1 pr-6">
                        <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>{file.name}</p>
                        <p className="text-[10px] text-gray-500">PDF Document</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100/80 rounded-md transition-all"
                      title="Remove file"
                    >
                      <Icons.Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
               </>
             )}
          </div>

          <div className="p-4 border-t border-white/40 bg-white/20">
             <input
               type="file"
               accept=".pdf"
               className="hidden"
               ref={fileInputRef}
               onChange={handleFileUpload}
             />
             <button
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploading}
               className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg shadow-lg shadow-gray-200/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
             >
               {isUploading ? (
                 <>
                   <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                   </svg>
                   Uploading...
                 </>
               ) : (
                 <>
                   <Icons.Plus className="w-4 h-4" />
                   Upload Document
                 </>
               )}
             </button>
          </div>
        </div>
      )}

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

              <div className="flex items-center gap-3 flex-1">
                <Icons.Sparkles className={`w-4 h-4 transition-colors ${isFocused ? 'text-gray-900' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder={mode === 'hr' ? "Ask about employees..." : mode === 'docs' ? (selectedDocumentId ? "Search documents or ask questions..." : "Select a document from the library to start...") : "Ask me anything..."}
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
          {shouldShowQueries && user && (
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

          {/* Sign in prompt for unauthenticated users */}
          {!user && messages.length <= 1 && (
            <div className="w-full mt-6 p-4 bg-white/40 border border-white/40 rounded-xl">
              <p className="text-sm text-gray-600 text-center">
                Please <span className="text-[#7c3aed] font-medium">sign in</span> to use the AI assistant.
              </p>
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

    </div>
  );
};
