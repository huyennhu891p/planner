
import React, { useState } from 'react';
import { ViewState, DayPlan, PlannerConfig, FormatType } from './types';
import { DAYS_VN, DEFAULT_THEMES, FORMAT_ICONS, QSI_VOICE } from './constants';
import { geminiService } from './geminiService';

const SAMPLE_TITLES = [
  "A Quiet Learning Moment", "What Learning Looks Like", "Teacher Support", "Small Class Advantage", "Community Moment", "A Day at QSI", "Who is QSI For?",
  "Mastery-Based Learning", "Learning at Your Own Pace", "Assessment Without Pressure", "Teacher Observation", "FAQ: International Students", "How Classrooms Feel", "Gentle Invitation",
  "Small Progress Story", "Emotional Safety", "Learning Skills", "Individual Attention", "Parent Voice", "Student Confidence", "Why Small Steps Matter",
  "QSI Values", "Multicultural Environment", "Inside the Classroom", "Preparing for the Future", "Community Connection", "Why Families Choose QSI", "FINAL CTA",
  "Monthly Wrap Up", "Admissions Open"
];

const Header: React.FC<{ currentView: ViewState; setView: (v: ViewState) => void }> = ({ currentView, setView }) => (
  <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-bold">Q</div>
        <h1 className="text-xl font-semibold text-slate-800 tracking-tight">QSI Fanpage Planner</h1>
      </div>
      <nav className="flex gap-4">
        <button onClick={() => setView(ViewState.CREATE)} className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${currentView === ViewState.CREATE ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>1. Setup</button>
        <button onClick={() => setView(ViewState.EDIT)} className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${currentView === ViewState.EDIT ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>2. Edit</button>
        <button onClick={() => setView(ViewState.EXPORT)} className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${currentView === ViewState.EXPORT ? 'bg-blue-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>3. Export Poster</button>
      </nav>
    </div>
  </header>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.CREATE);
  const [days, setDays] = useState<DayPlan[]>([]);
  const [generatingImageId, setGeneratingImageId] = useState<number | null>(null);
  const [config, setConfig] = useState<PlannerConfig>({
    month: 'OCTOBER 2024',
    mainTheme: 'Calm Classrooms, Mastery Learning, and Student Well-being',
    daysCount: 30,
    weekThemes: [...DEFAULT_THEMES],
    videoFrequency: 'Saturdays'
  });

  const generateInitialPlanner = () => {
    const newDays: DayPlan[] = [];
    for (let i = 1; i <= config.daysCount; i++) {
      const weekIndex = Math.min(Math.floor((i - 1) / 7), 3);
      const dayOfWeekIndex = (i - 1) % 7; 
      const dayOfWeek = DAYS_VN[dayOfWeekIndex];
      let format: FormatType = 'Photo';
      if (dayOfWeekIndex === 6) format = 'Video'; 
      else if (i % 5 === 0) format = 'Photo+Text';
      else if (i === 28) format = 'FAQ'; 

      newDays.push({
        id: i,
        dayIndex: i,
        dayOfWeek,
        weekTheme: config.weekThemes[weekIndex],
        title: SAMPLE_TITLES[i-1] || `Day ${i} Content Topic`,
        format,
        content: format === 'Video' ? 'Shot list: Classroom scenes, student interaction, teacher support.' : 'Photo of students focusing on their task.',
        caption: `Every child learns best when they feel safe and understood. At QSI, our classrooms are calm spaces where students can focus and grow at their own pace...`,
        image: undefined
      });
    }
    setDays(newDays);
    setView(ViewState.EDIT);
  };

  const updateDay = (id: number, updates: Partial<DayPlan>) => {
    setDays(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const handleAIAction = async (dayId: number, type: 'hook' | 'rewrite' | 'shotlist' | 'image') => {
    const day = days.find(d => d.id === dayId);
    if (!day) return;
    try {
      if (type === 'image') {
        setGeneratingImageId(dayId);
        const imageUrl = await geminiService.generateImage(`${day.title}. ${day.caption}`);
        if (imageUrl) updateDay(dayId, { image: imageUrl });
        else alert('Failed to generate image sample.');
        setGeneratingImageId(null);
        return;
      }
      let result = '';
      if (type === 'hook') result = await geminiService.suggestHook(day.title);
      else if (type === 'rewrite') result = await geminiService.rewriteCaption(day.caption, day.dayOfWeek.includes('7') || day.dayOfWeek.includes('Nhật'), day.image);
      else if (type === 'shotlist') result = await geminiService.generateShotList(day.title);
      if (result && type !== 'hook') updateDay(dayId, { [type === 'rewrite' ? 'caption' : 'content']: result });
      if (type === 'hook') alert(`Hook Ideas:\n\n${result}`);
    } catch (err) {
      alert('AI service error. Please try again.');
      setGeneratingImageId(null);
    }
  };

  const getDayShort = (vnDay: string) => {
    const map: Record<string, string> = { 'Thứ 2': 'MON', 'Thứ 3': 'TUE', 'Thứ 4': 'WED', 'Thứ 5': 'THU', 'Thứ 6': 'FRI', 'Thứ 7': 'SAT', 'Chủ Nhật': 'SUN' };
    return map[vnDay] || 'DAY';
  };

  return (
    <div className="min-h-screen pb-20">
      <Header currentView={view} setView={setView} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {view === ViewState.CREATE && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-serif text-slate-900 mb-6">Create Monthly Planner</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Month Name</label>
                  <input type="text" value={config.month} onChange={(e) => setConfig({...config, month: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Days Count</label>
                  <select value={config.daysCount} onChange={(e) => setConfig({...config, daysCount: Number(e.target.value) as 30|31})} className="w-full px-4 py-2 border rounded-lg">
                    <option value={30}>30 Days</option><option value={31}>31 Days</option>
                  </select>
                </div>
              </div>
              <input type="text" value={config.mainTheme} onChange={(e) => setConfig({...config, mainTheme: e.target.value})} className="w-full px-4 py-2 border rounded-lg" placeholder="Main Strategy Theme..." />
              <div className="space-y-3">
                {config.weekThemes.map((theme, idx) => (
                  <input key={idx} type="text" value={theme} onChange={(e) => {
                    const newThemes = [...config.weekThemes]; newThemes[idx] = e.target.value; setConfig({...config, weekThemes: newThemes});
                  }} className="w-full px-4 py-2 border rounded-lg text-sm" />
                ))}
              </div>
              <button onClick={generateInitialPlanner} className="w-full py-4 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-800 transition-all">Generate Strategy</button>
            </div>
          </div>
        )}

        {view === ViewState.EDIT && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border flex justify-between items-center mb-6">
              <div><h2 className="text-2xl font-serif">{config.month}</h2><p className="text-slate-500 text-sm">{config.mainTheme}</p></div>
              <div className="px-4 py-1.5 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded-full border border-green-100 tracking-widest">QSI English Voice Active</div>
            </div>
            {days.map((day) => (
              <div key={day.id} className="bg-white border rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  <div className="flex justify-between font-bold text-[11px] text-blue-900 uppercase"><span>Day {day.dayIndex}</span><span>{day.dayOfWeek}</span></div>
                  <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative border-2 border-dashed border-slate-200">
                    {generatingImageId === day.id ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10"><div className="w-6 h-6 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : null}
                    {day.image ? <img src={day.image} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-2xl">📸</div>}
                  </div>
                  <button onClick={() => handleAIAction(day.id, 'image')} className="w-full py-2 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg hover:bg-purple-200">🎨 GENERATE SAMPLE IMAGE</button>
                  <select value={day.format} onChange={(e) => updateDay(day.id, { format: e.target.value as FormatType })} className="w-full p-2 border rounded-lg text-sm outline-none">
                    {['Photo', 'Photo+Text', 'Video', 'FAQ', 'Quote'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <input type="text" value={day.title} onChange={(e) => updateDay(day.id, { title: e.target.value })} className="w-full text-xl font-bold border-b pb-1 outline-none focus:border-blue-500" />
                  <div className="flex gap-2">
                    <button onClick={() => handleAIAction(day.id, 'hook')} className="text-[10px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded">✨ HOOKS</button>
                    <button onClick={() => handleAIAction(day.id, 'rewrite')} className="text-[10px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded">🤖 AI REWRITE</button>
                    {day.format === 'Video' && <button onClick={() => handleAIAction(day.id, 'shotlist')} className="text-[10px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded">🎥 SHOT LIST</button>}
                  </div>
                  <textarea value={day.caption} onChange={(e) => updateDay(day.id, { caption: e.target.value })} className="w-full h-24 p-3 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500" />
                  <input type="text" value={day.content} onChange={(e) => updateDay(day.id, { content: e.target.value })} className="w-full p-2 border-slate-100 border rounded text-xs text-slate-500" placeholder="Notes..." />
                </div>
              </div>
            ))}
          </div>
        )}

        {view === ViewState.EXPORT && (
          <div className="space-y-12 no-print-background">
            {/* Control Panel */}
            <div className="no-print bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-serif text-slate-900">Final Export Center</h2>
                <p className="text-slate-500 text-sm mt-1">Ready for leadership approval & team distribution.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => window.print()}
                  className="bg-blue-900 text-white px-10 py-4 rounded-full font-bold shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
                >
                  <span className="text-xl">🖨️</span> SAVE AS PDF (A4)
                </button>
              </div>
            </div>

            {/* A4 VERSION 1: LANDSCAPE CALENDAR OVERVIEW */}
            <div className="a4-landscape">
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-end border-b-4 border-blue-900 pb-4 mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-blue-900 tracking-tighter">QSI FANPAGE STRATEGY</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1">{config.month} • CONTENT OVERVIEW</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-900 font-bold text-xs">GOAL: {config.mainTheme}</p>
                    <p className="text-slate-400 text-[10px] font-medium italic">Confidence. Care. Mastery.</p>
                  </div>
                </div>

                <div className="poster-grid flex-1">
                  {days.map((day) => (
                    <div key={day.id} className="day-card-poster shadow-sm">
                      <div className="flex justify-between items-center mb-1 px-1">
                        <span className="text-[10px] font-black text-blue-900">#{day.dayIndex}</span>
                        <span className="text-[8px] font-bold text-slate-300">{getDayShort(day.dayOfWeek)}</span>
                      </div>
                      <h3 className="text-[9px] font-bold leading-[1.1] mb-1.5 h-6 line-clamp-2 px-1 text-slate-800">{day.title}</h3>
                      <div className="flex-1 bg-slate-50 rounded-sm overflow-hidden mb-1.5 border border-slate-100 flex items-center justify-center">
                        {day.image ? <img src={day.image} className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-200 font-bold">{day.format.toUpperCase()}</span>}
                      </div>
                      <p className="text-[7.5px] text-slate-500 leading-[1.2] line-clamp-3 italic px-1 mb-1">{day.caption}</p>
                      <div className="mt-auto flex justify-between items-center pt-1 border-t border-slate-50 px-1">
                        <span className="text-[7px] font-bold text-slate-300 uppercase tracking-tighter truncate w-16">{day.weekTheme}</span>
                        <span className="text-[9px] grayscale opacity-50">{FORMAT_ICONS[day.format]}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-widest pt-4 border-t border-slate-100">
                  <span>© 2024 QSI INTERNATIONAL SCHOOLS • FANPAGE PLANNER</span>
                  <div className="flex gap-4">
                    <span>STATUS: DRAFT</span>
                    <span className="text-blue-900">APPROVED BY: _____________________</span>
                  </div>
                </div>
              </div>
            </div>

            {/* A4 VERSION 2: PORTRAIT EXECUTION LIST */}
            <div className="a4-portrait">
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-white text-2xl font-black">Q</div>
                    <div>
                      <h2 className="text-3xl font-serif text-slate-900">Execution Checklist</h2>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Daily Production Guide • {config.month}</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
                    <p>TONE: {QSI_VOICE.tone}</p>
                    <p>LANG: ENGLISH (GLOBAL)</p>
                    <p>VER: 1.0.2-AI</p>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="grid grid-cols-12 gap-4 bg-slate-900 text-white px-4 py-3 text-[10px] font-bold uppercase rounded-t-lg">
                    <div className="col-span-1">DAY</div>
                    <div className="col-span-1">FMT</div>
                    <div className="col-span-3">THEME / TOPIC</div>
                    <div className="col-span-7">NOTES & PRODUCTION DETAIL</div>
                  </div>
                  <div className="divide-y divide-slate-100 border-x border-b border-slate-100 rounded-b-lg overflow-hidden">
                    {days.map((day) => (
                      <div key={day.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-start hover:bg-slate-50 transition-colors">
                        <div className="col-span-1 flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-slate-200 rounded-md"></div>
                          <span className="text-[11px] font-black text-slate-300">{day.dayIndex}</span>
                        </div>
                        <div className="col-span-1 text-base">{FORMAT_ICONS[day.format]}</div>
                        <div className="col-span-3">
                          <p className="text-[11px] font-bold text-slate-900 leading-tight">{day.title}</p>
                          <p className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter mt-1">{getDayShort(day.dayOfWeek)}</p>
                        </div>
                        <div className="col-span-7">
                          <p className="text-[10px] text-slate-800 font-semibold mb-1">Focus: <span className="font-normal text-slate-500 italic">{day.content}</span></p>
                          <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-relaxed">{day.caption}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12 p-8 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-3 gap-10 text-[10px]">
                  <div>
                    <h4 className="font-black text-blue-900 uppercase mb-2">QSI Voice Reminders</h4>
                    <p className="text-slate-500 leading-relaxed italic">"Avoid hard-sell tactics. Focus on individual growth and calm, steady progress. We are building trust, not just filling seats."</p>
                  </div>
                  <div>
                    <h4 className="font-black text-blue-900 uppercase mb-2">Media Quality</h4>
                    <p className="text-slate-500 leading-relaxed">Landscape photos only. Videos must be professionally shot at 24fps/30fps. Ensure no student identifiers are visible in backgrounds.</p>
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <div className="w-32 h-px bg-slate-300 mb-2"></div>
                    <p className="font-bold text-slate-400 uppercase tracking-widest">Director Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex justify-center no-print">
        <div className="flex items-center gap-12">
          <button onClick={() => setView(ViewState.CREATE)} className={`flex flex-col items-center gap-1 ${view === ViewState.CREATE ? 'text-blue-900' : 'text-slate-400'}`}>
            <span className="text-xl">⚙️</span><span className="text-[10px] font-bold uppercase tracking-wider">Setup</span>
          </button>
          <button onClick={() => setView(ViewState.EDIT)} className={`flex flex-col items-center gap-1 ${view === ViewState.EDIT ? 'text-blue-900' : 'text-slate-400'}`}>
            <span className="text-xl">✍️</span><span className="text-[10px] font-bold uppercase tracking-wider">Editor</span>
          </button>
          <button onClick={() => setView(ViewState.EXPORT)} className={`flex flex-col items-center gap-1 ${view === ViewState.EXPORT ? 'text-blue-900' : 'text-slate-400'}`}>
            <span className="text-xl">🖨️</span><span className="text-[10px] font-bold uppercase tracking-wider">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
