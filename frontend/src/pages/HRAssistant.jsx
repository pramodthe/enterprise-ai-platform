import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { IUsers, ISparkles, ISearch, IArrowRight } from '../components/icons';
import { hrQuery } from '../services/api';

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
    const response = await hrQuery(q);
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
    setAgentResponse({ text: response.answer || 'No response', data: matchedData && matchedData.length ? matchedData : undefined });
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
                  {["Find employees with Python skills","Show organizational chart for Engineering","List employees with AWS certification","Who are the team leads in Marketing?","Draft a job description for a Senior React Dev","What is the remote work policy?"].map((q, idx) => (
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

export default HRAssistant;