import React, { useMemo, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AgentCard from '../components/AgentCard';
import { ISearch, IUsers, IChart, IFileSearch } from '../components/icons';
import { agentsStatus } from '../services/api';

function cx(...cls) { return cls.filter(Boolean).join(' '); }

const ViewState = {
  HR_ASSISTANT: 'HR_ASSISTANT',
  ANALYTICS_HUB: 'ANALYTICS_HUB',
  DOCUMENT_INTELLIGENCE: 'DOCUMENT_INTELLIGENCE',
};

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
        const res = await agentsStatus();
        if (res?.agents) dispatch({ type: 'agents/setAgents', payload: res.agents });
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

export { ViewState };
export default Dashboard;