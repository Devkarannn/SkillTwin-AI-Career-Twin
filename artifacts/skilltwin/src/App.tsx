import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  // Onboarding & Profile State
  const [userName, setUserName] = useState('');
  const [tempName, setTempName] = useState('');

  // Navigation State
  const [activeTab, tabSet] = useState('matrix');

  // --- TAB 1: SKILL MATRIX & RESUME ANALYZER STATE ---
  const [targetRole, setTargetRole] = useState('');
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const availableRoles = [
    'Software Engineer',
    'Data Analyst',
    'Lawyer',
    'Product Manager',
    'Accountant',
    'Doctor',
    'Marketing Manager',
    'UI/UX Designer',
    'Financial Analyst',
    'Cybersecurity Specialist',
    'DevOps Engineer',
    'AI Research Scientist',
    'Investment Banker',
    'Management Consultant'
  ];

  const filteredRoles = availableRoles.filter(role => 
    role.toLowerCase().includes(targetRole.toLowerCase())
  );

  const roleCompetencies = {
    'software engineer': ['Core Coding & Algorithms', 'System Design & Scalability', 'API & Database Architecture', 'Version Control, CI/CD & Testing'],
    'data analyst': ['Python/R & Libraries (Pandas/NumPy)', 'Machine Learning Modeling & Evaluation', 'SQL & Advanced Data Wrangling', 'Statistical Inference & A/B Testing'],
    'product manager': ['Product Roadmap & Strategic Vision', 'User Research & Quantitative Metrics', 'Agile/Scrum Methodologies', 'Cross-Functional Stakeholder Management'],
    'lawyer': ['Advanced Legal Research & Briefs', 'Litigation & Court Advocacy', 'Contract Drafting & Negotiation', 'Regulatory Compliance & Risk Assessment'],
    'accountant': ['Financial Reporting & GAAP/IFRS', 'Auditing, Taxation & Internal Controls', 'Budgeting, Forecasting & Variance', 'Excel Modeling & ERP Reconciliation'],
    'doctor': ['Clinical Diagnosis & Patient Care', 'Medical Ethics, Safety & Compliance', 'Anatomy, Physiology & Pharmacology', 'Emergency Response & Triage'],
    'marketing manager': ['Campaign Strategy & ROI Attribution', 'SEO, SEM & Digital Analytics', 'Content Architecture & Branding', 'Growth Hacking & Funnel Optimization'],
    'ui/ux designer': ['Wireframing, Prototyping & User Flows', 'Figma & Scalable Design Systems', 'User Usability Testing & Research', 'Accessibility Standards (WCAG)'],
    'financial analyst': ['Advanced Financial Modeling', 'Valuation & DCF Forecasting', 'Variance Analysis & Budgeting', 'Portfolio Management & Risk Analysis']
  };

  const getKeywordsForRole = (role) => {
    const lower = role.toLowerCase();
    for (const key in roleCompetencies) {
      if (lower.includes(key)) {
        return roleCompetencies[key].map(c => c.toLowerCase());
      }
    }
    return ['communication', 'analysis', 'execution', 'strategy', 'problem solving', 'leadership', 'management'];
  };

  // --- ADVANCED RESUME AI GAP & DEFICIT ANALYSIS ---
  const analyzeResume = () => {
    if (!resumeText.trim() || !targetRole.trim()) {
      setAnalysisResult(null);
      return;
    }

    const textLower = resumeText.toLowerCase();
    const keywords = getKeywordsForRole(targetRole);
    const matched = keywords.filter(kw => textLower.includes(kw.split(' ')[0]));
    const missing = keywords.filter(kw => !textLower.includes(kw.split(' ')[0]));

    const keywordScore = (matched.length / Math.max(keywords.length, 1)) * 40;
    const lengthScore = Math.min(resumeText.split(' ').length / 80, 1) * 30;
    const actionWords = ['achieved', 'improved', 'built', 'led', 'optimized', 'designed', 'managed', 'created', 'resolved', 'negotiated', 'audited', 'spearheaded'];
    const hasActionWords = actionWords.some(w => textLower.includes(w));
    const impactScore = hasActionWords ? 30 : 10;

    const totalScore = Math.round(keywordScore + lengthScore + impactScore);

    let detailedTip = "";
    if (totalScore > 80) {
      detailedTip = `Elite resume alignment for ${targetRole}! Your text seamlessly integrates mandatory domain keywords, professional credentials, and structured impact metrics.`;
    } else if (totalScore > 50) {
      detailedTip = `Moderate alignment detected. While you possess foundational domain vocabulary, your resume lacks robust action verbs and explicit quantifiable impact.`;
    } else {
      detailedTip = `Substantial optimization required for ${targetRole}. Current keyword density and structural impact are below standard thresholds.`;
    }

    const technicalGaps = missing.length > 0 
      ? missing.map(m => `Lack of demonstrated hands-on project experience or verifiable proficiency in "${m}".`)
      : ['No critical domain core competency gaps detected.'];

    const metricGaps = hasActionWords 
      ? ['Action verbs are present, but project descriptions require sharper numerical metrics (e.g., percentage growth, cost reduction, scale).']
      : ['Severe lack of quantifiable metrics and strong executive action verbs across your work history.'];

    const executionGaps = [
      `Your resume does not clearly showcase end-to-end ownership of complex ${targetRole} workflows or strategic initiatives.`,
      `Missing explicit mention of modern tooling, frameworks, or methodologies expected for senior-tier ${targetRole} positions.`
    ];

    const suggestions = missing.map(m => `Add a quantified achievement demonstrating experience in "${m}" using action verbs like Spearheaded, Engineered, or Optimized.`);

    setAnalysisResult({
      score: totalScore,
      matched,
      missing,
      aiGaps: { technicalGaps, metricGaps, executionGaps },
      recommendation: detailedTip,
      suggestions
    });
  };

  useEffect(() => {
    analyzeResume();
  }, [targetRole, resumeText]);

  // --- ADAPTIVE VOICE INTERVIEW SIMULATOR STATE ---
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const recognitionRef = useRef(null);

  const initialQuestionsBank = {
    'software engineer': "Walk me through a complex technical architecture or system design decision you made under tight constraints, detailing trade-offs and scalability metrics.",
    'lawyer': "Explain a complex legal precedent, contract liability clause, or statutory interpretation you had to research and brief under extreme time pressure.",
    'data analyst': "Walk me through how you handle missing, corrupted, or heavily skewed datasets during exploratory data analysis (EDA).",
    'default': `Tell me about a time you faced a complex professional challenge as a ${targetRole || 'professional'} under a strict deadline and how you structured your execution.`
  };

  const getInitialQuestionForRole = (role) => {
    const lower = role.toLowerCase();
    for (const key in initialQuestionsBank) {
      if (lower.includes(key) && key !== 'default') {
        return initialQuestionsBank[key];
      }
    }
    return initialQuestionsBank['default'];
  };

  // --- LIVE SPEECH RECOGNITION SETUP ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        setTranscript(fullTranscript);
      };
    }
  }, []);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startInterview = () => {
    if (!targetRole.trim()) {
      alert("Please specify a target role first!");
      return;
    }
    setInterviewStarted(true);
    setCurrentQuestionIndex(0);
    setFeedbackHistory([]);
    setInterviewComplete(false);
    setTranscript('');
    const firstQ = getInitialQuestionForRole(targetRole);
    setCurrentQuestion(firstQ);
    speakText(firstQ);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // --- PRACTICAL NON-REPEATING ADAPTIVE FOLLOW-UP GENERATOR ---
  const generateAdaptiveFollowUp = (lastAnswer, questionNum, role) => {
    const lowerAnswer = lastAnswer.toLowerCase();
    const wordCount = lastAnswer.split(/\s+/).filter(Boolean).length;

    if (questionNum >= 4) {
      return null; 
    }

    const pivotQuestionPool = [
      `That's a fair admission. When faced with an unfamiliar concept or gap in ${role}, what is your systematic approach to getting up to speed quickly?`,
      `No worries at all. Let's shift gears: how do you usually handle tight deadlines or ambiguous project requirements when working as a ${role}?`,
      `Understood. Let's explore a different angle for ${role}: can you describe how you collaborate with cross-functional peers or stakeholders to resolve unexpected blockers?`,
      `That happens in real-world environments. For our next focus area in ${role}, how do you prioritize tasks when multiple critical issues arise simultaneously?`
    ];

    const shortAnswerPool = [
      `Your previous answer was quite brief. Can you provide a specific concrete scenario or workflow example related to ${role}?`,
      `Let's expand on that: what core metrics or success indicators do you track when executing this responsibility in ${role}?`,
      `Building on your previous point, what specific trade-offs or risks do you evaluate in this scenario?`
    ];

    const standardPool = [
      `Fascinating point on that approach. What specific challenges or edge cases usually arise when executing this for ${role}?`,
      `That gives good context. For our next deep-dive in ${role}, how do you handle stakeholder pushback or unexpected operational blockers?`,
      `Appreciate the insights. How do you measure the long-term impact or ROI of your decisions in this domain?`
    ];

    const lacksKnowledge = ['don\'t know', 'do not know', 'not sure', 'no idea', 'sorry', 'pass', 'unfamiliar', 'never heard'].some(phrase => lowerAnswer.includes(phrase));

    if (lacksKnowledge) {
      return pivotQuestionPool[(questionNum - 1) % pivotQuestionPool.length];
    } else if (wordCount < 15) {
      return shortAnswerPool[(questionNum - 1) % shortAnswerPool.length];
    } else {
      return standardPool[(questionNum - 1) % standardPool.length];
    }
  };

  const submitAnswer = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const lowerAnswer = transcript.toLowerCase();
    const lacksKnowledge = ['don\'t know', 'do not know', 'not sure', 'no idea', 'sorry', 'pass', 'unfamiliar'].some(phrase => lowerAnswer.includes(phrase));
    const hasRecovery = lowerAnswer.includes('research') || lowerAnswer.includes('learn') || lowerAnswer.includes('look up') || lowerAnswer.includes('typically') || lowerAnswer.includes('approach');
    const wordCount = transcript.split(/\s+/).filter(Boolean).length;

    let score = 50;
    if (lacksKnowledge) {
      score = hasRecovery ? 65 : 30;
    } else {
      score = Math.min(Math.round((wordCount / 40) * 100), 100);
      if (score < 40 && wordCount > 5) score = 65;
      if (wordCount === 0) score = 15;
    }

    const feedbackItem = {
      question: currentQuestion,
      answer: transcript || "(No spoken response recorded)",
      score,
      critique: lacksKnowledge 
        ? (hasRecovery 
            ? "Good recovery! Admitting unfamiliarity while outlining your problem-solving or research framework is a strong professional interview strategy."
            : "A flat 'I don't know' leaves a weak impression. In real interviews, always pair a knowledge gap with your practical strategy for rapidly learning and researching the solution.")
        : score > 75 
        ? "Exceptional depth, structured articulation, and clear metrics demonstrated." 
        : score > 45 
        ? "Solid foundational response, but could benefit from sharper STAR methodology and quantitative proof." 
        : "Incomplete answer or insufficient detail. Ensure you address the core technical challenge directly."
    };

    const updatedHistory = [...feedbackHistory, feedbackItem];
    setFeedbackHistory(updatedHistory);
    setTranscript('');

    const nextQ = generateAdaptiveFollowUp(transcript, currentQuestionIndex + 1, targetRole);

    if (nextQ && currentQuestionIndex < 3) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentQuestion(nextQ);
      speakText(nextQ);
    } else {
      setInterviewComplete(true);
      speakText("Adaptive interview simulation complete. Review your comprehensive performance analytics below.");
    }
  };

  const theme = {
    bg: '#090d16',
    cardBg: 'rgba(30, 41, 59, 0.7)',
    cardBorder: 'rgba(51, 65, 85, 0.8)',
    textMain: '#f8fafc',
    textMuted: '#94a3b8',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    accent: '#8b5cf6'
  };

  // --- ATTRACTIVE ONBOARDING SCREEN (Placeholder removed) ---
  if (!userName) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 60%, #090d16 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        fontFamily: 'Inter, system-ui, sans-serif', 
        padding: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient background glow circles */}
        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '300px', height: '300px', background: 'rgba(59, 130, 246, 0.12)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '15%', right: '15%', width: '350px', height: '350px', background: 'rgba(139, 92, 246, 0.12)', borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none' }}></div>

        <div style={{ 
          background: 'rgba(15, 23, 42, 0.8)', 
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '24px', 
          padding: '48px 40px', 
          maxWidth: '460px', 
          width: '100%', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '64px', 
              height: '64px', 
              borderRadius: '20px', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', 
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
              marginBottom: '20px',
              fontSize: '28px'
            }}>
              ⚡
            </div>
            <div style={{ 
              display: 'inline-block', 
              padding: '4px 12px', 
              borderRadius: '20px', 
              background: 'rgba(59, 130, 246, 0.1)', 
              color: '#60a5fa', 
              fontSize: '12px', 
              fontWeight: '700', 
              letterSpacing: '1px', 
              textTransform: 'uppercase',
              marginBottom: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              Potentia Intelligence
            </div>
            <h1 style={{ color: '#f8fafc', fontSize: '28px', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Welcome to Potentia</h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>Your AI-powered career accelerator, resume diagnostic suite, and live interview coach.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '12px', fontWeight: '700', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>What is your full name?</label>
            <input 
              type="text" 
              value={tempName} 
              onChange={(e) => setTempName(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && tempName.trim() && setUserName(tempName.trim())}
              style={{ 
                width: '100%', 
                padding: '14px 18px', 
                background: 'rgba(15, 23, 42, 0.9)', 
                border: '1px solid rgba(255, 255, 255, 0.12)', 
                borderRadius: '12px', 
                color: '#f8fafc', 
                fontSize: '15px', 
                outline: 'none', 
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
            />
          </div>

          <button 
            onClick={() => tempName.trim() && setUserName(tempName.trim())}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '15px', 
              fontWeight: '600', 
              cursor: 'pointer', 
              boxShadow: '0 10px 20px -5px rgba(59, 130, 246, 0.5)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Launch Assessment Console 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.textMain, fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box' }}>
      <header style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.cardBorder}`, padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Potentia Career Intelligence & Placement Suite</h1>
            <span style={{ fontSize: '12px', color: theme.textMuted }}>Active User: <strong style={{ color: theme.textMain }}>{userName}</strong></span>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '6px', background: '#0f172a', padding: '4px', borderRadius: '10px', border: `1px solid ${theme.cardBorder}`, flexWrap: 'wrap' }}>
          {[
            { id: 'matrix', label: '1. Skill Matrix' },
            { id: 'interview', label: '2. Live Adaptive Interview' },
            { id: 'analytics', label: '3. Placement Metrics' },
            { id: 'evidence', label: '4. Student Evidence' },
            { id: 'plan90', label: '5. 90 Days Plan' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => tabSet(tab.id)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: activeTab === tab.id ? theme.primary : 'transparent', color: activeTab === tab.id ? '#ffffff' : theme.textMuted, fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 20px' }}>

        {/* ================= TAB 1: SKILL MATRIX & RESUME ANALYZER ================= */}
        {activeTab === 'matrix' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Resume & AI Competency Diagnostic Matrix</h2>
              <p style={{ color: theme.textMuted, fontSize: '14px', margin: 0 }}>Type your target role and paste your resume to receive an exhaustive AI-powered breakdown of what you lack.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '24px', position: 'relative' }}>
                <div style={{ marginBottom: '20px', position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: theme.textMuted }}>TARGET JOB ROLE</label>
                  <input 
                    type="text" 
                    value={targetRole}
                    onChange={(e) => {
                      setTargetRole(e.target.value);
                      setShowRoleSuggestions(true);
                    }}
                    onFocus={() => setShowRoleSuggestions(true)}
                    placeholder="Type target role..." 
                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: `1px solid ${theme.cardBorder}`, borderRadius: '8px', color: theme.textMain, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />

                  {showRoleSuggestions && targetRole.trim() && filteredRoles.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0f172a', border: `1px solid ${theme.cardBorder}`, borderRadius: '8px', marginTop: '4px', zIndex: 50, maxHeight: '180px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
                      {filteredRoles.map((role, idx) => (
                        <div 
                          key={idx}
                          onClick={() => {
                            setTargetRole(role);
                            setShowRoleSuggestions(false);
                          }}
                          style={{ padding: '10px 14px', fontSize: '13px', color: theme.textMain, cursor: 'pointer', borderBottom: `1px solid ${theme.cardBorder}`, transition: 'background 0.1s' }}
                          onMouseEnter={(e) => e.target.style.background = '#1e293b'}
                          onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                          🔍 Suggestion: <strong style={{ color: theme.primary }}>{role}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: theme.textMuted }}>RESUME TEXT CONTENT</label>
                  <textarea 
                    rows={12}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste or type resume text here..."
                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: `1px solid ${theme.cardBorder}`, borderRadius: '8px', color: theme.textMain, fontSize: '13px', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Right Column: AI Audit & What You Lack */}
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>AI Deficit & Gap Analysis</span>
                  {analysisResult && (
                    <span style={{ padding: '4px 12px', borderRadius: '20px', background: analysisResult.score >= 75 ? '#065f46' : analysisResult.score >= 50 ? '#92400e' : '#991b1b', color: '#fff', fontSize: '14px' }}>
                      Score: {analysisResult.score}/100
                    </span>
                  )}
                </h3>

                {analysisResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '13px', color: theme.textMuted, margin: '0 0 8px 0', textTransform: 'uppercase' }}>Overall Assessment</h4>
                      <p style={{ fontSize: '14px', lineHeight: '1.6', background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, margin: 0 }}>
                        {analysisResult.recommendation}
                      </p>
                    </div>

                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <h4 style={{ fontSize: '13px', color: theme.danger, margin: '0 0 12px 0', textTransform: 'uppercase' }}>⚠️ What You Lack (AI Resume Audit)</h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                        <div>
                          <strong style={{ color: theme.textMain }}>Technical & Competency Gaps:</strong>
                          <ul style={{ margin: '4px 0 0 16px', padding: 0, color: theme.textMuted }}>
                            {analysisResult.aiGaps.technicalGaps.map((g, i) => <li key={i}>{g}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong style={{ color: theme.textMain }}>Quantifiable Metric Gaps:</strong>
                          <ul style={{ margin: '4px 0 0 16px', padding: 0, color: theme.textMuted }}>
                            {analysisResult.aiGaps.metricGaps.map((g, i) => <li key={i}>{g}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong style={{ color: theme.textMain }}>Workflow & Execution Gaps:</strong>
                          <ul style={{ margin: '4px 0 0 16px', padding: 0, color: theme.textMuted }}>
                            {analysisResult.aiGaps.executionGaps.map((g, i) => <li key={i}>{g}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '13px', color: theme.primary, margin: '0 0 8px 0', textTransform: 'uppercase' }}>Targeted Action Suggestions</h4>
                      <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: theme.textMain, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {analysisResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
                    <p>Enter a target role and paste your resume text to generate a deep AI deficit evaluation and remediation plan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LIVE ADAPTIVE VOICE INTERVIEW SIMULATOR ================= */}
        {activeTab === 'interview' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Live Adaptive Voice Interview Simulator ({targetRole || 'General Role'})</h2>
              <p style={{ color: theme.textMuted, fontSize: '14px', margin: 0 }}>Speak naturally with live transcript rendering. The AI listens to your answer and adapts subsequent questions in real-time.</p>
            </div>

            {!interviewStarted ? (
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
                <h3 style={{ fontSize: '20px', margin: '0 0 12px 0' }}>Ready for your live adaptive interview for {targetRole || 'your target role'}?</h3>
                <p style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '24px' }}>Questions will dynamically evolve based on your spoken answers.</p>
                <button 
                  onClick={startInterview}
                  style={{ padding: '12px 28px', background: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Start Live Voice Interview
                </button>
              </div>
            ) : !interviewComplete ? (
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', color: theme.textMuted }}>
                  <span>Adaptive Round {currentQuestionIndex + 1} of 4</span>
                  <span>Role: {targetRole}</span>
                </div>

                <div style={{ background: '#0f172a', padding: '20px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '16px', color: theme.textMain, margin: 0, lineHeight: '1.5' }}>
                    🤖 <strong>AI Interviewer:</strong> {currentQuestion}
                  </h4>
                  <button 
                    onClick={() => speakText(currentQuestion)}
                    style={{ marginTop: '12px', background: 'transparent', border: `1px solid ${theme.cardBorder}`, color: theme.primary, padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🔊 Repeat Question Audio
                  </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textMuted }}>LIVE SPOKEN TRANSCRIPT (Speak into microphone)</label>
                    {isListening && (
                      <span style={{ fontSize: '12px', color: theme.success, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.success, display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                        Listening live...
                      </span>
                    )}
                  </div>
                  <textarea 
                    rows={6}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Live speech transcript will appear here automatically as you talk..."
                    style={{ width: '100%', padding: '12px', background: '#0f172a', border: `1px solid ${isListening ? theme.success : theme.cardBorder}`, borderRadius: '8px', color: theme.textMain, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={toggleListening}
                    style={{ padding: '10px 20px', background: isListening ? theme.danger : theme.accent, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {isListening ? '⏹ Stop Recording' : '🎤 Start Live Speech Recognition'}
                  </button>

                  <button 
                    onClick={submitAnswer}
                    style={{ padding: '10px 24px', background: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Submit Answer & Get Adaptive Follow-up
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
                <h3 style={{ fontSize: '22px', margin: '0 0 8px 0', color: theme.success }}>Adaptive Interview Completed Successfully!</h3>
                <p style={{ color: theme.textMuted, fontSize: '14px', marginBottom: '24px' }}>Review your adaptive conversation session and response scoring below:</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  {feedbackHistory.map((item, idx) => (
                    <div key={idx} style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '13px', color: theme.textMuted }}>Round {idx + 1}: {item.question}</strong>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: item.score > 70 ? theme.success : item.score >= 50 ? theme.warning : theme.danger }}>Score: {item.score}/100</span>
                      </div>
                      <p style={{ fontSize: '13px', fontStyle: 'italic', color: theme.textMuted, margin: '0 0 8px 0' }}>Your Response: "{item.answer}"</p>
                      <p style={{ fontSize: '13px', color: theme.textMain, margin: 0 }}><strong>AI Critique:</strong> {item.critique}</p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setInterviewStarted(false)}
                  style={{ padding: '12px 24px', background: theme.primary, color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Restart Adaptive Interview
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: PLACEMENT METRICS ================= */}
        {activeTab === 'analytics' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Resume-Based Placement Metrics</h2>
              <p style={{ color: theme.textMuted, fontSize: '14px', margin: 0 }}>Telemetry derived specifically from your typed resume and role.</p>
            </div>

            {!resumeText.trim() ? (
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '40px', textAlign: 'center', color: theme.textMuted }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ fontSize: '18px', color: theme.textMain, margin: '0 0 8px 0' }}>No Resume Data Provided Yet</h3>
                <p style={{ fontSize: '14px', margin: 0 }}>Please enter your target role and resume text in Tab 1 first to unlock customized placement metrics.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  {[
                    { label: 'Resume ATS Score', val: `${analysisResult ? analysisResult.score : 0}%`, change: 'Based on current text', color: theme.success },
                    { label: 'Target Role', val: targetRole || 'Unspecified', change: 'Manual Input', color: theme.primary },
                    { label: 'Deficits Identified', val: `${analysisResult ? analysisResult.aiGaps.technicalGaps.length : 0} Gaps`, change: 'AI Evaluated', color: theme.danger },
                    { label: 'Readiness Rating', val: (analysisResult && analysisResult.score > 75) ? 'High' : 'Moderate', change: 'Action-Item Verified', color: theme.warning }
                  ].map((stat, idx) => (
                    <div key={idx} style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '20px' }}>
                      <span style={{ fontSize: '13px', color: theme.textMuted, fontWeight: '600' }}>{stat.label}</span>
                      <div style={{ fontSize: '24px', fontWeight: '700', margin: '8px 0 4px 0', color: stat.color }}>{stat.val}</div>
                      <span style={{ fontSize: '12px', color: theme.textMuted }}>{stat.change}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 16px 0' }}>Resume Optimization Breakdown for "{targetRole}"</h3>
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, fontSize: '14px', lineHeight: '1.6' }}>
                    <p style={{ margin: '0 0 12px 0' }}><strong>Executive Summary:</strong> {analysisResult ? analysisResult.recommendation : 'Awaiting input...'}</p>
                    <p style={{ margin: 0, color: theme.textMuted }}>Total Word Count: {resumeText.split(/\s+/).filter(Boolean).length} words</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: STUDENT EVIDENCE PANEL ================= */}
        {activeTab === 'evidence' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Student Evidence & Resume Audit Panel</h2>
              <p style={{ color: theme.textMuted, fontSize: '14px', margin: 0 }}>Detailed empirical breakdown based strictly on your provided resume text.</p>
            </div>

            {!resumeText.trim() ? (
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '40px', textAlign: 'center', color: theme.textMuted }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ fontSize: '18px', color: theme.textMain, margin: '0 0 8px 0' }}>No Resume Data Provided Yet</h3>
                <p style={{ fontSize: '14px', margin: 0 }}>Please enter your target role and resume text in Tab 1 first to unlock the student evidence audit trail.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0', color: theme.primary }}>1. Target Role Deficit Audit: {targetRole}</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: theme.textMuted, margin: '0 0 16px 0' }}>
                    The audit below evaluates your typed resume text against required competencies for <strong style={{ color: theme.textMain }}>{targetRole}</strong>, isolating what you currently lack.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <h4 style={{ fontSize: '12px', color: theme.success, margin: '0 0 8px 0', textTransform: 'uppercase' }}>Present Strengths</h4>
                      {analysisResult && analysisResult.matched.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: theme.textMain }}>
                          {analysisResult.matched.map((m, i) => <li key={i} style={{ marginBottom: '4px' }}>{m}</li>)}
                        </ul>
                      ) : (
                        <span style={{ fontSize: '13px', color: theme.textMuted }}>None detected.</span>
                      )}
                    </div>
                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <h4 style={{ fontSize: '12px', color: theme.danger, margin: '0 0 8px 0', textTransform: 'uppercase' }}>What You Lack (Deficits)</h4>
                      {analysisResult && analysisResult.aiGaps.technicalGaps.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '13px', color: theme.textMain }}>
                          {analysisResult.aiGaps.technicalGaps.map((g, i) => <li key={i} style={{ marginBottom: '4px' }}>{g}</li>)}
                        </ul>
                      ) : (
                        <span style={{ fontSize: '13px', color: theme.success, fontWeight: '600' }}>No major competency deficits found!</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0', color: theme.primary }}>2. Raw Resume Source Text</h3>
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}`, fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', color: theme.textMuted, maxHeight: '200px', overflowY: 'auto' }}>
                    {resumeText}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 5: 90 DAYS PLAN ================= */}
        {activeTab === 'plan90' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Comprehensive 90-Day Master Execution Roadmap ({targetRole || 'Target Role'})</h2>
              <p style={{ color: theme.textMuted, fontSize: '14px', margin: 0 }}>Exhaustive multi-phase professional development and placement blueprint engineered around your resume deficits.</p>
            </div>

            {!resumeText.trim() ? (
              <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '40px', textAlign: 'center', color: theme.textMuted }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
                <h3 style={{ fontSize: '18px', color: theme.textMain, margin: '0 0 8px 0' }}>No Resume Data Provided Yet</h3>
                <p style={{ fontSize: '14px', margin: 0 }}>Please enter your target role and resume text in Tab 1 first to generate your custom 90-day plan.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* Executive Summary Banner */}
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px 0', color: theme.primary }}>Master Strategy Directive for {userName} ({targetRole})</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: theme.textMuted, margin: '0 0 16px 0' }}>
                    Your current resume evaluation yields an ATS baseline score of <strong style={{ color: theme.textMain }}>{analysisResult?.score}%</strong>. This 90-day master blueprint is structured into three rigorous 30-day operational blocks designed to eliminate technical deficits, build verifiable capstone deliverables, and master high-stakes behavioral and technical interviews.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
                    <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <span style={{ fontSize: '12px', color: theme.primary, fontWeight: '700', textTransform: 'uppercase' }}>Phase 1 (Days 1–30)</span>
                      <p style={{ fontSize: '13px', color: theme.textMain, margin: '6px 0 0 0' }}>Foundational Deficit Remediation & Core Tooling Mastery</p>
                    </div>
                    <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <span style={{ fontSize: '12px', color: theme.warning, fontWeight: '700', textTransform: 'uppercase' }}>Phase 2 (Days 31–60)</span>
                      <p style={{ fontSize: '13px', color: theme.textMain, margin: '6px 0 0 0' }}>Advanced Architectural Capstones & Metric Quantification</p>
                    </div>
                    <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <span style={{ fontSize: '12px', color: theme.success, fontWeight: '700', textTransform: 'uppercase' }}>Phase 3 (Days 61–90)</span>
                      <p style={{ fontSize: '13px', color: theme.textMain, margin: '6px 0 0 0' }}>Executive Interview Simulation & Placement Execution</p>
                    </div>
                  </div>
                </div>

                {/* MONTH 1 */}
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${theme.cardBorder}`, paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: theme.primary }}>Month 1: Foundational Skill Remediation & Gap Closure (Days 1–30)</h3>
                    <span style={{ fontSize: '13px', padding: '4px 12px', background: '#0f172a', borderRadius: '20px', border: `1px solid ${theme.cardBorder}` }}>Status: Active Sprint</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <h4 style={{ fontSize: '15px', color: theme.textMain, margin: '0 0 8px 0' }}>Week 1 (Days 1–7): Comprehensive Diagnostic & Core Competency Audit</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li><strong>Audit Review:</strong> Analyze current AI deficit feedback in Tab 1 and Tab 4 to pinpoint exact missing keywords and methodologies for {targetRole}.</li>
                        <li><strong>Environment Setup:</strong> Install and configure all necessary development environments, legal research tools, or analytical suites required for {targetRole}.</li>
                        <li><strong>Daily Routine:</strong> Dedicate 3 hours every morning to structured domain study and 2 hours every evening to hands-on tactical implementation.</li>
                      </ul>
                    </div>

                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <h4 style={{ fontSize: '15px', color: theme.textMain, margin: '0 0 8px 0' }}>Week 2 (Days 8–14): Resolving Technical & Structural Gaps</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li><strong>Targeted Skill Sprints:</strong> Focus heavily on items identified as missing in your resume audit (e.g., advanced algorithms, regulatory compliance frameworks, or predictive modeling).</li>
                        <li><strong>Documentation:</strong> Maintain a daily markdown log detailing solved technical obstacles and architectural decisions.</li>
                        <li><strong>Peer Review:</strong> Cross-reference your learning progress with industry benchmark standards for senior-tier positions.</li>
                      </ul>
                    </div>

                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <h4 style={{ fontSize: '15px', color: theme.textMain, margin: '0 0 8px 0' }}>Weeks 3–4 (Days 15–30): First Major Portfolio Artifact & Resume Overhaul</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li><strong>Project Initiation:</strong> Begin building a high-impact portfolio capstone project that directly targets your primary domain deficit.</li>
                        <li><strong>Resume Refactoring:</strong> Rewrite bullet points using strong action verbs (e.g., Spearheaded, Engineered, Optimized, Negotiated) and quantifiable metrics.</li>
                        <li><strong>Milestone Check:</strong> Elevate resume ATS score from current baseline to at least 70% alignment.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* MONTH 2 */}
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${theme.cardBorder}`, paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: theme.warning }}>Month 2: Advanced Capstone Execution & Quantifiable Metrics (Days 31–60)</h3>
                    <span style={{ fontSize: '13px', padding: '4px 12px', background: '#0f172a', borderRadius: '20px', border: `1px solid ${theme.cardBorder}` }}>Status: Planned Sprint</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <h4 style={{ fontSize: '15px', color: theme.textMain, margin: '0 0 8px 0' }}>Weeks 5–6 (Days 31–45): End-to-End Capstone Development for {targetRole}</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li><strong>Execution:</strong> Complete a comprehensive, production-grade project or case study relevant to {targetRole} (e.g., scalable distributed system, complex contractual dispute brief, or end-to-end predictive machine learning pipeline).</li>
                        <li><strong>Metric Embedding:</strong> Ensure every project outcome is backed by hard numbers (e.g., reduced processing latency by 42%, increased revenue attribution by $1.2M, or successfully defended liability claim).</li>
                        <li><strong>Version Control & Presentation:</strong> Publish clean documentation, README files, or executive summaries on GitHub/Portfolio repositories.</li>
                      </ul>
                    </div>

                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <h4 style={{ fontSize: '15px', color: theme.textMain, margin: '0 0 8px 0' }}>Weeks 7–8 (Days 46–60): Advanced Problem Solving & Mock Interview Conditioning</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li><strong>Interview Simulator Training:</strong> Utilize Tab 2 (Live Adaptive Voice Interview Simulator) at least 3 times per week to build verbal articulation fluency.</li>
                        <li><strong>STAR Method Mastery:</strong> Practice structuring all behavioral and technical responses using Situation, Task, Action, and Result frameworks.</li>
                        <li><strong>ATS Optimization Finalization:</strong> Re-run resume parser diagnostics in Tab 1 to ensure zero technical or execution gaps remain.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* MONTH 3 */}
                <div style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: '12px', padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${theme.cardBorder}`, paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: theme.success }}>Month 3: Executive Positioning & Placement Execution (Days 61–90)</h3>
                    <span style={{ fontSize: '13px', padding: '4px 12px', background: '#0f172a', borderRadius: '20px', border: `1px solid ${theme.cardBorder}` }}>Status: Final Phase</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <h4 style={{ fontSize: '15px', color: theme.textMain, margin: '0 0 8px 0' }}>Weeks 9–10 (Days 61–75): Executive Personal Branding & Network Amplification</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li><strong>LinkedIn & Portfolio Polish:</strong> Update professional headlines, about summaries, and featured capstone projects to reflect elite {targetRole} positioning.</li>
                        <li><strong>Target Company Mapping:</strong> Compile a curated list of 25 tier-1 employers hiring for {targetRole}.</li>
                        <li><strong>Referral Outreach:</strong> Initiate structured informational interviews and alumni networking to secure direct internal referrals.</li>
                      </ul>
                    </div>

                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', border: `1px solid ${theme.cardBorder}` }}>
                      <h4 style={{ fontSize: '15px', color: theme.textMain, margin: '0 0 8px 0' }}>Weeks 11–12 (Days 76–90): High-Stakes Interview Blitz & Offer Negotiation</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: theme.textMuted, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <li><strong>Live Interview Execution:</strong> Participate in live screening rounds, technical deep-dives, and executive panel interviews with absolute confidence.</li>
                        <li><strong>Post-Interview Analytics:</strong> Review performance metrics and speech transcripts from Tab 2 to eliminate verbal fillers and hesitation.</li>
                        <li><strong>Offer Conversion:</strong> Evaluate competing offers, execute benchmark compensation negotiations, and successfully secure your target placement in {targetRole}!</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}