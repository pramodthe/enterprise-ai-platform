import React, { useState } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { IChart, IArrowRight } from '../components/icons';
import { analyticsQuery } from '../services/api';

const ANALYTICS_DASHBOARD_PROMPTS = [
  {
    name: 'Executive Summary Dashboard',
    prompt: 'Create a comprehensive business dashboard showing: 1. Monthly revenue trends with a line chart 2. Monthly expenses analysis with a bar chart 3. Customer growth visualization 4. Key metrics: total revenue, average monthly revenue, profit margins, and growth rates. Include insights on business performance and recommendations.'
  },
  {
    name: 'Revenue Deep Dive',
    prompt: 'Analyze our revenue performance: Show monthly revenue trends with a line chart, calculate average monthly revenue, identify highest and lowest revenue months, calculate total revenue and growth percentage, and provide insights on revenue trajectory and seasonality.'
  },
  {
    name: 'Product Performance Report',
    prompt: 'Generate a complete product analysis: Bar chart comparing units sold by product, product returns analysis with visualization, calculate best-selling products, analyze return rates by product, and recommend products to promote or discontinue.'
  },
  {
    name: 'Traffic & Engagement Analysis',
    prompt: 'Create a website analytics dashboard showing: Daily visitor traffic trends with line chart, peak traffic days analysis, weekly traffic patterns, calculate total visitors, average daily visitors, peak day traffic, and growth trends. Include insights on user engagement patterns.'
  },
  {
    name: 'Profitability Dashboard',
    prompt: 'Create a profitability analysis dashboard: Show revenue vs expenses comparison chart, calculate profit margins for each month, identify most profitable months, calculate average profit margin, and provide recommendations for improving profitability.'
  },
  {
    name: 'Customer Growth Analysis',
    prompt: 'Analyze customer acquisition and growth: Visualize monthly customer growth with chart, calculate total customers and growth rate, identify fastest growth periods, calculate average monthly customer acquisition, and provide insights on customer trends.'
  }
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
  const [aiResponse, setAiResponse] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  // ---------------------------------------------------------
  // Payroll Calculation
  // ---------------------------------------------------------
  const handleCalculatePayroll = () => {
    const periodsPerYear = 26;
    let annualGross =
      payMode === 'salary'
        ? parseFloat(salaryInput) || 0
        : (parseFloat(hourlyRate) || 0) *
        (parseFloat(hoursPerWeek) || 0) *
        52;

    const grossPerPeriod = annualGross / periodsPerYear;
    const preTax = parseFloat(preTaxDed) || 0;
    const taxableIncome = Math.max(0, grossPerPeriod - preTax);

    const fedTaxAmt = taxableIncome * ((parseFloat(fedRate) || 0) / 100);
    const stateTaxAmt = taxableIncome * ((parseFloat(stateRate) || 0) / 100);

    const postTax = parseFloat(postTaxDed) || 0;
    const net = taxableIncome - fedTaxAmt - stateTaxAmt - postTax;

    setCalculationResult({
      gross: grossPerPeriod,
      fedTax: fedTaxAmt,
      stateTax: stateTaxAmt,
      net,
      period: 'Bi-Weekly',
    });
  };

  // ---------------------------------------------------------
  // AI Query Handler (patched for chart JSON)
  // ---------------------------------------------------------
  const handleAskAi = async (queryOverride) => {
    const q = queryOverride || aiQuery;
    if (!q.trim()) return;

    setIsThinking(true);
    setAiResponse(null);
    setDebugInfo(null);

    try {
      const response = await analyticsQuery(q);
      const raw = response.result;

      let parsed = null;

      // Try to parse as JSON first (for charts)
      if (typeof raw === 'string') {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const jsonObj = JSON.parse(jsonMatch[0]);
            if (jsonObj.image_base64) {
              // It's a chart response
              parsed = jsonObj;
            }
          } catch (err) {
            // Not valid JSON, treat as text
            console.log('Not JSON, treating as text response');
          }
        }
      }

      // If not a chart, treat as markdown text
      if (!parsed) {
        parsed = {
          answer_markdown: raw,
          follow_up_questions: [],
        };
      }

      setAiResponse(parsed);
    } catch (err) {
      console.error(err);
      setAiResponse({
        answer_markdown: 'Error processing your request.',
        follow_up_questions: [],
      });
    }

    setIsThinking(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* HEADER */}
      <div className="px-6 py-6 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <IChart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Analytics & Accounting Hub</h2>
            <p className="text-xs text-gray-500">
              Business calculations, payroll estimation, and data analysis tools.
            </p>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-8">

              {/* AI CUSTOM QUERY */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Custom Query</h3>

                <div className="relative">
                  <textarea
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      !e.shiftKey &&
                      (e.preventDefault(), handleAskAi())
                    }
                    placeholder="Ask for any calculation or data analysis..."
                    className="w-full p-3 min-h-[100px] bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-gray-900 text-sm resize-none placeholder-gray-400"
                  />
                  <button
                    onClick={() => handleAskAi()}
                    disabled={isThinking || !aiQuery.trim()}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {isThinking ? 'Analyzing...' : 'Analyze Data'}
                  </button>
                </div>

                {/* AGENT RESPONSE */}
                {aiResponse && (
                  <div className="mt-6 bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3">
                      Agent Response
                    </div>

                    <div className="mt-2">
                      {aiResponse.image_base64 ? (
                        // Chart response
                        <div className="space-y-4">
                          {/* Analysis Stats (if available) */}
                          {aiResponse.analysis && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              {aiResponse.analysis.min !== undefined && (
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                  <div className="text-xs text-emerald-600 font-medium">Min</div>
                                  <div className="text-lg font-bold text-emerald-900">
                                    ${aiResponse.analysis.min.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              {aiResponse.analysis.max !== undefined && (
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                  <div className="text-xs text-emerald-600 font-medium">Max</div>
                                  <div className="text-lg font-bold text-emerald-900">
                                    ${aiResponse.analysis.max.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              {aiResponse.analysis.average !== undefined && (
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                  <div className="text-xs text-emerald-600 font-medium">Average</div>
                                  <div className="text-lg font-bold text-emerald-900">
                                    ${aiResponse.analysis.average.toLocaleString()}
                                  </div>
                                </div>
                              )}
                              {aiResponse.analysis.growth_percent !== undefined && (
                                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                  <div className="text-xs text-emerald-600 font-medium">Growth</div>
                                  <div className="text-lg font-bold text-emerald-900">
                                    {aiResponse.analysis.growth_percent}%
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Chart */}
                          <div className="flex flex-col items-center">
                            <img
                              src={`data:image/${aiResponse.format || 'png'};base64,${aiResponse.image_base64}`}
                              alt={aiResponse.description}
                              className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200"
                            />
                            <p className="mt-2 text-sm text-gray-600 italic">
                              {aiResponse.description}
                            </p>
                          </div>
                          
                          {/* Report Text (if available) */}
                          {aiResponse.report && (
                            <div className="mt-6 prose prose-sm max-w-none prose-emerald bg-white rounded-lg p-6 border border-gray-200">
                              <MarkdownRenderer
                                content={aiResponse.report}
                                themeColor="emerald"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        // Text response with markdown
                        <div className="prose prose-sm max-w-none prose-emerald">
                          <MarkdownRenderer
                            content={aiResponse.answer_markdown || 'No response'}
                            themeColor="emerald"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PAYROLL CALCULATOR (FULL & UNCHANGED) */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    Payroll Calculator
                  </h3>
                  <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setPayMode('salary')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${payMode === 'salary'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Salary
                    </button>
                    <button
                      onClick={() => setPayMode('hourly')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md ${payMode === 'hourly'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      Hourly
                    </button>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* INPUTS */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase mb-1 block text-gray-500">
                        {payMode === 'salary' ? 'Annual Salary ($)' : 'Hourly Rate ($)'}
                      </label>
                      <input
                        type="number"
                        value={payMode === 'salary' ? salaryInput : hourlyRate}
                        onChange={(e) =>
                          payMode === 'salary'
                            ? setSalaryInput(e.target.value)
                            : setHourlyRate(e.target.value)
                        }
                        className="w-full p-2.5 bg-white border border-gray-300 rounded-xl"
                      />
                    </div>

                    {payMode === 'hourly' && (
                      <div>
                        <label className="text-[10px] font-bold uppercase mb-1 block text-gray-500">
                          Hours Per Week
                        </label>
                        <input
                          type="number"
                          value={hoursPerWeek}
                          onChange={(e) => setHoursPerWeek(e.target.value)}
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase mb-1 block text-gray-500">
                          Fed Tax (%)
                        </label>
                        <input
                          type="number"
                          value={fedRate}
                          onChange={(e) => setFedRate(e.target.value)}
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase mb-1 block text-gray-500">
                          State Tax (%)
                        </label>
                        <input
                          type="number"
                          value={stateRate}
                          onChange={(e) => setStateRate(e.target.value)}
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase mb-1 block text-gray-500">
                          Pre-Tax Ded ($)
                        </label>
                        <input
                          type="number"
                          value={preTaxDed}
                          onChange={(e) => setPreTaxDed(e.target.value)}
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase mb-1 block text-gray-500">
                          Post-Tax Ded ($)
                        </label>
                        <input
                          type="number"
                          value={postTaxDed}
                          onChange={(e) => setPostTaxDed(e.target.value)}
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleCalculatePayroll}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm"
                    >
                      Calculate Payroll
                    </button>
                  </div>

                  {/* RESULTS */}
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 flex flex-col justify-center space-y-6">
                    {!calculationResult ? (
                      <div className="text-center text-emerald-800/50 text-sm">
                        Enter details to see estimated breakdown.
                      </div>
                    ) : (
                      <>
                        <div className="text-center pb-4 border-b border-emerald-200">
                          <p className="text-sm text-emerald-700 font-medium">
                            Estimated Net Pay
                          </p>
                          <p className="text-4xl font-bold text-emerald-900 mt-2">
                            $
                            {calculationResult.net.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <span className="inline-block mt-2 px-2 py-1 bg-emerald-200/50 text-emerald-800 text-xs rounded-md">
                            Per {calculationResult.period} Paycheck
                          </span>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Gross Pay</span>
                            <span className="font-medium text-gray-900">
                              $
                              {calculationResult.gross.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between text-red-500/80">
                            <span>Federal Tax ({fedRate}%)</span>
                            <span>
                              -
                              {calculationResult.fedTax.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between text-red-500/80">
                            <span>State Tax ({stateRate}%)</span>
                            <span>
                              -
                              {calculationResult.stateTax.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-6">

              {/* Dashboard Templates */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Dashboard Templates</h3>
                <p className="text-xs text-gray-500 mb-4">Click to generate comprehensive analytics dashboards</p>
                <div className="space-y-2">
                  {ANALYTICS_DASHBOARD_PROMPTS.map((dashboard, i) => (
                    <button
                      key={i}
                      onClick={() => handleAskAi(dashboard.prompt)}
                      className="w-full text-left p-3 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-emerald-50 hover:from-emerald-50 hover:to-emerald-100 text-xs font-medium text-gray-700 hover:text-emerald-700 hover:border-emerald-400 flex items-center justify-between group transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <IChart className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold">{dashboard.name}</span>
                      </div>
                      <IArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleAskAi('Show monthly revenue chart')}
                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-xs text-gray-600 hover:text-emerald-700 transition-colors"
                  >
                    📈 Revenue Chart
                  </button>
                  <button
                    onClick={() => handleAskAi('Calculate average monthly revenue')}
                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-xs text-gray-600 hover:text-emerald-700 transition-colors"
                  >
                    🧮 Average Revenue
                  </button>
                  <button
                    onClick={() => handleAskAi('Show product sales comparison')}
                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-xs text-gray-600 hover:text-emerald-700 transition-colors"
                  >
                    📊 Product Sales
                  </button>
                  <button
                    onClick={() => handleAskAi('Analyze daily traffic trends')}
                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-xs text-gray-600 hover:text-emerald-700 transition-colors"
                  >
                    👥 Traffic Analysis
                  </button>
                </div>
              </div>

              {/* Available Datasets */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Available Data</h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span><strong>Sales:</strong> Revenue, Expenses, Customers (6 months)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span><strong>Products:</strong> Units Sold, Returns (3 products)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span><strong>Traffic:</strong> Daily Visitors (7 days)</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHub;
