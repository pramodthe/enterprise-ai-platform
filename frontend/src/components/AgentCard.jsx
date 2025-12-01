import React from 'react';
import { IChevronRight } from './icons';

function cx(...cls) { return cls.filter(Boolean).join(' '); }

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

export default AgentCard;