import { useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  getAnalyzeSkillTwinMutationKey,
  useAnalyzeSkillTwin,
  useHealthCheck,
} from '@workspace/api-client-react';
import type { SkillName, SkillTwinAnalysis } from '@workspace/api-client-react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileText,
  Gauge,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const skills: SkillName[] = ['Python', 'SQL', 'Excel', 'Statistics', 'Communication'];
  const [targetRole, setTargetRole] = useState('Data Analyst');
  const [resumeText, setResumeText] = useState('');
  const [levels, setLevels] = useState<Record<SkillName, number>>({
    Python: 42,
    SQL: 58,
    Excel: 72,
    Statistics: 38,
    Communication: 66,
  });
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [analysis, setAnalysis] = useState<SkillTwinAnalysis | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const health = useHealthCheck();
  const analyze = useAnalyzeSkillTwin({
    mutation: { mutationKey: getAnalyzeSkillTwinMutationKey() },
  });

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileError('');
    if (!/\.(txt|md|rtf|csv)$/i.test(file.name) && !file.type.startsWith('text/')) {
      setFileError('Please choose a text-based resume (.txt, .md, .rtf or .csv).');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFileError('This file is larger than 2 MB. Paste a shorter version instead.');
      event.target.value = '';
      return;
    }
    try {
      const contents = await file.text();
      setResumeText(contents.slice(0, 16000));
      setFileName(file.name);
    } catch {
      setFileError('We could not read that file. Try pasting the resume text instead.');
    }
    event.target.value = '';
  };

  const submitAnalysis = () => {
    setFileError('');
    analyze.mutate(
      {
        data: {
          targetRole,
          ...(resumeText.trim() ? { resumeText: resumeText.trim() } : {}),
          skills: skills.map((skill) => ({ skill, current: levels[skill] })),
        },
      },
      { onSuccess: (result) => setAnalysis(result) },
    );
  };

  const resetAnalysis = () => {
    setAnalysis(null);
    analyze.reset();
  };

  const apiError = analyze.error as (Error & { error?: string; response?: { data?: { error?: string } } }) | null;
  const errorText = apiError?.response?.data?.error || apiError?.error || apiError?.message || '';
  const isProviderError = /openrouter|api.?key|provider|model/i.test(errorText);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="/" className="brand-lockup" aria-label="SkillTwin home">
          <span className="brand-mark"><Activity size={19} strokeWidth={2.5} /></span>
          <span>skill<span className="brand-light">twin</span></span>
        </a>
        <div className="side-label">YOUR WORKSPACE</div>
        <div className="nav-current"><span className="nav-icon"><Gauge size={17} /></span><span>Readiness lab</span><span className="nav-dot" /></div>
        <div className="side-note">
          <span className="note-orbit"><Sparkles size={17} /></span>
          <p>Know where you stand.<br /><strong>Make your next move.</strong></p>
        </div>
        <div className="sidebar-bottom">
          <div className="health-indicator">
            <span className={`health-dot ${health.isError ? 'offline' : ''}`} />
          <span>{health.isLoading ? 'Connecting to service' : health.isError ? 'Service unavailable' : 'API connected'}</span>
          </div>
          <div className="sidebar-foot">SKILLTWIN <span>•</span> CAREER INTELLIGENCE</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="crumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>Readiness lab</strong></div>
          <div className="topbar-right">
            <span className="live-status"><span className={`health-dot ${health.isError ? 'offline' : ''}`} />{health.isError ? 'API offline' : 'API online'}</span>
            <div className="user-avatar">ST</div>
          </div>
        </header>

        <div className="content-wrap">
          <section className="intro-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" />YOUR CAREER, IN FOCUS</div>
              <h1>Build your <em>next</em><br className="mobile-break" /> move.</h1>
              <p className="intro-copy">A clearer picture of your skills today—and a practical route to where you want to be.</p>
            </div>
            <div className="intro-stamp">
              <span className="stamp-label">CAREER<br />READINESS</span>
              <div className="stamp-graphic"><div className="stamp-ring"><div /></div><ArrowDown size={15} /></div>
              <span className="stamp-caption">MAPPED TO YOU</span>
            </div>
          </section>

          <div className="workspace-grid">
            <section className="setup-panel panel">
              <div className="panel-heading">
                <div className="heading-index">01</div>
                <div><div className="section-kicker">START WITH YOU</div><h2>Your starting point</h2></div>
                {analysis && <button className="text-action" onClick={resetAnalysis} data-testid="button-edit-profile"><RotateCcw size={14} /> Edit inputs</button>}
              </div>

              <div className="form-section role-section">
                <label className="field-label" htmlFor="role-select">Target role <span className="field-sub">CHOOSE YOUR DIRECTION</span></label>
                <div className="select-wrap">
                  <select id="role-select" value={targetRole} onChange={(e) => { setTargetRole(e.target.value); if (analysis) setAnalysis(null); }} data-testid="select-target-role">
                    <option>Data Analyst</option><option>Software Engineer</option><option>Product Manager</option>
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>

              <div className="form-section resume-section">
                <div className="label-row"><label className="field-label" htmlFor="resume-text">Resume <span className="optional-label">OPTIONAL, BUT USEFUL</span></label><span className="char-count">{resumeText.length.toLocaleString()} / 16,000</span></div>
                <textarea id="resume-text" value={resumeText} onChange={(e) => { setResumeText(e.target.value.slice(0, 16000)); setFileName(''); }} placeholder="Paste your resume text here. We’ll use it to make your analysis more specific." data-testid="input-resume-text" />
                <div className="resume-tools">
                  <button type="button" className="upload-button" onClick={() => fileInput.current?.click()} data-testid="button-upload-resume"><Upload size={14} /> Upload a text file</button>
                  <input ref={fileInput} type="file" accept=".txt,.md,.rtf,.csv,text/*" onChange={onFileChange} hidden data-testid="input-resume-file" />
                  <span className="file-hint">{fileName ? <><FileText size={13} /> {fileName} <button className="remove-file" onClick={() => { setFileName(''); setResumeText(''); }} aria-label="Remove uploaded resume" data-testid="button-remove-resume"><X size={13} /></button></> : 'Text files up to 2 MB'}</span>
                </div>
                {(fileError || analyze.isError) && <div className="error-callout" role="alert" data-testid="status-analysis-error"><CircleAlert size={16} /><div><strong>{fileError || (isProviderError ? 'AI provider needs attention' : 'Analysis couldn’t be completed')}</strong><span>{fileError || (isProviderError ? `${errorText} Check that the OpenRouter API key and model are configured on the server, then try again.` : errorText || 'Please try again in a moment.')}</span></div><button onClick={() => { setFileError(''); analyze.reset(); }} aria-label="Dismiss error" data-testid="button-dismiss-error"><X size={15} /></button></div>}
              </div>

              <div className="form-section skill-section">
                <div className="label-row"><div><div className="field-label">Your skills <span className="field-sub">SELF-ASSESSMENT</span></div><p className="skill-intro">Move each marker to match your current confidence.</p></div><span className="scale-note">0 — 100%</span></div>
                <div className="skill-input-list">
                  {skills.map((skill, index) => (
                    <div className="skill-input-row" key={skill}>
                      <div className="skill-name"><span className={`skill-index skill-index-${index}`}>{String(index + 1).padStart(2, '0')}</span>{skill}</div>
                      <div className="range-control"><input type="range" min="0" max="100" value={levels[skill]} style={{ '--range-value': `${levels[skill]}%` } as CSSProperties} aria-label={`${skill} level`} onChange={(e) => setLevels((current) => ({ ...current, [skill]: Number(e.target.value) }))} data-testid={`input-skill-${skill.toLowerCase()}`} /><span className="range-value">{levels[skill]}<small>%</small></span></div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="analyze-button" onClick={submitAnalysis} disabled={analyze.isPending} data-testid="button-analyze">
                {analyze.isPending ? <><LoaderCircle className="spin" size={17} /> Reading your profile</> : <><Sparkles size={16} /> Generate my analysis <ArrowRight size={17} /></>}
              </button>
              <p className="privacy-note"><span className="privacy-dot" /> Your resume is used only to generate this analysis.</p>
            </section>

            <section className={`results-column ${analyze.isPending ? 'is-analyzing' : ''}`}>
              {analyze.isPending ? (
                <div className="loading-panel panel" data-testid="status-analyzing">
                  <div className="loading-rings"><span /><span /><span /><Sparkles size={20} /></div>
                  <div className="eyebrow">PROFILE IN PROGRESS</div><h2>Connecting the dots.</h2><p>Comparing your experience with what {targetRole}s really need.</p>
                  <div className="loading-steps"><span className="step-done"><Check size={13} /> Reading your inputs</span><span className="step-active"><i /> Mapping role requirements</span><span><i /> Building your 90-day route</span></div>
                </div>
              ) : analysis ? (
                <AnalysisResults analysis={analysis} onReanalyze={submitAnalysis} busy={analyze.isPending} />
              ) : (
                <div className="empty-results panel" data-testid="status-idle">
                  <div className="empty-visual">
                    <div className="empty-orbit orbit-one" /><div className="empty-orbit orbit-two" />
                    <div className="empty-core"><BarChart3 size={27} /></div>
                    <span className="orbit-node node-a" /><span className="orbit-node node-b" /><span className="orbit-node node-c" />
                    <span className="orbit-label label-a">YOU</span><span className="orbit-label label-b">ROLE</span><span className="orbit-label label-c">GAP</span>
                  </div>
                  <div className="eyebrow">YOUR PERSONAL READINESS MAP</div>
                  <h2>Good moves start<br />with a clear view.</h2>
                  <p>Choose a role, tell us where your skills are, and we’ll map a grounded path from here to there.</p>
                  <div className="empty-divider" />
                  <div className="empty-foot"><span>01 <b>Set your baseline</b></span><ArrowRight size={14} /><span>02 <b>See the gaps</b></span><ArrowRight size={14} /><span>03 <b>Make your plan</b></span></div>
                </div>
              )}
              <div className="results-footnote"><span>BUILT FOR THE WORK AHEAD</span><span>SKILLTWIN / 01</span></div>
            </section>
          </div>
          <footer className="page-footer"><span>Make progress visible.</span><span>SkillTwin <i>—</i> Your next chapter, measured.</span></footer>
        </div>
      </main>
      </div>
  );
}

function AnalysisResults({ analysis, onReanalyze, busy }: { analysis: SkillTwinAnalysis; onReanalyze: () => void; busy: boolean }) {
  return (
    <div className="analysis-stack" data-testid="status-analysis-results">
      <section className="score-card panel">
        <div className="score-topline"><span className="eyebrow"><span className="eyebrow-line" />READINESS SNAPSHOT</span><button className="icon-button" title="Run analysis again" onClick={onReanalyze} disabled={busy} data-testid="button-rerun-analysis"><RotateCcw size={15} /></button></div>
        <div className="score-layout">
        <div className="score-ring" style={{ '--score': `${analysis.readiness * 3.6}deg` } as CSSProperties}><div><strong>{analysis.readiness}</strong><span>OUT OF 100</span></div></div>
          <div className="score-copy"><div className="role-chip"><span /> {analysis.targetRole}</div><h2>You’re <em>{100 - analysis.readiness}% away.</em></h2><p>{analysis.summary}</p></div>
        </div>
        <div className="score-bottom"><span><span className="tiny-dot" /> ANALYSIS COMPLETE</span><span>PERSONALIZED FOR YOUR NEXT STEP</span></div>
      </section>
      {analysis.source === 'local' && (
        <div className="local-estimate-notice" role="status" data-testid="status-local-estimate">
          <CircleAlert size={15} />
          <span>AI couldn’t respond this time. This locally calculated estimate is a practical starting point.</span>
        </div>
      )}

      <section className="gaps-card panel">
        <div className="section-head"><div><div className="section-kicker">THE DISTANCE, MADE VISIBLE</div><h2>Skill alignment</h2></div><span className="bar-legend"><i className="legend-current" /> YOU <i className="legend-required" /> ROLE</span></div>
        <div className="gap-list">
          {analysis.gaps.map((gap, index) => (
            <div className="gap-item" key={gap.skill} data-testid={`row-skill-gap-${gap.skill.toLowerCase()}`}>
              <div className="gap-meta"><strong>{gap.skill}</strong><span>{gap.current}% <i>current</i><b>·</b> {gap.required}% <i>target</i></span></div>
              <div className="gap-track"><span className="required-track" style={{ width: `${gap.required}%` }} /><span className={`current-track current-tone-${index % 4}`} style={{ width: `${gap.current}%` }} /></div>
              <p>{gap.rationale}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="roadmap-section">
        <div className="roadmap-heading"><div><div className="section-kicker">YOUR NEXT 90 DAYS</div><h2>A plan with a point of view.</h2></div><span className="roadmap-mark"><Clock3 size={16} /> 3 PHASES</span></div>
        <div className="roadmap-list">
          {analysis.roadmap.map((phase, index) => (
            <article className="phase-card panel" key={phase.phase} data-testid={`card-roadmap-${phase.phase.replace(/\s/g, '-')}`}>
              <div className="phase-marker"><span>0{index + 1}</span><i /></div>
              <div className="phase-main">
                <div className="phase-top"><span className={`phase-pill phase-${index}`}>{phase.phase}</span><span className="phase-title">{phase.title}</span></div>
                <p className="phase-focus">{phase.focus}</p>
                <div className="action-list">
                  {phase.actions.map((action, actionIndex) => (
                    <div className="action-row" key={`${action.title}-${actionIndex}`}>
                      <span className="action-check"><Check size={12} /></span><div className="action-copy"><strong>{action.title}</strong><p>{action.description}</p><span className="action-skill">{action.skill}</span></div>
                      <span className={`effort effort-${action.effort}`}>{action.effort} effort</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
