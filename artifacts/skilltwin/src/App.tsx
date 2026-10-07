import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  useAnalyzeSkillTwin,
  useEvaluateMockInterview,
  useGenerateMockInterview,
  useHealthCheck,
} from '@workspace/api-client-react';
import type {
  MockInterviewEvaluation,
  MockInterviewQuestions,
  SkillTwinAnalysis,
  SkillTwinAnalysisInput,
} from '@workspace/api-client-react';
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowRight, AudioLines, BookOpen, Check,
  CircleAlert, Clock3, FileText, Gauge, Headphones, LoaderCircle, Mic,
  Play, RotateCcw, Sparkles, Square, Target, Upload, Volume2, X,
} from 'lucide-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();
const ROLE_SUGGESTIONS = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Data Analyst',
  'Data Scientist', 'Machine Learning Engineer', 'Cybersecurity Analyst', 'IT Support Specialist',
  'Product Manager', 'Project Manager', 'Business Analyst', 'Operations Manager',
  'Management Consultant', 'Financial Analyst', 'Investment Banking Analyst', 'Accountant',
  'UX Designer', 'Product Designer', 'Graphic Designer', 'Service Designer',
  'Mechanical Engineer', 'Civil Engineer', 'Electrical Engineer', 'Robotics Engineer',
  'Registered Nurse', 'Physical Therapist', 'Public Health Analyst', 'Clinical Research Coordinator',
  'Marketing Specialist', 'Brand Strategist', 'Content Designer', 'Digital Marketing Manager',
  'Electrician', 'Carpenter', 'HVAC Technician', 'Automotive Technician',
];
const storageKey = 'skilltwin-target-role';
const getSavedRole = () => {
  try { return window.localStorage.getItem(storageKey) || ''; } catch { return ''; }
};

function AppShell({ children }: { children: React.ReactNode }) {
  const health = useHealthCheck();
  const [location] = useLocation();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-lockup" aria-label="SkillTwin home" data-testid="link-brand-home">
          <span className="brand-mark"><Activity size={18} strokeWidth={2.4} /></span>
          <span>skill<span className="brand-light">twin</span></span>
        </Link>
        <p className="side-label">YOUR CAREER WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          <Link href="/" className={`nav-link ${location === '/' ? 'active' : ''}`} data-testid="link-readiness">
            <Gauge size={17} /><span>Readiness lab</span>{location === '/' && <i />}
          </Link>
          <Link href="/interview" className={`nav-link ${location === '/interview' ? 'active' : ''}`} data-testid="link-interview">
            <AudioLines size={17} /><span>Mock interview</span>{location === '/interview' && <i />}
          </Link>
        </nav>
        <div className="coach-note">
          <span className="note-icon"><Sparkles size={16} /></span>
          <p>A steady place to turn ambition into a plan.</p>
          <span className="note-rule" />
          <span className="note-caption">YOUR CAREER, IN YOUR HANDS</span>
        </div>
        <div className="sidebar-bottom">
          <div className="health-indicator" role="status" data-testid="status-api-health">
            <span className={`health-dot ${health.isError ? 'offline' : ''}`} />
            <span>{health.isLoading ? 'Connecting to service' : health.isError ? 'Service unavailable' : 'Career service online'}</span>
          </div>
          <div className="sidebar-foot">SKILLTWIN <span>·</span> STUDENT CAREER COPILOT</div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="crumb"><span>SkillTwin</span><span className="crumb-slash">/</span><strong>{location === '/interview' ? 'Mock interview' : 'Readiness lab'}</strong></div>
          <div className="topbar-right">
            <span className="live-status"><i className={`health-dot ${health.isError ? 'offline' : ''}`} />{health.isError ? 'OFFLINE' : 'CONNECTED'}</span>
            <div className="user-avatar" aria-label="SkillTwin student workspace">ST</div>
          </div>
        </header>
        <div className="content-wrap">{children}</div>
      </main>
    </div>
  );
}

function Home() {
  const [targetRole, setTargetRole] = useState(() => getSavedRole() || 'Data Analyst');
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [formError, setFormError] = useState('');
  const [analysis, setAnalysis] = useState<SkillTwinAnalysis | null>(null);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const fileInput = useRef<HTMLInputElement>(null);
  const analyze = useAnalyzeSkillTwin();

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, targetRole); } catch { /* storage is optional */ }
  }, [targetRole]);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFormError('');
    if (!/\.(txt|md|rtf|csv)$/i.test(file.name) && !file.type.startsWith('text/')) {
      setFormError('Choose a text-based resume (.txt, .md, .rtf or .csv).');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError('This file is over 2 MB. Paste a shorter version instead.');
      event.target.value = '';
      return;
    }
    try {
      setResumeText((await file.text()).slice(0, 16000));
      setFileName(file.name);
    } catch { setFormError('We could not read that file. Paste your resume text instead.'); }
    event.target.value = '';
  };

  const submitAnalysis = () => {
    const role = targetRole.trim();
    if (role.length < 2) { setFormError('Add a target role with at least two characters.'); return; }
    setFormError('');
    const data: SkillTwinAnalysisInput = {
      targetRole: role,
      ...(resumeText.trim() ? { resumeText: resumeText.trim() } : {}),
      ...(analysis && Object.keys(levels).length
        ? { skillLevels: analysis.gaps.map((gap) => ({ skill: gap.skill, current: levels[gap.skill] ?? gap.current })) }
        : {}),
    };
    analyze.mutate({ data }, {
      onSuccess: (result) => {
        setAnalysis(result);
        setLevels(Object.fromEntries(result.gaps.map((gap) => [gap.skill, gap.current])));
      },
    });
  };
  const reset = () => { setAnalysis(null); analyze.reset(); };
  const apiError = analyze.error as (Error & { error?: string; response?: { data?: { error?: string } } }) | null;
  const analysisError = apiError?.response?.data?.error || apiError?.error || apiError?.message || 'Please try again in a moment.';

  return (
    <div className="page">
      <section className="intro-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />A CAREER COACH, BUILT AROUND YOU</div>
          <h1>Make your next<br /><em>move</em> make sense.</h1>
          <p className="intro-copy">Bring the role you’re curious about. Leave with a clear-eyed view of what you already bring—and what to build next.</p>
        </div>
        <div className="intro-stamp"><span className="stamp-caption">A PLAN THAT<br />STARTS WHERE<br />YOU ARE</span><span className="stamp-orbit"><ArrowDownRight size={21} /></span></div>
      </section>

      <div className="workspace-grid">
        <section className="setup-panel panel">
          <div className="panel-heading">
            <span className="heading-index">01</span>
            <div><div className="section-kicker">START WITH YOUR DIRECTION</div><h2>Tell us what you’re aiming for</h2></div>
            {analysis && <button className="text-action" onClick={reset} data-testid="button-edit-profile"><RotateCcw size={14} /> Edit inputs</button>}
          </div>
          <div className="form-section">
            <label className="field-label" htmlFor="target-role">Target role <span className="field-sub">ANY ROLE, YOUR WORDS</span></label>
            <input id="target-role" className="text-input" list="role-suggestions" value={targetRole} maxLength={100}
              onChange={(event) => { setTargetRole(event.target.value); if (analysis) setAnalysis(null); }}
              placeholder="For example, climate data analyst" data-testid="input-target-role" />
            <datalist id="role-suggestions">{ROLE_SUGGESTIONS.map((role) => <option key={role} value={role} />)}</datalist>
            <p className="field-hint">Start typing or enter a role that’s uniquely yours.</p>
          </div>
          <div className="form-section resume-section">
            <div className="label-row"><label className="field-label" htmlFor="resume-text">Resume <span className="optional-label">OPTIONAL, MORE CONTEXT</span></label><span className="char-count">{resumeText.length.toLocaleString()} / 16,000</span></div>
            <textarea id="resume-text" value={resumeText} onChange={(event) => { setResumeText(event.target.value.slice(0, 16000)); setFileName(''); }}
              placeholder="Paste resume text, project experience, or the work you’re proud of." data-testid="input-resume-text" />
            <div className="resume-tools">
              <button type="button" className="upload-button" onClick={() => fileInput.current?.click()} data-testid="button-upload-resume"><Upload size={14} /> Upload text file</button>
              <input ref={fileInput} type="file" accept=".txt,.md,.rtf,.csv,text/*" onChange={onFileChange} hidden data-testid="input-resume-file" />
              <span className="file-hint">{fileName ? <><FileText size={13} /> {fileName}<button className="remove-file" onClick={() => { setFileName(''); setResumeText(''); }} aria-label="Remove uploaded resume" data-testid="button-remove-resume"><X size={13} /></button></> : 'TXT, MD, RTF or CSV · up to 2 MB'}</span>
            </div>
          </div>
          {(formError || analyze.isError) && <div className="error-callout" role="alert" data-testid="status-analysis-error"><CircleAlert size={16} /><span>{formError || analysisError}</span><button onClick={() => { setFormError(''); analyze.reset(); }} aria-label="Dismiss error" data-testid="button-dismiss-error"><X size={15} /></button></div>}
          <button className="analyze-button" onClick={submitAnalysis} disabled={analyze.isPending} data-testid="button-analyze">
            {analyze.isPending ? <><LoaderCircle className="spin" size={17} /> Building your map</> : <><Sparkles size={16} /> Map my next steps <ArrowRight size={17} /></>}
          </button>
          <p className="privacy-note"><span /> Your resume helps personalize this plan; it is not shown publicly.</p>
        </section>

        <section className="results-column">
          {analyze.isPending ? <LoadingAnalysis role={targetRole} /> : analysis ? <AnalysisResults analysis={analysis} levels={levels} onLevelChange={(skill, value) => setLevels((all) => ({ ...all, [skill]: value }))} onRerun={submitAnalysis} busy={analyze.isPending} /> : <EmptyAnalysis />}
        </section>
      </div>
      <footer className="page-footer"><span>Progress is not a straight line.</span><span>SkillTwin <i>—</i> A little clearer, every step.</span></footer>
    </div>
  );
}

function LoadingAnalysis({ role }: { role: string }) {
  return <div className="loading-panel panel" role="status" data-testid="status-analyzing">
    <div className="loading-rings"><span /><span /><span /><Sparkles size={20} /></div>
    <div className="eyebrow">PUTTING YOUR PROFILE IN CONTEXT</div><h2>Connecting the dots.</h2>
    <p>Looking at the work behind “{role}” and finding a useful next step.</p>
    <div className="loading-steps"><span className="step-done"><Check size={13} /> Reading your inputs</span><span className="step-active"><i /> Comparing role skills</span><span><i /> Shaping your 90-day route</span></div>
  </div>;
}

function EmptyAnalysis() {
  return <div className="empty-results panel" data-testid="status-idle">
    <div className="empty-visual"><div className="empty-orbit orbit-one" /><div className="empty-orbit orbit-two" /><div className="empty-core"><Target size={26} /></div><span className="orbit-node node-a" /><span className="orbit-node node-b" /><span className="orbit-node node-c" /></div>
    <div className="eyebrow">A PERSONAL READINESS MAP</div>
    <h2>Start with where<br />you are.</h2>
    <p>Your strengths count. The gaps are just a direction—not a verdict.</p>
    <div className="empty-divider" />
    <div className="empty-foot"><span><b>01</b> Name your direction</span><ArrowRight size={14} /><span><b>02</b> See what connects</span><ArrowRight size={14} /><span><b>03</b> Choose a next step</span></div>
  </div>;
}

function AnalysisResults({ analysis, levels, onLevelChange, onRerun, busy }: {
  analysis: SkillTwinAnalysis; levels: Record<string, number>; onLevelChange: (skill: string, value: number) => void; onRerun: () => void; busy: boolean;
}) {
  return <div className="analysis-stack" data-testid="status-analysis-results">
    {analysis.source === 'local' && <div className="local-estimate-notice" role="status" data-testid="status-local-estimate"><CircleAlert size={15} /><span><strong>Local estimate</strong> — this is a heuristic starting point, not an AI-generated assessment.</span></div>}
    <section className="score-card panel">
      <div className="score-topline"><span className="eyebrow"><span className="eyebrow-line" />READINESS SNAPSHOT</span><button className="icon-button" title="Run analysis again" aria-label="Run analysis again" onClick={onRerun} disabled={busy} data-testid="button-rerun-analysis"><RotateCcw size={15} /></button></div>
      <div className="score-layout">
        <div className="score-ring" style={{ '--score': `${analysis.readiness * 3.6}deg` } as CSSProperties}><div><strong>{analysis.readiness}</strong><span>READINESS / 100</span></div></div>
        <div className="score-copy"><div className="role-chip"><i />{analysis.targetRole}</div><h2>There’s a path<br />from <em>here.</em></h2><p>{analysis.summary}</p><div className="match-line"><span>ROLE MATCH</span><strong>{analysis.matchScore}<small> / 100</small></strong></div></div>
      </div>
      <div className="score-bottom"><span><i /> SNAPSHOT READY</span><span>{analysis.source === 'ai' ? 'AI-ASSISTED ANALYSIS' : 'LOCAL ESTIMATE'}</span></div>
    </section>
    <div className="two-insights">
      <InsightCard title="What you already bring" kind="strength" items={analysis.strengths} testId="list-strengths" />
      <InsightCard title="Where to focus next" kind="focus" items={analysis.shortfalls} testId="list-shortfalls" />
    </div>
    <section className="gaps-card panel">
      <div className="section-head"><div><div className="section-kicker">THE DISTANCE, MADE VISIBLE</div><h2>Your skill alignment</h2></div><span className="bar-legend"><i className="legend-current" /> YOU <i className="legend-required" /> ROLE</span></div>
      <p className="section-intro">Tune your current levels to your own read. Then rerun to reshape the plan.</p>
      <div className="gap-list">{analysis.gaps.map((gap, index) => {
        const current = levels[gap.skill] ?? gap.current;
        return <div className="gap-item" key={gap.skill} data-testid={`row-skill-gap-${index}`}>
          <div className="gap-meta"><strong>{gap.skill}</strong><span>{current}% <i>now</i><b>·</b> {gap.required}% <i>role</i></span></div>
          <div className="gap-track"><span className="required-track" style={{ width: `${gap.required}%` }} /><span className={`current-track tone-${index % 4}`} style={{ width: `${current}%` }} /></div>
          <div className="gap-detail"><p>{gap.rationale}</p>{gap.missingTools?.length ? <div className="tool-tags" aria-label={`Suggested tools for ${gap.skill}`}>{gap.missingTools.map((tool) => <span key={tool}>{tool}</span>)}</div> : null}</div>
          <label className="gap-slider-label" htmlFor={`level-${index}`}>Adjust your current level <span>{current}%</span></label>
          <input id={`level-${index}`} type="range" min="0" max="100" value={current} onChange={(event) => onLevelChange(gap.skill, Number(event.target.value))} aria-label={`${gap.skill} current skill level`} data-testid={`input-level-${index}`} />
        </div>;
      })}</div>
      <button className="secondary-button" onClick={onRerun} disabled={busy} data-testid="button-rerun-levels">{busy ? 'Updating your map…' : <><RotateCcw size={14} /> Recalculate with these levels</>}</button>
    </section>
    <section className="roadmap-section">
      <div className="roadmap-heading"><div><div className="section-kicker">A ROUTE, NOT A RIGID RULEBOOK</div><h2>Your next 90 days</h2></div><span className="roadmap-mark"><Clock3 size={15} /> 3 PHASES</span></div>
      <div className="roadmap-list">{analysis.roadmap.map((phase, index) => <article className="phase-card panel" key={phase.phase} data-testid={`card-roadmap-${index}`}>
        <div className="phase-marker"><span>0{index + 1}</span><i /></div>
        <div className="phase-main">
          <div className="phase-top"><span className={`phase-pill phase-${index}`}>{phase.phase}</span><h3>{phase.title}</h3></div>
          <p className="phase-focus">{phase.focus}</p>
          <div className="milestone-list">{phase.weeklyMilestones.map((milestone, mi) => <div className="milestone-row" key={`${milestone.week}-${mi}`} data-testid={`milestone-${index}-${mi}`}><span className="milestone-week">{milestone.week}</span><div><strong>{milestone.goal}</strong><p>Make: {milestone.deliverable}</p></div></div>)}</div>
          <div className="project-box"><span className="mini-label">PORTFOLIO PROOF</span><p>{phase.portfolioProject}</p></div>
          <div className="roadmap-subhead"><BookOpen size={14} /> LEARN WITH THESE RESOURCES</div>
          <div className="resource-list">{phase.resources.map((resource, ri) => <div className="resource-row" key={`${resource.title}-${ri}`} data-testid={`resource-${index}-${ri}`}><div><strong>{resource.title}</strong><span>{resource.provider} · {resource.free ? 'Free' : 'Paid'}</span><p>{resource.reason}</p></div><span className={resource.free ? 'free-tag' : 'paid-tag'}>{resource.free ? 'FREE' : 'COURSE'}</span></div>)}</div>
          <div className="roadmap-subhead resume-tip-head"><FileText size={14} /> RESUME LANGUAGE TO TRY</div>
          <ul className="resume-tip-list">{phase.resumeTips.map((tip, ti) => <li key={ti}>{tip}</li>)}</ul>
        </div>
      </article>)}</div>
    </section>
    <InterviewBridge role={analysis.targetRole} />
  </div>;
}

function InsightCard({ title, kind, items, testId }: { title: string; kind: 'strength' | 'focus'; items: string[]; testId: string }) {
  return <section className={`insight-card ${kind}`} data-testid={testId}><span className="insight-mark">{kind === 'strength' ? <Check size={15} /> : <ArrowRight size={15} />}</span><h3>{title}</h3><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></section>;
}

function InterviewBridge({ role }: { role: string }) {
  return <Link href="/interview" className="interview-bridge" onClick={() => { try { window.localStorage.setItem(storageKey, role); } catch { /* optional */ } }} data-testid="link-practice-interview">
    <span className="bridge-icon"><AudioLines size={19} /></span><span><small>READY TO TRY IT OUT LOUD?</small><strong>Practice a mock interview for {role}</strong></span><ArrowRight size={18} />
  </Link>;
}

interface RecognitionAlternative extends Event {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
  resultIndex: number;
}
interface Recognition {
  continuous: boolean; interimResults: boolean; lang: string;
  onresult: ((event: RecognitionAlternative) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
}
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

function Interview() {
  const [role, setRole] = useState(() => getSavedRole() || '');
  const [company, setCompany] = useState('');
  const [questions, setQuestions] = useState<MockInterviewQuestions | null>(null);
  const [evaluation, setEvaluation] = useState<MockInterviewEvaluation | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [draft, setDraft] = useState('');
  const [speechText, setSpeechText] = useState('');
  const [speechState, setSpeechState] = useState<'idle' | 'speaking' | 'listening'>('idle');
  const [speechError, setSpeechError] = useState('');
  const [validation, setValidation] = useState('');
  const recognitionRef = useRef<Recognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTextRef = useRef('');
  const generate = useGenerateMockInterview();
  const evaluate = useEvaluateMockInterview();

  useEffect(() => {
    try { if (role.trim()) window.localStorage.setItem(storageKey, role); } catch { /* optional */ }
  }, [role]);
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    setDraft(answers[current] || '');
    setSpeechText('');
    speechTextRef.current = '';
    setSpeechError('');
  }, [current, answers]);

  const stopSpeech = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setSpeechState('idle');
  };
  const startInterview = () => {
    if (role.trim().length < 2) { setValidation('Enter a target role with at least two characters.'); return; }
    stopSpeech();
    setValidation('');
    generate.mutate({ data: { targetRole: role.trim(), ...(company.trim() ? { targetCompany: company.trim() } : {}) } }, {
      onSuccess: (result) => {
        setQuestions(result);
        setEvaluation(null);
        setAnswers({});
        setCurrent(0);
        setDraft('');
      },
    });
  };
  const speakQuestion = () => {
    if (!questions?.questions[current] || !('speechSynthesis' in window)) { setSpeechError('Speech playback is not available in this browser.'); return; }
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(questions.questions[current]);
    synthRef.current = utterance;
    utterance.onstart = () => setSpeechState('speaking');
    utterance.onend = () => setSpeechState('idle');
    utterance.onerror = () => { setSpeechState('idle'); setSpeechError('Could not play the question. You can still read it below.'); };
    window.speechSynthesis.speak(utterance);
  };
  const startListening = () => {
    const win = window as SpeechWindow;
    const Constructor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Constructor) { setSpeechError('Microphone transcription is not supported here. Type your answer in the field below.'); return; }
    stopSpeech();
    setSpeechError('');
    setSpeechText('');
    speechTextRef.current = '';
    try {
      const recognition = new Constructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';
      recognition.onresult = (event) => {
        let finalized = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (result.isFinal) finalized += result[0].transcript;
          else interim += result[0].transcript;
        }
        if (finalized) speechTextRef.current = `${speechTextRef.current}${speechTextRef.current ? ' ' : ''}${finalized}`.trim();
        setSpeechText(`${speechTextRef.current}${interim ? `${speechTextRef.current ? ' ' : ''}${interim}` : ''}`);
      };
      recognition.onerror = (event) => {
        setSpeechState('idle');
        setSpeechError(event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Microphone access was denied. Allow microphone access or type your answer below.'
          : 'Speech capture stopped. Your transcript is still editable below.');
      };
      recognition.onend = () => {
        setSpeechState('idle');
        if (speechTextRef.current) setDraft((previous) => `${previous}${previous ? ' ' : ''}${speechTextRef.current}`.trim());
      };
      recognitionRef.current = recognition;
      recognition.start();
      setSpeechState('listening');
    } catch {
      setSpeechState('idle');
      setSpeechError('Microphone access could not start. Type your answer in the field below.');
    }
  };
  const stopListening = () => { recognitionRef.current?.stop(); setSpeechState('idle'); };
  const acceptAnswer = () => {
    if (!draft.trim()) { setValidation('Add a response before accepting this answer.'); return; }
    setAnswers((all) => ({ ...all, [current]: draft.trim() }));
    setValidation('');
  };
  const skipQuestion = () => {
    setAnswers((all) => { const next = { ...all }; delete next[current]; return next; });
    if (questions && current < questions.questions.length - 1) setCurrent((index) => index + 1);
  };
  const submitEvaluation = () => {
    if (!questions) return;
    const responses = questions.questions.flatMap((question, index) => answers[index]?.trim() ? [{ question, answer: answers[index].trim() }] : []);
    if (responses.length < 3) { setValidation('Answer and accept at least three questions to get feedback.'); return; }
    stopSpeech();
    setValidation('');
    evaluate.mutate({ data: { targetRole: role.trim(), ...(company.trim() ? { targetCompany: company.trim() } : {}), responses } }, {
      onSuccess: (result) => setEvaluation(result),
    });
  };
  const evalError = evaluate.error as (Error & { message?: string }) | null;
  const genError = generate.error as (Error & { message?: string }) | null;
  const answeredCount = Object.values(answers).filter((answer) => answer.trim()).length;

  return <div className="page interview-page">
    <section className="intro-row interview-intro">
      <div><div className="eyebrow"><span className="eyebrow-line" />PRACTICE IS A KIND OF PREPARATION</div><h1>Find your voice<br />in the <em>room.</em></h1><p className="intro-copy">A thoughtful practice round, at your pace. Say it out loud, find your footing, and leave with something useful.</p></div>
      <div className="interview-stamp"><span>THE PRACTICE<br />ROOM</span><AudioLines size={28} /></div>
    </section>
    {!questions ? <InterviewSetup role={role} setRole={setRole} company={company} setCompany={setCompany} onStart={startInterview} busy={generate.isPending} error={validation || (generate.isError ? genError?.message || 'Questions could not be generated. Try again.' : '')} /> : evaluation ? <EvaluationResults evaluation={evaluation} onRetry={() => { setEvaluation(null); setAnswers({}); setCurrent(0); setQuestions(null); }} /> : (
      <div className="interview-workspace">
        <section className="interview-panel panel">
          {questions.source === 'local' && <div className="heuristic-notice" role="status" data-testid="status-local-questions"><CircleAlert size={14} /> Locally suggested questions — not AI-generated.</div>}
          <div className="interview-panel-head"><div><div className="section-kicker">PRACTICE SESSION</div><h2>{questions.targetRole}{questions.targetCompany ? <span> · {questions.targetCompany}</span> : null}</h2></div><span className="question-count">{current + 1} <i>/</i> {questions.questions.length}</span></div>
          <div className="progress-track" aria-label={`Question ${current + 1} of ${questions.questions.length}`}><span style={{ width: `${((current + 1) / questions.questions.length) * 100}%` }} /></div>
          <div className="question-area">
            <span className="question-number">QUESTION {String(current + 1).padStart(2, '0')}</span>
            <h3 data-testid="text-current-question">{questions.questions[current]}</h3>
            <div className={`speech-state ${speechState}`} role="status" data-testid="status-speech-state">
              <span className="state-indicator" />{speechState === 'speaking' ? 'Reading the prompt aloud' : speechState === 'listening' ? 'Listening — take your time' : 'Your turn when you’re ready'}
            </div>
          </div>
          <div className="question-controls">
            <button className="round-control" onClick={speakQuestion} aria-label="Play question aloud" data-testid="button-speak-question"><Volume2 size={16} /><span>Replay</span></button>
            {speechState === 'listening'
              ? <button className="record-button listening" onClick={stopListening} aria-label="Stop microphone" data-testid="button-stop-listening"><Square size={14} fill="currentColor" /> Stop listening</button>
              : <button className="record-button" onClick={startListening} aria-label="Start microphone answer" data-testid="button-start-listening"><Mic size={16} /> Answer by voice</button>}
            {speechState === 'speaking' && <button className="round-control" onClick={stopSpeech} aria-label="Stop question playback" data-testid="button-stop-speech"><Square size={14} /> Stop audio</button>}
          </div>
          {(speechText || speechError) && <div className="transcript-box" role="status" data-testid="status-transcript">
            <div className="transcript-head"><span><Headphones size={14} /> {speechState === 'listening' ? 'Live transcript' : 'Captured words'}</span>{speechText && <button onClick={() => { setSpeechText(''); speechTextRef.current = ''; }} aria-label="Clear transcript" data-testid="button-clear-transcript"><X size={14} /></button>}</div>
            {speechText && <p>{speechText}</p>}{speechError && <p className="speech-error">{speechError}</p>}
          </div>}
          <label className="field-label answer-label" htmlFor="answer-text">Your answer <span className="optional-label">EDIT OR TYPE YOUR RESPONSE</span></label>
          <textarea id="answer-text" className="answer-textarea" value={draft} maxLength={5000} onChange={(event) => { setDraft(event.target.value); setValidation(''); }} placeholder="No perfect wording needed. Start with the part you know." data-testid="input-interview-answer" />
          <div className="answer-footer"><span>{draft.length.toLocaleString()} / 5,000 characters</span><button className={`accept-button ${answers[current] === draft.trim() && draft.trim() ? 'accepted' : ''}`} onClick={acceptAnswer} data-testid="button-accept-answer">{answers[current] === draft.trim() && draft.trim() ? <><Check size={15} /> Answer saved</> : <><Check size={15} /> Accept answer</>}</button></div>
          {validation && <p className="inline-error" role="alert" data-testid="status-interview-validation"><CircleAlert size={14} />{validation}</p>}
          {evaluate.isError && <p className="inline-error" role="alert" data-testid="status-evaluation-error"><CircleAlert size={14} />{evalError?.message || 'Feedback could not be prepared. Please try again.'}</p>}
          <div className="question-footer">
            <button className="quiet-button" onClick={skipQuestion} disabled={current >= questions.questions.length - 1} data-testid="button-skip-question">Skip question <ArrowRight size={14} /></button>
            <div className="step-controls">
              <button className="quiet-button" onClick={() => setCurrent((index) => Math.max(0, index - 1))} disabled={current === 0} data-testid="button-previous-question"><ArrowLeft size={14} /> Previous</button>
              {current < questions.questions.length - 1
                ? <button className="next-button" onClick={() => { if (draft.trim() && answers[current] !== draft.trim()) acceptAnswer(); setCurrent((index) => index + 1); }} data-testid="button-next-question">Next question <ArrowRight size={15} /></button>
                : <button className="next-button" onClick={submitEvaluation} disabled={evaluate.isPending || answeredCount < 3} data-testid="button-submit-evaluation">{evaluate.isPending ? <><LoaderCircle className="spin" size={15} /> Preparing feedback</> : <>Get my feedback <ArrowRight size={15} /></>}</button>}
            </div>
          </div>
          <p className="answered-note" data-testid="status-answered-count">{answeredCount} of {questions.questions.length} answers accepted · at least 3 for feedback</p>
        </section>
        <aside className="interview-aside">
          <div className="aside-card panel"><span className="aside-index">A NOTE BEFORE YOU BEGIN</span><h3>There’s no score for sounding polished.</h3><p>This is rehearsal, not a verdict. Use your own words, pause to think, and take another run if you want one.</p><span className="aside-line" /><span className="aside-foot">KEEP IT HUMAN. KEEP IT YOURS.</span></div>
          <div className="question-nav panel"><div className="section-kicker">YOUR QUESTIONS</div>{questions.questions.map((question, index) => <button key={index} className={`question-nav-item ${index === current ? 'current' : ''} ${answers[index] ? 'answered' : ''}`} onClick={() => setCurrent(index)} data-testid={`button-question-nav-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><i>{answers[index] ? <Check size={13} /> : null}</i></button>)}</div>
        </aside>
      </div>
    )}
    {evaluation && <div className="evaluation-local-note" />}
    <footer className="page-footer"><span>Make room to think.</span><span>SkillTwin <i>—</i> Practice at your pace.</span></footer>
  </div>;
}

function InterviewSetup({ role, setRole, company, setCompany, onStart, busy, error }: {
  role: string; setRole: (role: string) => void; company: string; setCompany: (company: string) => void; onStart: () => void; busy: boolean; error: string;
}) {
  return <div className="interview-setup-grid">
    <section className="interview-setup panel">
      <div className="panel-heading"><span className="heading-index">01</span><div><div className="section-kicker">A LITTLE CONTEXT</div><h2>Set up your practice round</h2></div></div>
      <div className="form-section"><label className="field-label" htmlFor="interview-role">Target role</label><input id="interview-role" className="text-input" list="role-suggestions-interview" value={role} maxLength={100} onChange={(event) => setRole(event.target.value)} placeholder="The role you’re working toward" data-testid="input-interview-role" /><datalist id="role-suggestions-interview">{ROLE_SUGGESTIONS.map((item) => <option key={item} value={item} />)}</datalist></div>
      <div className="form-section"><label className="field-label" htmlFor="interview-company">Company <span className="optional-label">OPTIONAL</span></label><input id="interview-company" className="text-input" value={company} maxLength={100} onChange={(event) => setCompany(event.target.value)} placeholder="Add a company for more tailored questions" data-testid="input-interview-company" /></div>
      {error && <div className="error-callout" role="alert" data-testid="status-interview-error"><CircleAlert size={16} /><span>{error}</span></div>}
      <button className="analyze-button start-interview" onClick={onStart} disabled={busy} data-testid="button-start-interview">{busy ? <><LoaderCircle className="spin" size={16} /> Preparing your questions</> : <><Play size={15} /> Start practice <ArrowRight size={16} /></>}</button>
      <p className="privacy-note"><span /> 3–5 questions, one at a time. You decide when to speak.</p>
    </section>
    <div className="interview-prep panel"><div className="prep-illustration"><span className="prep-circle circle-one" /><span className="prep-circle circle-two" /><div className="prep-center"><AudioLines size={26} /></div><i className="prep-dot" /></div><div className="eyebrow">A LOW-STAKES REHEARSAL</div><h2>Take a breath.<br /><em>You’ve got this.</em></h2><p>Speak your answer or type it out. Review everything before it becomes feedback.</p><div className="prep-steps"><span><b>01</b> Hear a question</span><span><b>02</b> Find your words</span><span><b>03</b> Take a useful note</span></div></div>
  </div>;
}

function EvaluationResults({ evaluation, onRetry }: { evaluation: MockInterviewEvaluation; onRetry: () => void }) {
  const scores = [['Overall', evaluation.overallScore], ['Clarity', evaluation.clarityScore], ['Technical accuracy', evaluation.technicalAccuracy]] as const;
  return <section className="evaluation-results" data-testid="status-evaluation-results">
    {evaluation.source === 'local' && <div className="local-estimate-notice" role="status" data-testid="status-local-evaluation"><CircleAlert size={15} /><span><strong>Heuristic feedback</strong> — these local estimates use simple text signals. They are not authoritative or a judgment of your ability.</span></div>}
    <div className="evaluation-hero panel"><div className="eyebrow"><span className="eyebrow-line" />YOUR PRACTICE NOTES</div><h2>A first take.<br /><em>Not the final word.</em></h2><p>{evaluation.summary}</p><div className="evaluation-meta">{evaluation.targetRole}{evaluation.targetCompany ? ` · ${evaluation.targetCompany}` : ''} <span>{evaluation.source === 'local' ? 'HEURISTIC' : 'AI-ASSISTED'}</span></div></div>
    <div className="score-feedback panel"><div className="section-kicker">THREE WAYS TO READ THE ROUND</div><div className="feedback-scores">{scores.map(([label, value], index) => <div className="feedback-score" key={label} data-testid={`score-${index}`}><div className="score-meter"><span style={{ width: `${value}%` }} /></div><div><strong>{value}<small>/100</small></strong><span>{label}</span></div></div>)}</div></div>
    <div className="concept-grid">
      <ConceptCard title="What came through" items={evaluation.conceptsCovered} good testId="list-concepts-covered" />
      <ConceptCard title="Worth bringing in next time" items={evaluation.missedConcepts} testId="list-concepts-missed" />
    </div>
    <section className="tips-panel panel"><div className="section-kicker">PRACTICAL THINGS TO TRY</div><h2>Keep these in your back pocket.</h2><ol>{evaluation.tips.map((tip, index) => <li key={index}><span>0{index + 1}</span>{tip}</li>)}</ol><button className="next-button retry-interview" onClick={onRetry} data-testid="button-retry-interview"><RotateCcw size={15} /> Practice again</button></section>
  </section>;
}

function ConceptCard({ title, items, good, testId }: { title: string; items: string[]; good?: boolean; testId: string }) {
  return <section className={`concept-card panel ${good ? 'good' : ''}`} data-testid={testId}><span className="concept-icon">{good ? <Check size={15} /> : <ArrowRight size={15} />}</span><h3>{title}</h3>{items.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="concept-empty">Nothing specific to add here yet. That’s okay—use the tips below for a next try.</p>}</section>;
}

function Router() {
  return <Switch><Route path="/"><Home /></Route><Route path="/interview"><Interview /></Route><Route><NotFound /></Route></Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><ErrorBoundary><AppShell><Router /></AppShell></ErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
