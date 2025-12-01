import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { IChart, IArrowRight } from '../components/icons';
import { analyticsQuery } from '../services/api';

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
    if (payMode === 'salary') annualGross = parseFloat(salaryInput) || 0;
    else annualGross = (parseFloat(hourlyRate) || 0) * (parseFloat(hoursPerWeek) || 0) * 52;
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
    const response = await analyticsQuery(q);
    setAiResponse(response.result || 'No response');
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

export default AnalyticsHub;