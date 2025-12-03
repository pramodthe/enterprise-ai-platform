import React, { useEffect, useRef, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { ISparkles, IMessage, IChevronDown, ISend } from './icons';
import RagResponseCard from './RagResponseCard';
import { hrQuery, analyticsQuery, documentsQuery, agentsQuery } from '../services/api';

const AgentType = {
  HR: 'HR Specialist',
  ANALYST: 'Data Analyst',
  DOCS: 'Document Expert',
  GENERAL: 'Assistant',
};

const AgentColors = {
  [AgentType.HR]: 'indigo',
  [AgentType.ANALYST]: 'emerald',
  [AgentType.DOCS]: 'purple',
  [AgentType.GENERAL]: 'blue',
};

async function generate(agentType, text) {
  if (agentType === AgentType.HR) {
    const res = await hrQuery(text);
    return res.answer || 'No response';
  }
  if (agentType === AgentType.ANALYST) {
    const res = await analyticsQuery(text);
    return res.result || 'No response';
  }
  if (agentType === AgentType.DOCS) {
    const res = await documentsQuery(text);
    return res.answer || 'No response';
  }
  const res = await agentsQuery(text);
  // Return the response as-is (could be string or object)
  return res.response || 'No response';
}

// Helper to sanitize JSON string with unescaped newlines
function sanitizeJsonString(text) {
  let result = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (char === '"' && !escape) {
        inString = false;
        result += char;
      } else if (char === '\\' && !escape) {
        escape = true;
        result += char;
      } else if (char === '\n') {
        result += '\\n';
        escape = false;
      } else if (char === '\r') {
        // Skip CR
      } else if (char === '\t') {
        result += '\\t';
        escape = false;
      } else {
        result += char;
        if (escape) escape = false;
      }
    } else {
      if (char === '"') {
        inString = true;
        result += char;
      } else {
        result += char;
      }
    }
  }
  return result;
}

const UnifiedChat = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(AgentType.GENERAL);
  const [isTyping, setIsTyping] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);
    const responseText = await generate(selectedAgent, userMsg.text);
    const botMsg = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
    setMessages((prev) => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white text-gray-900 font-sans">
      <div className="flex-none flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 z-20">
        <div className="relative">
          <button onClick={() => setShowAgentMenu(!showAgentMenu)} className="flex items-center gap-2 text-base font-bold text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-xl transition-colors">
            <span>{selectedAgent}</span>
            <IChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {showAgentMenu && (
            <div className="absolute top-full left-0 mt-1 w-60 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 z-40 overflow-hidden animate-fade-in origin-top-left">
              {Object.values(AgentType).map((agent) => (
                <button key={agent} onClick={() => { setSelectedAgent(agent); setShowAgentMenu(false); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedAgent === agent ? 'text-emerald-600 bg-gray-50' : 'text-gray-700'}`}>
                  <div className="flex-1">
                    <div className="font-bold">{agent}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Specialized Agent</div>
                  </div>
                  {selectedAgent === agent && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <ISparkles className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto w-full custom-scrollbar">
        <div className="flex flex-col gap-6 px-4 py-6 w-full max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center my-auto py-12 space-y-6 opacity-80">
              <div className="bg-gray-50 p-4 rounded-full shadow-sm mb-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ISparkles className="w-6 h-6" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">How can I help you today?</h2>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {msg.role === 'user' && (
                <div className="max-w-[85%] bg-gray-100 px-5 py-3 rounded-[26px] text-gray-900">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
                </div>
              )}
              {msg.role === 'model' && (
                <div className="flex gap-4 max-w-full w-full px-1">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white mt-1">
                    <ISparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="font-bold text-sm mb-1 text-gray-900">{selectedAgent}</div>
                    <div className="prose prose-sm max-w-none prose-p:leading-7 text-gray-800">
                      {/* Check if response is structured JSON format */}
                      {(() => {
                        // Check if msg.text is already a parsed object (structured response)
                        // or a string (regular response)
                        let structuredData = null;

                        if (typeof msg.text === 'object' && msg.text !== null) {
                          // It's already a parsed object (structured response)
                          structuredData = msg.text;
                        } else {
                          // It's a string, try to parse it in case it's a JSON string
                          try {
                            let textToParse = msg.text;
                            // Try to extract JSON from code blocks if present
                            const codeBlockMatch = textToParse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                            if (codeBlockMatch) {
                              textToParse = codeBlockMatch[1];
                            } else {
                              // If no code block, try to find the first [ or {
                              const firstBracket = textToParse.indexOf('[');
                              const firstBrace = textToParse.indexOf('{');
                              const startIdx = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace))
                                ? firstBracket
                                : firstBrace;

                              if (startIdx !== -1) {
                                textToParse = textToParse.substring(startIdx);
                                // Determine if we are looking for an array or object based on the start char
                                const isArray = textToParse.trim().startsWith('[');
                                const lastIdx = isArray
                                  ? textToParse.lastIndexOf(']')
                                  : textToParse.lastIndexOf('}');

                                if (lastIdx !== -1) {
                                  textToParse = textToParse.substring(0, lastIdx + 1);
                                }
                              }
                            }

                            // Sanitize text before parsing to handle unescaped newlines
                            const sanitizedText = sanitizeJsonString(textToParse);
                            let parsed = JSON.parse(sanitizedText);

                            // Handle array wrapper if present (some models return [{...}])
                            if (Array.isArray(parsed) && parsed.length > 0) {
                              parsed = parsed[0];
                            }

                            if (parsed.answer_markdown || parsed.short_answer || parsed.sources) {
                              // This is the structured format from document agent
                              structuredData = parsed;
                            }
                          } catch (e) {
                            // Not JSON, render as regular markdown
                            // Use MarkdownRenderer for consistency
                            return <MarkdownRenderer content={msg.text} themeColor={AgentColors[selectedAgent]} />;
                          }
                        }

                        // If we have structured data, use RagResponseCard
                        if (structuredData) {
                          return <RagResponseCard
                            data={structuredData}
                            onFollowUpClick={(question) => {
                              setInput(question);
                            }}
                            isLatest={index === messages.length - 1}
                          />;
                        } else {
                          // For regular responses, render as markdown
                          return <MarkdownRenderer content={msg.text} themeColor={AgentColors[selectedAgent]} />;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4 w-full px-1">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-white mt-1">
                <ISparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center mt-2.5">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-1 animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-1 animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-none w-full bg-white p-4 z-20 border-t border-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex flex-col bg-gray-100 rounded-[26px] px-4 py-3 shadow-sm border border-transparent focus-within:border-gray-300 transition-colors">
            <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Message ${selectedAgent}...`} className="w-full max-h-[120px] bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-500 resize-none text-sm custom-scrollbar leading-relaxed" rows={1} style={{ minHeight: '24px' }} />
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-2"></div>
              <button onClick={handleSend} disabled={!input.trim() || isTyping} className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 ${input.trim() ? 'bg-black text-white hover:opacity-90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                <ISend className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-center mt-2 text-xs text-gray-400 font-medium">AI can make mistakes. Check important info.</div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedChat;