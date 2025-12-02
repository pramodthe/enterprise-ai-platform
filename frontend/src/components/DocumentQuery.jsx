import React, { useState, useEffect, useRef } from 'react';
import {
    Send,
    HelpCircle,
    FileText,
    AlertCircle,
    Upload,
    Trash2,
    Database
} from 'lucide-react';
import { documentsQuery, listDocuments, deleteDocument, uploadDocument } from '../services/api';
import RagResponseCard from './RagResponseCard';
import MessageBubble from './MessageBubble';


/**
 * ------------------------------------------------------------------
 * COMPONENTS
 * ------------------------------------------------------------------
 */

const LibrarySidebar = ({ onDocumentSelect, selectedDocumentId, files, setFiles }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleDelete = async (id) => {
        try {
            await deleteDocument(id);
            setFiles(files.filter(file => file.id !== id));
            // If the deleted file was selected, deselect it
            if (selectedDocumentId === id) {
                onDocumentSelect(null);
            }
        } catch (error) {
            console.error("Failed to delete document:", error);
            // Optionally add a toast or error message here
        }
    };

    const handleFileClick = (id) => {
        const newFiles = files.map(f => ({
            ...f,
            isActive: f.id === id
        }));
        setFiles(newFiles);
        // Notify parent component about the selection
        onDocumentSelect(id === selectedDocumentId ? null : id);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const response = await uploadDocument(file, (progressEvent) => {
                // Optional: Handle upload progress
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Upload progress: ${percentCompleted}%`);
            });

            // Add the new file to the list
            // The backend returns { message: "...", document_id: "..." }
            // We need to construct the file object for the UI
            // Assuming document_id is the filename as per backend logic
            const newFile = {
                id: response.document_id,
                name: file.name,
                type: file.type || 'application/pdf',
                date: new Date().toLocaleDateString(),
                isActive: false
            };

            setFiles(prev => [newFile, ...prev]);
        } catch (error) {
            console.error("Failed to upload document:", error);
            alert("Failed to upload document. Please try again.");
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        // Changed w-80 to w-64 for a narrower sidebar
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
            {/* Header */}
            <div className="p-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        Library
                        <span className="bg-slate-100 text-slate-600 text-xs py-0.5 px-2 rounded-full border border-slate-200">{files.length}</span>
                    </h2>
                </div>

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.md"
                />

                {/* Modern Upload Button: Dashed border, no background, smaller size */}
                <button
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="w-full group flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-purple-400 bg-transparent hover:bg-purple-50/30 text-slate-500 hover:text-purple-600 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-purple-600 rounded-full animate-spin"></div>
                    ) : (
                        <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600" />
                    )}
                    <span className="text-sm font-medium">{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                </button>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
                        <FileText className="w-8 h-8 mb-2 opacity-20" />
                        <p>No documents found</p>
                    </div>
                ) : (
                    files.map((file) => (
                        <div
                            key={file.id}
                            onClick={() => handleFileClick(file.id)}
                            className={`group p-3 rounded-xl border transition-all cursor-pointer ${file.isActive ? 'bg-purple-50/50 border-purple-200' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${file.isActive ? 'bg-white text-purple-600 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`text-sm font-semibold truncate ${file.isActive ? 'text-purple-900' : 'text-slate-700'}`}>
                                        {file.name}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                        {file.type} • {file.date}
                                    </p>
                                </div>

                                {/* Delete Button - Appears on Group Hover */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(file.id);
                                    }}
                                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Document"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Storage Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                    <div className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        Storage
                    </div>
                    <span>{Math.max(0, 27.5 - (3 - files.length) * 5)} MB / 1 GB</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.max(0, 2.7 - (3 - files.length) * 0.5)}%` }}></div>
                </div>
            </div>
        </div>
    );
};





const DocumentQuery = () => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [selectedDocumentId, setSelectedDocumentId] = useState(null);
    const messagesEndRef = useRef(null);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        // Only scroll if there are user messages or more than just the welcome message
        if (messages.length > 1) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Initial Welcome Message
    useEffect(() => {
        const initialBackendResponse = {
            answer_markdown: "## Welcome! 👋\n\nI'm your Company Knowledge Assistant. I can help you find information in our documents.\n\n**How to get started:**\n- Upload the document.\n- Select the document.\n- Ask specific questions.\n\nWhat would you like to know?",
            short_answer: "Hello! I'm your Company Knowledge Assistant. Ask me anything about company policies, procedures, or information from our internal documents.",
            sources: [],
            follow_up_questions: [],
            related_topics: [
                "Getting Started",
                "Company Policies",
                "HR Resources"
            ],
            user_notices: []
        };

        setMessages([{ type: 'bot', content: initialBackendResponse }]);
    }, []);

    const [files, setFiles] = useState([]);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const docs = await listDocuments();
                // Map backend response to UI format
                // Backend returns list of strings (filenames) or objects? 
                // Based on backend code: list_files_in_bucket returns list of dicts with 'name', 'id', etc?
                // Wait, let's check backend list_files_in_bucket return type.
                // It returns a list of objects from Supabase storage.
                // Let's assume it returns { name: "filename", ... }
                // We need to map it to { id: "filename", name: "filename", type: "...", date: "..." }
                // Using filename as ID for now as per backend logic
                const mappedFiles = docs.map(doc => {
                    // Extract original filename from timestamped name (e.g. "1740963365_filename.pdf")
                    // The backend prepends a timestamp and underscore
                    const nameParts = doc.name.split('_');
                    const displayName = nameParts.length > 1 && /^\d+$/.test(nameParts[0])
                        ? nameParts.slice(1).join('_')
                        : doc.name;

                    return {
                        id: doc.name, // Using filename as ID since backend uses it for deletion
                        name: displayName,
                        type: 'application/pdf', // Placeholder or derive from extension
                        date: new Date(doc.created_at || Date.now()).toLocaleDateString(),
                        isActive: false
                    };
                });
                setFiles(mappedFiles);
            } catch (error) {
                console.error("Failed to fetch documents:", error);
            }
        };
        fetchDocuments();
    }, []);

    const handleSend = async (textOverride = null) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim()) return;

        // 1. Add User Message
        setMessages(prev => [...prev, { type: 'user', content: textToSend }]);
        setInput('');
        setIsLoading(true);

        try {
            // 2. Call Backend Service with selected document if available
            // Get the selected document name based on ID (in a real implementation,
            // you would fetch actual document names from your backend)
            let documentId = null;
            if (selectedDocumentId) {
                const selectedFile = files.find(f => f.id === selectedDocumentId);
                if (selectedFile) {
                    // In a real implementation, you would use the actual document ID from your backend
                    // Use the ID (which is the full filename with timestamp) as the document identifier
                    documentId = selectedFile.id;
                }
            }

            const data = await documentsQuery(textToSend, documentId);

            // ------------------------------------------------------
            // STRICT DATA NORMALIZATION
            // ------------------------------------------------------
            // Ensure we always have an object with 'answer_markdown'
            // regardless of backend structure (answer vs answer_markdown vs JSON string)

            let normalizedContent = {
                answer_markdown: "",
                sources: [],
                follow_up_questions: [],
                user_notices: []
            };

            // Handle potential response structure variations
            // The API may return: { answer: "..." }, { response: { answer_markdown: "..." } }, etc.
            let rawData = data;

            // If the response has a nested response field (like from agent endpoint)
            if (data.response) {
                rawData = data.response;
            }

            // Step A: Determine the raw text content
            let rawText = rawData.answer_markdown || rawData.answer || rawData.text || "";

            // Step B: Check for double-serialization (JSON inside string)
            // This happens if LLM returns a JSON string but backend wraps it in { answer: "..." }
            // Step B: Check for double-serialization (JSON inside string)
            // This happens if LLM returns a JSON string but backend wraps it in { answer: "..." }
            if (typeof rawText === 'string') {
                // Strip markdown code blocks if present
                const cleanText = rawText.replace(/```json\n?|```/g, '').trim();

                if (cleanText.startsWith('{') || cleanText.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(cleanText);
                        const target = Array.isArray(parsed) ? parsed[0] : parsed;

                        // Extract fields from the parsed inner JSON
                        rawText = target.answer_markdown || target.answer || target.text || rawText; // Fallback to raw if extraction fails

                        // Handle sources: Prefer structured sources from LLM, fallback to backend source_documents
                        let extractedSources = target.sources || target.source_documents || [];
                        if (extractedSources.length === 0) {
                            // If LLM didn't return sources, check the outer backend response
                            const backendSources = rawData.sources || rawData.source_documents || [];
                            if (backendSources.length > 0) {
                                // Backend sources might be just strings (filenames), map them to objects
                                extractedSources = backendSources.map(s =>
                                    typeof s === 'string' ? { title: s, document_name: s, url: '#' } : s
                                );
                            }
                        }
                        normalizedContent.sources = extractedSources;

                        normalizedContent.follow_up_questions = target.follow_up_questions || rawData.follow_up_questions || [];
                    } catch (e) {
                        console.warn("Attempted to parse answer as JSON but failed, using raw text", e);

                        // Fallback: Try to extract fields using Regex if JSON parsing fails
                        // This handles cases where LLM returns slightly malformed JSON
                        try {
                            // Extract answer_markdown
                            const answerMatch = cleanText.match(/"answer_markdown"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                            if (answerMatch && answerMatch[1]) {
                                rawText = answerMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                            }

                            // Extract sources (basic attempt)
                            // This is hard to do reliably with regex for nested objects, so we might skip or rely on backend sources

                            // Extract follow_up_questions
                            const followUpMatch = cleanText.match(/"follow_up_questions"\s*:\s*\[(.*?)\]/s);
                            if (followUpMatch && followUpMatch[1]) {
                                const questions = followUpMatch[1].match(/"((?:[^"\\]|\\.)*)"/g);
                                if (questions) {
                                    normalizedContent.follow_up_questions = questions.map(q => q.slice(1, -1)); // Remove quotes
                                }
                            }
                        } catch (regexError) {
                            console.error("Regex extraction failed:", regexError);
                        }
                    }
                }
            }

            // Step C: Final Assignment
            normalizedContent.answer_markdown = rawText;

            // Step D: If sources are still empty, try one last time from rawData
            if (normalizedContent.sources.length === 0) {
                const backendSources = rawData.sources || rawData.source_documents || data.sources || data.source_documents || [];
                if (backendSources.length > 0) {
                    normalizedContent.sources = backendSources.map(s =>
                        typeof s === 'string' ? { title: s, document_name: s, url: '#' } : s
                    );
                }
            }

            normalizedContent.follow_up_questions = normalizedContent.follow_up_questions.length > 0 ? normalizedContent.follow_up_questions : (rawData.follow_up_questions || data.follow_up_questions || []);
            normalizedContent.user_notices = rawData.user_notices || data.user_notices || [];

            setMessages(prev => [...prev, { type: 'bot', content: normalizedContent }]);

        } catch (err) {
            console.error('Query failed:', err);
            setMessages(prev => [...prev, {
                type: 'bot',
                content: {
                    answer_markdown: `**Error:** ${err.message || err}. Please try again.`,
                    sources: [],
                    follow_up_questions: []
                }
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex h-full bg-slate-50 font-sans text-slate-900 overflow-hidden">

            {/* New Sidebar Component */}
            <LibrarySidebar
                onDocumentSelect={setSelectedDocumentId}
                selectedDocumentId={selectedDocumentId}
                files={files}
                setFiles={setFiles}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 py-3 px-6 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Internal Assistant</h1>
                        <p className="text-xs text-slate-500">Upload documents to document intellegence</p>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                        <HelpCircle className="w-5 h-5" />
                    </button>
                </header>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
                    {messages.map((msg, index) => (
                        <MessageBubble
                            key={index}
                            message={msg}
                            isLatest={index === messages.length - 1}
                            onFollowUpClick={(text) => handleSend(text)}
                        />
                    ))}

                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="max-w-4xl mx-auto relative">
                        {selectedDocumentId ? (
                            <>
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask a question about this document..."
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-4 pr-14 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none min-h-[56px] max-h-32"
                                    rows={1}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || isLoading}
                                    className={`absolute right-2 top-2 p-2 rounded-lg transition-colors ${input.trim()
                                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </>
                        ) : (
                            <div className="w-full bg-slate-50 border border-slate-200 text-slate-400 text-sm rounded-xl px-4 py-3 flex items-center justify-center gap-2 cursor-not-allowed select-none">
                                <AlertCircle className="w-4 h-4" />
                                <span>Please select a document from the library to start chatting</span>
                            </div>
                        )}
                    </div>
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-slate-400">
                            AI responses can be inaccurate. Please verify important information in original documents.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentQuery;