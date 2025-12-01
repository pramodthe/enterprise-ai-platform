import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAgents } from './store/agentsSlice';
import { Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import DashboardPage, { ViewState as ViewStatePage } from './pages/Dashboard';
import HRAssistantPage from './pages/HRAssistant';
import AnalyticsHubPage from './pages/AnalyticsHub';
import DocumentIntelligencePage from './pages/DocumentIntelligence';
import UnifiedChatWidget from './components/UnifiedChat';
import { IMessage } from './components/icons';
import { listDocuments } from './lib/documentService';

const ViewState = {
  DASHBOARD: 'DASHBOARD',
  HR_ASSISTANT: 'HR_ASSISTANT',
  ANALYTICS_HUB: 'ANALYTICS_HUB',
  DOCUMENT_INTELLIGENCE: 'DOCUMENT_INTELLIGENCE',
  UNIFIED_CHAT: 'UNIFIED_CHAT',
};

const AgentType = {
  HR: 'HR Specialist',
  ANALYST: 'Data Analyst',
  DOCS: 'Document Expert',
  GENERAL: 'Assistant',
};

const Icon = ({ strokeWidth = 2, className = 'h-5 w-5', path }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {path}
  </svg>
);

const IUsers = (p) => (
  <Icon {...p} path={<>
    <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>} />
);
const IChart = (p) => (
  <Icon {...p} path={<>
    <path d="M3 3v18h18" />
    <rect x="7" y="8" width="3" height="8" />
    <rect x="12" y="5" width="3" height="11" />
    <rect x="17" y="11" width="3" height="5" />
  </>} />
);
const IFileSearch = (p) => (
  <Icon {...p} path={<>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <circle cx="11" cy="14" r="2" />
    <path d="m13 16 2 2" />
  </>} />
);
const ISearch = (p) => (
  <Icon {...p} path={<>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>} />
);
const ISparkles = (p) => (
  <Icon {...p} path={<>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </>} />
);
const IChevronDown = (p) => (<Icon {...p} path={<path d="m6 9 6 6 6-6" />} />);
const IX = (p) => (
  <Icon {...p} path={<>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>} />
);
const IArrowRight = (p) => (<Icon {...p} path={<path d="M5 12h14M12 5l7 7-7 7" />} />);
const IChevronLeft = (p) => (<Icon {...p} path={<path d="m15 18-6-6 6-6" />} />);
const IChevronRight = (p) => (<Icon {...p} path={<path d="m9 6 6 6-6 6" />} />);
const ISliders = (p) => (
  <Icon {...p} path={<>
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 10V3" />
    <circle cx="4" cy="14" r="2" />
    <circle cx="12" cy="11" r="2" />
    <circle cx="20" cy="16" r="2" />
  </>} />
);
const ISend = (p) => (
  <Icon {...p} path={<>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </>} />
);

const SYSTEM_INSTRUCTIONS = {
  [AgentType.HR]: 'HR Assistant',
  [AgentType.ANALYST]: 'Senior Data Analyst',
  [AgentType.DOCS]: 'Document Intelligence Agent',
  [AgentType.GENERAL]: 'Unified Enterprise Assistant',
};

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function generateResponse(agentType, history, userMessage, contextData) {
  try {
    if (agentType === AgentType.HR) {
      const res = await axios.post(`${API_BASE}/v1/hr/query`, { question: userMessage });
      return res.data.answer || 'No response';
    }
    if (agentType === AgentType.ANALYST) {
      const res = await axios.post(`${API_BASE}/v1/analytics/query`, { query: userMessage });
      return res.data.result || 'No response';
    }
    if (agentType === AgentType.DOCS) {
      const res = await axios.post(`${API_BASE}/v1/documents/query`, { query: userMessage });
      return res.data.answer || 'No response';
    }
    const res = await axios.post(`${API_BASE}/v1/agents/query`, { query: userMessage, agent: 'auto' });
    return res.data.response || 'No response';
  } catch (e) {
    return 'I encountered an error processing your request. Please try again.';
  }
}

const UnifiedChat = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(AgentType.GENERAL);
  const [isTyping, setIsTyping] = useState(false);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    const responseText = await generateResponse(selectedAgent, messages, userMsg.text);
    const botMsg = { id: (Date.now() + 1).toString(), role: 'model', text: responseText, timestamp: Date.now() };
    setMessages((prev) => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
                <button
                  key={agent}
                  onClick={() => { setSelectedAgent(agent); setShowAgentMenu(false); }}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${selectedAgent === agent ? 'text-emerald-600 bg-gray-50' : 'text-gray-700'}`}
                >
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
            <IX className="w-5 h-5" />
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
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {msg.role === 'user' && (
                <div className="max-w-[85%] bg-gray-100 px-5 py-3 rounded-[26px] text-gray-900">
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{msg.text}</p>
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
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
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
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${selectedAgent}...`}
              className="w-full max-h-[120px] bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-500 resize-none text-[15px] custom-scrollbar leading-relaxed"
              rows={1}
              style={{ minHeight: '24px' }}
            />
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

const MOCK_EMPLOYEES = [
  { id: '1', name: 'Sarah Chen', role: 'Senior Frontend Engineer', department: 'Engineering', skills: ['React', 'TypeScript', 'Node.js', 'Python'], avatar: 'https://picsum.photos/200/200?random=1' },
  { id: '2', name: 'Michael Ross', role: 'Product Manager', department: 'Product', skills: ['Strategy', 'Agile', 'User Research', 'SQL'], avatar: 'https://picsum.photos/200/200?random=2' },
  { id: '3', name: 'Jessica Wu', role: 'UX Designer', department: 'Design', skills: ['Figma', 'Prototyping', 'Accessibility', 'CSS'], avatar: 'https://picsum.photos/200/200?random=3' },
  { id: '4', name: 'David Miller', role: 'DevOps Engineer', department: 'Engineering', skills: ['AWS', 'Kubernetes', 'Terraform', 'Go'], avatar: 'https://picsum.photos/200/200?random=4' },
  { id: '5', name: 'James Wilson', role: 'Marketing Lead', department: 'Marketing', skills: ['SEO', 'Content Strategy', 'Analytics'], avatar: 'https://picsum.photos/200/200?random=5' },
  { id: '6', name: 'Emily Zhang', role: 'Data Scientist', department: 'Analytics', skills: ['Python', 'Machine Learning', 'TensorFlow', 'AWS'], avatar: 'https://picsum.photos/200/200?random=6' },
];

const HRAssistant = () => {
  const [activeTab, setActiveTab] = useState('agent');
  const [searchTerm, setSearchTerm] = useState('');
  const [agentQuery, setAgentQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [agentResponse, setAgentResponse] = useState(null);

  const filteredEmployees = MOCK_EMPLOYEES.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.skills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAskAgent = async (queryOverride) => {
    const q = queryOverride || agentQuery;
    if (!q.trim()) return;
    setAgentQuery(q);
    setIsThinking(true);
    setAgentResponse(null);
    const context = `Employee Database: ${JSON.stringify(MOCK_EMPLOYEES.map(e => ({ name: e.name, role: e.role, skills: e.skills, department: e.department })))}`;
    const prompt = `You are an HR Assistant. Based on the employee database, answer this: "${q}".`;
    const textResponse = await generateResponse(AgentType.HR, [], prompt, context);
    let matchedData;
    const lowerQ = q.toLowerCase();
    if (lowerQ.includes('find') || lowerQ.includes('list') || lowerQ.includes('who') || lowerQ.includes('show')) {
      matchedData = MOCK_EMPLOYEES.filter(e => {
        if (lowerQ.includes(e.department.toLowerCase())) return true;
        if (e.skills.some(s => lowerQ.includes(s.toLowerCase()))) return true;
        if (lowerQ.includes('employees') && !lowerQ.includes('policy')) return true;
        return false;
      });
      if (!matchedData.length && lowerQ.includes('engineering')) {
        matchedData = MOCK_EMPLOYEES.filter(e => e.department === 'Engineering');
      }
    }
    setIsThinking(false);
    setAgentResponse({ text: textResponse, data: matchedData && matchedData.length ? matchedData : undefined });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 pt-6 pb-0 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><IUsers className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">HR Assistant</h2>
            <p className="text-gray-500 text-sm">Employee directory, skill matching, and organizational insights</p>
          </div>
        </div>
        <div className="flex gap-6">
          <button onClick={() => setActiveTab('agent')} className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'agent' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>AI Agent & Queries{activeTab === 'agent' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}</button>
          <button onClick={() => setActiveTab('directory')} className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'directory' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Full Directory{activeTab === 'directory' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}</button>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        {activeTab === 'agent' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1">
                <textarea value={agentQuery} onChange={(e) => setAgentQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskAgent(); } }} placeholder="Ask about employees, skills, policies, or org charts..." className="w-full p-4 min-h-[120px] bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none resize-none text-base" />
                <div className="flex justify-between items-center px-4 pb-3 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-400 flex items-center gap-1"><ISparkles className="w-3 h-3" /><span>AI-powered search</span></div>
                  <button onClick={() => handleAskAgent()} disabled={isThinking || !agentQuery.trim()} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm">{isThinking ? 'Processing...' : 'Ask HR Agent'}</button>
                </div>
              </div>
              {agentResponse && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><h3 className="font-semibold text-indigo-900 text-sm">HR Agent Response</h3></div>
                  <div className="p-6 space-y-6">
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed"><ReactMarkdown>{agentResponse.text}</ReactMarkdown></div>
                    {agentResponse.data && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Relevant Records</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {agentResponse.data.map(emp => (
                            <div key={emp.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-indigo-50 transition-colors cursor-pointer">
                              <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                              <div>
                                <h4 className="font-semibold text-gray-900 text-sm">{emp.name}</h4>
                                <p className="text-xs text-indigo-600 font-medium">{emp.role}</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">{emp.department}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!agentResponse && !isThinking && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-gray-300 border border-gray-100 shadow-sm"><ISparkles className="w-8 h-8" /></div>
                  <h3 className="text-gray-900 font-medium">Ready to help</h3>
                  <p className="text-gray-500 text-sm max-w-xs mt-1">Ask me to find talent, explain policies, or visualize team structures.</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-4">Example Queries</h3>
                <div className="space-y-2">
                  {["Find employees with Python skills", "Show organizational chart for Engineering", "List employees with AWS certification", "Who are the team leads in Marketing?", "Draft a job description for a Senior React Dev", "What is the remote work policy?"].map((q, idx) => (
                    <button key={idx} onClick={() => handleAskAgent(q)} className="w-full text-left p-3 rounded-xl border border-gray-100 bg-gray-50 text-xs sm:text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all group flex items-center justify-between">
                      <span>{q}</span>
                      <IArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-lg p-5 text-white">
                <h3 className="font-bold text-lg mb-2">Did you know?</h3>
                <p className="text-indigo-100 text-sm mb-4 leading-relaxed">You can ask complex questions like "Who in Engineering knows Python and has leadership experience?" to get multi-criteria matches.</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'directory' && (
          <div className="max-w-6xl mx-auto">
            <div className="relative mb-6">
              <ISearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Search by name, role, or department..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-full mr-4 object-cover bg-gray-200" />
                    <div>
                      <h3 className="font-bold text-gray-900">{emp.name}</h3>
                      <p className="text-sm text-indigo-600 font-medium">{emp.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 border-b border-gray-100 pb-2"><span>Department</span><span className="text-gray-900 font-medium">{emp.department}</span></div>
                    <div className="pt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {emp.skills.slice(0, 4).map(skill => (<span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px]">{skill}</span>))}
                        {emp.skills.length > 4 && (<span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[11px]">+ {emp.skills.length - 4}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ANALYTICS_EXAMPLE_QUERIES = [
  'Calculate 25% of 15,000',
  'What is 1,200 divided by 24?',
  'Calculate percentage change from 100 to 150',
  'Find average of 10, 20, 30, and 40',
  'Explain the difference between Gross and Net pay',
];

const AnalyticsHub = () => {
  const [payMode, setPayMode] = useState('salary');
  const [salaryInput, setSalaryInput] = useState('78000');
  const [hourlyRate, setHourlyRate] = useState('40');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [fedRate, setFedRate] = useState('12');
  const [stateRate, setStateRate] = useState('5');
  const [preTaxDed, setPreTaxDed] = useState('0');
  const [postTaxDed, setPostTaxDed] = useState('0');
  const [calculationResult, setCalculationResult] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleCalculatePayroll = () => {
    const periodsPerYear = 26;
    let annualGross = 0;
    if (payMode === 'salary') {
      annualGross = parseFloat(salaryInput) || 0;
    } else {
      annualGross = (parseFloat(hourlyRate) || 0) * (parseFloat(hoursPerWeek) || 0) * 52;
    }
    const grossPerPeriod = annualGross / periodsPerYear;
    const preTax = parseFloat(preTaxDed) || 0;
    const taxableIncome = Math.max(0, grossPerPeriod - preTax);
    const fRate = (parseFloat(fedRate) || 0) / 100;
    const sRate = (parseFloat(stateRate) || 0) / 100;
    const fedTaxAmt = taxableIncome * fRate;
    const stateTaxAmt = taxableIncome * sRate;
    const postTax = parseFloat(postTaxDed) || 0;
    const net = taxableIncome - fedTaxAmt - stateTaxAmt - postTax;
    setCalculationResult({ gross: grossPerPeriod, fedTax: fedTaxAmt, stateTax: stateTaxAmt, net, period: 'Bi-Weekly' });
  };

  const handleAskAi = async (queryOverride) => {
    const q = queryOverride || aiQuery;
    if (!q.trim()) return;
    setAiQuery(q);
    setIsThinking(true);
    setAiResponse('');
    const context = 'You are a helpful Accounting Assistant.';
    const response = await generateResponse(AgentType.ANALYST, [], q, context);
    setAiResponse(response);
    setIsThinking(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-6 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><IChart className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics & Accounting Hub</h2>
            <p className="text-gray-500 text-sm">Business calculations, payroll estimation, and data analysis tools.</p>
          </div>
        </div>
      </div>
      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">Payroll Calculator</h3>
                  <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                    <button onClick={() => setPayMode('salary')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${payMode === 'salary' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>Salary</button>
                    <button onClick={() => setPayMode('hourly')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${payMode === 'hourly' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>Hourly</button>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{payMode === 'salary' ? 'Annual Salary ($)' : 'Hourly Rate ($)'}</label>
                      <input type="number" value={payMode === 'salary' ? salaryInput : hourlyRate} onChange={(e) => (payMode === 'salary' ? setSalaryInput(e.target.value) : setHourlyRate(e.target.value))} className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-900" />
                    </div>
                    {payMode === 'hourly' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Hours Per Week</label>
                        <input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-900" />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Fed Tax (%)</label>
                        <input type="number" value={fedRate} onChange={(e) => setFedRate(e.target.value)} className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">State Tax (%)</label>
                        <input type="number" value={stateRate} onChange={(e) => setStateRate(e.target.value)} className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-900" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Pre-Tax Ded ($)</label>
                        <input type="number" value={preTaxDed} onChange={(e) => setPreTaxDed(e.target.value)} placeholder="e.g. 401k" className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">Post-Tax Ded ($)</label>
                        <input type="number" value={postTaxDed} onChange={(e) => setPostTaxDed(e.target.value)} placeholder="e.g. Insurance" className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-900" />
                      </div>
                    </div>
                    <button onClick={handleCalculatePayroll} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]">Calculate Payroll</button>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col justify-center space-y-6">
                    {!calculationResult ? (
                      <div className="text-center text-emerald-800/50">
                        <p className="text-sm">Enter details and calculate to see estimated breakdown.</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center pb-4 border-b border-emerald-200">
                          <p className="text-sm text-emerald-700 font-medium uppercase tracking-wide">Estimated Net Pay</p>
                          <p className="text-4xl font-bold text-emerald-900 mt-2">${calculationResult.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <span className="inline-block mt-2 px-2 py-1 bg-emerald-200/50 text-emerald-800 text-xs rounded-md">Per {calculationResult.period} Paycheck</span>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between text-gray-600"><span>Gross Pay</span><span className="font-medium text-gray-900">${calculationResult.gross.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between text-red-500/80"><span>Federal Tax ({fedRate}%)</span><span>-${calculationResult.fedTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between text-red-500/80"><span>State Tax ({stateRate}%)</span><span>-${calculationResult.stateTax.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Query</h3>
                <div className="relative">
                  <textarea value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAskAi())} placeholder="Ask for any calculation or data analysis..." className="w-full p-4 min-h-[100px] bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-900 resize-none" />
                  <button onClick={() => handleAskAi()} disabled={isThinking || !aiQuery.trim()} className="absolute bottom-3 right-3 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm">{isThinking ? 'Analyzing...' : 'Analyze Data'}</button>
                </div>
                {aiResponse && (
                  <div className="mt-6 bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-emerald-700">Agent Response:</div>
                    <div className="prose prose-sm max-w-none text-gray-700"><ReactMarkdown>{aiResponse}</ReactMarkdown></div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Example Queries</h3>
                <div className="space-y-3">
                  {ANALYTICS_EXAMPLE_QUERIES.map((q, i) => (
                    <button key={i} onClick={() => handleAskAi(q)} className="w-full text-left p-3 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-all group flex items-center justify-between shadow-sm">
                      <span>{q}</span>
                      <IArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Available Tools</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Payroll Calculator (Wages vs Taxes)</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Addition & Subtraction</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Multiplication & Division</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Percentage Change Analysis</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MOCK_DOCUMENTS = [];

const DocumentIntelligence = () => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');
  const [documents, setDocuments] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleSearch = async (qOverride) => {
    const q = qOverride || query;
    if (!q.trim()) return;
    setQuery(q);
    setSearchedQuery(q);
    setIsSearching(true);
    setAnswer('');
    const response = await generateResponse(AgentType.DOCS, [], q);
    setAnswer(response);
    setIsSearching(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage('');
    try {
      // Upload & Index in Backend
      setUploadMessage('Uploading and indexing document...');
      const form = new FormData();
      form.append('file', file);

      const res = await axios.post(`${API_BASE}/v1/documents/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (pe) => {
          if (pe.total) {
            const percent = Math.round((pe.loaded / pe.total) * 100);
            setUploadProgress(percent);
          }
        },
      });
      setUploadMessage(res.data?.message || 'Uploaded & Indexed successfully');

      // Refresh list
      await loadDocuments();

    } catch (err) {
      console.error(err);
      setUploadMessage('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1500);
      e.target.value = '';
    }
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      <div className="w-72 sm:w-80 flex-shrink-0 flex flex-col border-r border-gray-200 bg-gray-50">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-gray-800 text-sm tracking-wide uppercase">Library</h2><span className="px-2 py-0.5 rounded-full bg-gray-200 text-xs font-medium text-gray-600">{documents.length}</span></div>
          <button onClick={handleUploadClick} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium shadow-sm">Upload Document</button>
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md" className="hidden" onChange={handleFileChange} />
          {isUploading && (
            <div className="mt-3">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-purple-600" style={{ width: `${uploadProgress}%` }} /></div>
              <div className="text-xs text-gray-500 mt-1">Uploading… {uploadProgress}%</div>
            </div>
          )}
          {uploadMessage && (
            <div className="mt-3 text-xs text-gray-600">{uploadMessage}</div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {documents.map((doc) => (
            <div key={doc.id || doc.name} className="group relative p-3 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0 p-2 rounded-lg bg-gray-100 text-gray-500">
                  <IFileSearch className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-700 truncate leading-tight mb-1">{doc.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="font-medium">{doc.metadata?.mimetype || 'DOC'}</span>
                    <span>•</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{(doc.metadata?.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              </div>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-green-100 rounded-full p-0.5">
                  <IFileCheck className="w-3 h-3 text-green-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-100/50">
          <div className="flex justify-between text-xs font-medium text-gray-500 mb-2"><span>Storage</span><span>27.5 MB / 1 GB</span></div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-[3%]" /></div>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        <div className="h-20 border-b border-gray-100 flex items-center px-6 sm:px-8 bg-white/90 backdrop-blur-md z-10 sticky top-0">
          <div className="flex-1 max-w-3xl relative">
            <ISearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Ask a question about your documents..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all" />
          </div>
          <button onClick={() => handleSearch()} disabled={isSearching || !query.trim()} className="ml-4 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">{isSearching ? 'Analyzing...' : 'Analyze'}</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
          {!searchedQuery && !isSearching ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center pb-20">
              <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mb-8"><IFileSearch className="w-10 h-10 text-purple-600" /></div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Document Intelligence</h1>
              <p className="text-gray-500 text-lg leading-relaxed mb-12">I can scan your uploaded reports, policies, and agreements to find answers, summarize content, and extract key data points instantly.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {['Summarize the remote work policy', 'What are the key risks in the Q3 report?', 'List all IT security requirements for passwords', 'Compare 2024 and 2025 marketing strategies'].map((q, i) => (
                  <button key={i} onClick={() => handleSearch(q)} className="p-4 rounded-xl border border-gray-200 bg-white hover:border-purple-300 hover:shadow-md transition-all text-left group">
                    <div className="flex justify-between items-start"><span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors">{q}</span><IArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors" /></div>
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-12 w-full text-left">
                <div className="bg-purple-50 border-b border-purple-100 px-6 py-4 flex items-center gap-2.5"><ISparkles className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-purple-900">Intelligence Report</h3></div>
                <div className="p-6 sm:p-8">
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-5/6" />
                    <div className="h-32 bg-gray-100 rounded w-full mt-8" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="flex items-center gap-3 text-sm text-gray-500"><div className="p-1.5 bg-gray-100 rounded-lg"><ISearch className="w-4 h-4" /></div><span>Analysis for: <span className="font-medium text-gray-900">"{searchedQuery}"</span></span></div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-purple-50 border-b border-purple-100 px-6 py-4 flex items-center gap-2.5"><ISparkles className="w-5 h-5 text-purple-600" /><h3 className="font-semibold text-purple-900">Intelligence Report</h3></div>
                <div className="p-6 sm:p-8">
                  {isSearching ? (
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-full" />
                      <div className="h-4 bg-gray-100 rounded w-5/6" />
                      <div className="h-32 bg-gray-100 rounded w-full mt-8" />
                    </div>
                  ) : (
                    <div className="prose prose-slate max-w-none">
                      <ReactMarkdown>{answer}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function cx(...cls) { return cls.filter(Boolean).join(' '); }
function filterAgents(query, activeFilterIds) {
  const q = (query || '').toLowerCase();
  let res = [
    { id: ViewState.HR_ASSISTANT, name: 'HR Assistant', tagline: 'Employee lookup, skill matching, org charts', color: 'indigo', icon: IUsers, actions: ['Employee Lookup', 'Skill Match', 'Org Chart'] },
    { id: ViewState.ANALYTICS_HUB, name: 'Analytics Hub', tagline: 'Business calculations & data analysis tools', color: 'emerald', icon: IChart, actions: ['Create Model', 'What-if', 'Dashboards'] },
    { id: ViewState.DOCUMENT_INTELLIGENCE, name: 'Document Intelligence', tagline: 'Search & retrieve info from company documents', color: 'purple', icon: IFileSearch, actions: ['Semantic Search', 'Summarize', 'Extract'] },
  ].filter((a) => a.name.toLowerCase().includes(q) || a.tagline.toLowerCase().includes(q));
  if (activeFilterIds && activeFilterIds.length) {
    const allow = new Set(activeFilterIds.map((f) => ({ people: ViewState.HR_ASSISTANT, analysis: ViewState.ANALYTICS_HUB, knowledge: ViewState.DOCUMENT_INTELLIGENCE }[f])));
    res = res.filter((a) => allow.has(a.id));
  }
  return res;
}

const AgentCard = ({ agent, onClick, status }) => {
  const IconComp = agent.icon;
  const colorStyles = {
    indigo: 'from-indigo-50 to-white border-indigo-100 hover:border-indigo-300',
    emerald: 'from-emerald-50 to-white border-emerald-100 hover:border-emerald-300',
    purple: 'from-purple-50 to-white border-purple-100 hover:border-purple-300',
    rose: 'from-rose-50 to-white border-rose-100 hover:border-rose-300',
  }[agent.color];
  const iconBg = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    rose: 'bg-rose-100 text-rose-600',
  }[agent.color];
  return (
    <div onClick={onClick} className={cx('group relative flex flex-col rounded-3xl border bg-gradient-to-b p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white', colorStyles)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cx('p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110', iconBg)}>
          <IconComp className="w-6 h-6" />
        </div>
        {status && (
          <div className="flex items-center gap-2">
            <span className={cx('w-2 h-2 rounded-full', status === 'running' ? 'bg-emerald-500' : 'bg-gray-400')} />
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-xl text-gray-900 mb-2 tracking-tight">{agent.name}</h3>
        <p className="text-sm text-gray-600 leading-relaxed">{agent.tagline}</p>
      </div>
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex flex-wrap gap-2 mb-4">
          {agent.actions.slice(0, 2).map((a) => (<span key={a} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-gray-600 border border-gray-200 shadow-sm">{a}</span>))}
        </div>
        <button className="w-full inline-flex items-center justify-between text-sm font-bold text-gray-800 group-hover:translate-x-1 transition-transform"><span>Open Agent</span><IChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

const Dashboard = ({ onNavigate }) => {
  const dispatch = useDispatch();
  const agentsState = useSelector((s) => s.agents.agents);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const results = useMemo(() => filterAgents(query, activeFilters), [query, activeFilters]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.getElementById('global-search')?.focus(); }
      if (e.key === '/') { e.preventDefault(); const active = document.activeElement; if (active && active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA') { document.getElementById('global-search')?.focus(); } }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE}/v1/agents/status`);
        if (res.data?.agents) dispatch(setAgents(res.data.agents));
      } catch (e) { }
    })();
  }, [dispatch]);

  const getStatusFor = (name) => agentsState.find((a) => a.agent_name === name)?.status || null;
  return (
    <div className="animate-fade-in">
      <section className="mt-2"><p className="text-gray-600 max-w-3xl text-lg">Your intelligent enterprise assistant with multiple specialized agents.</p></section>
      <section className="mt-8 flex flex-col md:flex-row gap-4 md:items-center">
        <div className="relative w-full md:max-w-xl">
          <ISearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input id="global-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agents, skills, or actions…" className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm" type="button"><ISliders /> Filters</button>
          {['people', 'analysis', 'knowledge'].map((id) => {
            const active = activeFilters.includes(id);
            const label = { people: 'People Ops', analysis: 'Analytics', knowledge: 'Knowledge' }[id];
            return (
              <button key={id} type="button" onClick={() => setActiveFilters(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} className={cx('px-4 py-2.5 rounded-2xl text-sm font-medium border shadow-sm transition-all duration-200', active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}>{label}</button>
            );
          })}
        </div>
      </section>
      <section className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((agent) => (
          <AgentCard key={agent.id} agent={agent} status={getStatusFor(agent.name)} onClick={() => onNavigate(agent.id)} />
        ))}
        {results.length === 0 && (<div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-3xl border border-gray-200 border-dashed">No agents found matching your criteria.</div>)}
      </section>
    </div>
  );
};

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isDashboard = location.pathname === '/';
  return (
    <div>
      <div className="min-h-screen bg-gray-50 font-sans relative flex flex-col">
        <header className="bg-blue-600 text-white shadow-md flex-shrink-0 z-30 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!isDashboard && (
                <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors" aria-label="Back to Dashboard"><IChevronLeft className="w-6 h-6" /></button>
              )}
              <Link to="/" className="flex items-center gap-3 cursor-pointer">
                <div className="size-9 rounded-xl bg-white text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm">AI</div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Enterprise Platform</h1>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Routes>
            <Route path="/" element={<DashboardPage onNavigate={(view) => {
              if (view === ViewStatePage.HR_ASSISTANT) navigate('/hr');
              else if (view === ViewStatePage.ANALYTICS_HUB) navigate('/analytics');
              else if (view === ViewStatePage.DOCUMENT_INTELLIGENCE) navigate('/documents');
            }} />} />
            <Route path="/hr" element={<div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-9rem)] overflow-hidden relative"><div className="h-full w-full text-gray-900"><HRAssistantPage /></div></div>} />
            <Route path="/analytics" element={<div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-9rem)] overflow-hidden relative"><div className="h-full w-full text-gray-900"><AnalyticsHubPage /></div></div>} />
            <Route path="/documents" element={<div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[calc(100vh-9rem)] overflow-hidden relative"><div className="h-full w-full text-gray-900"><DocumentIntelligencePage /></div></div>} />
          </Routes>
        </main>
        <div className="fixed z-[100] bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-end gap-4 pointer-events-none">
          {isChatOpen && (
            <div className="pointer-events-auto w-[90vw] sm:w-[400px] h-[60vh] sm:h-[600px] max-h-[calc(100vh-8rem)] shadow-2xl rounded-2xl overflow-hidden animate-fade-in origin-bottom-right border border-gray-200 bg-white flex flex-col">
              <UnifiedChatWidget onClose={() => setIsChatOpen(false)} />
            </div>
          )}
          <button onClick={() => setIsChatOpen(!isChatOpen)} className={`pointer-events-auto flex items-center justify-center w-14 h-14 rounded-full shadow-xl shadow-blue-900/20 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-200 ${isChatOpen ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`} aria-label="Toggle Chat">
            {isChatOpen ? <IMessage className="w-6 h-6" /> : <IMessage className="w-7 h-7" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;