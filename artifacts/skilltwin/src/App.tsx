import React, { useRef, useState } from 'react';

interface SkillItem {
  name: string;
  category: string;
  recommendedScore: number;
  description: string;
}

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
}

interface AnswerAnalysis {
  score: number;
  rating: string;
  strengths: string[];
  improvements: string[];
  feedback: string;
  nextQuestion: string;
}

interface InterviewAnswer {
  question: string;
  answer: string;
  analysis: AnswerAnalysis;
}

interface ResumeAnalysis {
  resumeScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  resumeStrengths: string[];
  resumeImprovements: string[];
  summary: string;
}

export default function App() {
  // =========================================================
  // MAIN STATE
  // =========================================================

  const [activeTab, setActiveTab] =
    useState<'matrix' | 'assessor'>('matrix');

  const [candidateName, setCandidateName] =
    useState('');

  const [targetRole, setTargetRole] =
    useState('');

  const [targetCompany, setTargetCompany] =
    useState('');

  const [activeSkills, setActiveSkills] =
    useState<SkillItem[]>([]);

  const [customRatings, setCustomRatings] =
    useState<Record<string, number>>({});

  const [analysis, setAnalysis] =
    useState<any>(null);

  // =========================================================
  // RESUME STATE
  // =========================================================

  const [resumeText, setResumeText] =
    useState('');

  const [resumeAnalysis, setResumeAnalysis] =
    useState<ResumeAnalysis | null>(null);

  const [isResumeAnalyzing, setIsResumeAnalyzing] =
    useState(false);

  // =========================================================
  // INTERVIEW STATE
  // =========================================================

  const [chatLog, setChatLog] =
    useState<ChatMessage[]>([]);

  const [userInput, setUserInput] =
    useState('');

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [interviewStarted, setInterviewStarted] =
    useState(false);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState('');

  const [lastAnswerAnalysis, setLastAnswerAnalysis] =
    useState<AnswerAnalysis | null>(null);

  const [interviewAnswers, setInterviewAnswers] =
    useState<InterviewAnswer[]>([]);

  // =========================================================
  // SPEECH RECOGNITION REFS
  // =========================================================

  const recognitionRef =
    useRef<any>(null);

  const microphoneStreamRef =
    useRef<MediaStream | null>(null);

  const shouldKeepRecordingRef =
    useRef(false);

  const transcriptRef =
    useRef('');

  const restartTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  // =========================================================
  // ROLE KEYWORDS
  // =========================================================

  const getRoleKeywords = (
    role: string
  ): string[] => {
    const lower = role.toLowerCase();

    const keywordMap: Record<string, string[]> = {
      software: [
        'coding',
        'programming',
        'javascript',
        'typescript',
        'react',
        'debugging',
        'testing',
        'architecture',
        'api',
        'database',
        'deployment',
        'git',
        'security'
      ],

      developer: [
        'coding',
        'programming',
        'javascript',
        'typescript',
        'react',
        'debugging',
        'testing',
        'architecture',
        'api',
        'database',
        'deployment',
        'git'
      ],

      engineer: [
        'design',
        'analysis',
        'testing',
        'safety',
        'quality',
        'problem',
        'solution',
        'technical',
        'engineering'
      ],

      accountant: [
        'financial',
        'accounting',
        'audit',
        'tax',
        'compliance',
        'reconciliation',
        'reporting',
        'excel'
      ],

      marketing: [
        'campaign',
        'customer',
        'brand',
        'analytics',
        'content',
        'conversion',
        'audience',
        'strategy',
        'social media'
      ],

      manager: [
        'leadership',
        'team',
        'planning',
        'deadline',
        'communication',
        'conflict',
        'performance',
        'decision'
      ],

      designer: [
        'design',
        'user',
        'research',
        'prototype',
        'visual',
        'feedback',
        'usability',
        'iteration',
        'figma'
      ],

      doctor: [
        'patient',
        'diagnosis',
        'treatment',
        'clinical',
        'medical',
        'safety',
        'history',
        'evidence'
      ],

      lawyer: [
        'client',
        'case',
        'legal',
        'evidence',
        'contract',
        'research',
        'court',
        'argument'
      ],

      teacher: [
        'student',
        'lesson',
        'learning',
        'assessment',
        'classroom',
        'feedback',
        'curriculum',
        'communication'
      ],

      data: [
        'python',
        'sql',
        'statistics',
        'analytics',
        'machine learning',
        'data analysis',
        'pandas',
        'numpy',
        'visualization'
      ],

      analyst: [
        'analysis',
        'excel',
        'sql',
        'data',
        'analytics',
        'reporting',
        'dashboard',
        'statistics'
      ]
    };

    for (const key of Object.keys(keywordMap)) {
      if (lower.includes(key)) {
        return keywordMap[key];
      }
    }

    return [
      'problem',
      'solution',
      'experience',
      'process',
      'result',
      'communication',
      'quality',
      'planning',
      'leadership',
      'team'
    ];
  };

  // =========================================================
  // ROLE INPUT
  // =========================================================

  const handleRoleInputChange = (
    roleInput: string
  ) => {
    setTargetRole(roleInput);

    const cleanTitle =
      roleInput.trim();

    if (!cleanTitle) {
      setActiveSkills([]);
      setCustomRatings({});
      setAnalysis(null);
      setResumeAnalysis(null);
      return;
    }

    const skillsToLoad: SkillItem[] = [
      {
        name:
          `${cleanTitle} Core Theory & Concepts`,
        category:
          'Domain Theory',
        recommendedScore: 85,
        description:
          'Foundational domain knowledge'
      },
      {
        name:
          `${cleanTitle} Tools & Software`,
        category:
          'Tools & Methods',
        recommendedScore: 80,
        description:
          'Standard industry toolsets'
      },
      {
        name:
          'Execution & Workflow Quality',
        category:
          'Core Competency',
        recommendedScore: 85,
        description:
          'Hands-on practical output'
      },
      {
        name:
          'Standards & Best Practices',
        category:
          'Domain Theory',
        recommendedScore: 75,
        description:
          'Industry rules & compliance'
      },
      {
        name:
          'Client & Stakeholder Communication',
        category:
          'Execution & Strategy',
        recommendedScore: 80,
        description:
          'Presentation & collaboration'
      }
    ];

    setActiveSkills(skillsToLoad);

    const ratings: Record<string, number> = {};

    skillsToLoad.forEach((skill) => {
      ratings[skill.name] = 50;
    });

    setCustomRatings(ratings);
    setAnalysis(null);
    setResumeAnalysis(null);
  };

  // =========================================================
  // SLIDER
  // =========================================================

  const handleSliderChange = (
    skillName: string,
    value: number
  ) => {
    setCustomRatings((previous) => ({
      ...previous,
      [skillName]: value
    }));
  };

  // =========================================================
  // RESUME ANALYSIS
  // =========================================================

  const analyzeResume = () => {
    if (!resumeText.trim()) {
      alert(
        'Please paste your resume first. This is optional.'
      );
      return;
    }

    if (!targetRole.trim()) {
      alert(
        'Please enter your target role before analyzing your resume.'
      );
      return;
    }

    setIsResumeAnalyzing(true);

    setTimeout(() => {
      const resume =
        resumeText.toLowerCase();

      const keywords =
        getRoleKeywords(targetRole);

      const matchedSkills =
        keywords.filter((keyword) =>
          resume.includes(
            keyword.toLowerCase()
          )
        );

      const missingSkills =
        keywords.filter(
          (keyword) =>
            !resume.includes(
              keyword.toLowerCase()
            )
        );

      const wordCount =
        resumeText
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .length;

      let resumeScore = 0;

      // Skill relevance
      const skillScore =
        Math.min(
          40,
          Math.round(
            (matchedSkills.length /
              Math.max(
                keywords.length,
                1
              )) *
              40
          )
        );

      resumeScore += skillScore;

      // Experience/detail
      if (wordCount >= 500) {
        resumeScore += 25;
      } else if (wordCount >= 300) {
        resumeScore += 20;
      } else if (wordCount >= 150) {
        resumeScore += 15;
      } else {
        resumeScore += 8;
      }

      // Achievement/result signals
      const resultWords = [
        'achieved',
        'increased',
        'reduced',
        'improved',
        'saved',
        'delivered',
        'built',
        'developed',
        'created',
        'managed',
        'led',
        '%'
      ];

      const resultMatches =
        resultWords.filter(
          (word) =>
            resume.includes(word)
        ).length;

      resumeScore += Math.min(
        20,
        resultMatches * 2
      );

      // Education/project/experience
      const structureWords = [
        'experience',
        'education',
        'project',
        'projects',
        'skills',
        'certification',
        'internship'
      ];

      const structureMatches =
        structureWords.filter(
          (word) =>
            resume.includes(word)
        ).length;

      resumeScore += Math.min(
        15,
        structureMatches * 2
      );

      resumeScore = Math.min(
        100,
        resumeScore
      );

      const resumeStrengths: string[] = [];

      if (matchedSkills.length >= 3) {
        resumeStrengths.push(
          `Your resume contains several skills relevant to ${targetRole}.`
        );
      }

      if (resultMatches >= 4) {
        resumeStrengths.push(
          'Your resume contains achievement and impact-oriented language.'
        );
      }

      if (wordCount >= 300) {
        resumeStrengths.push(
          'Your resume provides enough detail for meaningful role matching.'
        );
      }

      if (structureMatches >= 4) {
        resumeStrengths.push(
          'Your resume appears to contain multiple important professional sections.'
        );
      }

      if (!resumeStrengths.length) {
        resumeStrengths.push(
          'Your resume provides a starting point for role analysis.'
        );
      }

      const resumeImprovements: string[] = [];

      if (missingSkills.length > 0) {
        resumeImprovements.push(
          `Consider highlighting relevant skills such as ${missingSkills
            .slice(0, 4)
            .join(', ')} if you genuinely have those skills.`
        );
      }

      if (resultMatches < 4) {
        resumeImprovements.push(
          'Add measurable achievements, outcomes, percentages, time saved, revenue impact, or other concrete results where truthful.'
        );
      }

      if (wordCount < 200) {
        resumeImprovements.push(
          'Your resume may need more detail around projects, experience, responsibilities, and achievements.'
        );
      }

      if (!resumeImprovements.length) {
        resumeImprovements.push(
          'Your resume is well aligned. Focus on making achievements even more specific and measurable.'
        );
      }

      let summary = '';

      if (resumeScore >= 80) {
        summary =
          `Your resume appears strongly aligned with the ${targetRole} role. Keep emphasizing your strongest technical/professional achievements.`;
      } else if (resumeScore >= 60) {
        summary =
          `Your resume has a reasonable foundation for ${targetRole}, but there are several areas where the alignment can be improved.`;
      } else {
        summary =
          `Your resume currently shows limited evidence for ${targetRole}. Strengthen the relevant skills, projects, achievements, and experience sections.`;
      }

      const result: ResumeAnalysis = {
        resumeScore,
        matchedSkills,
        missingSkills,
        resumeStrengths,
        resumeImprovements,
        summary
      };

      setResumeAnalysis(result);
      setIsResumeAnalyzing(false);
    }, 500);
  };

  // =========================================================
  // SKILL GAP CALCULATION
  // =========================================================

  const calculateGaps = () => {
    if (!activeSkills.length) {
      return;
    }

    const list = activeSkills.map(
      (skill) => {
        const current =
          customRatings[skill.name] ??
          50;

        const target =
          skill.recommendedScore;

        return {
          ...skill,
          current,
          target,
          gap: Math.max(
            0,
            target - current
          )
        };
      }
    );

    const average = Math.round(
      list.reduce(
        (sum, item) =>
          sum + item.current,
        0
      ) / list.length
    );

    const deficientSkills =
      list
        .filter(
          (item) =>
            item.gap > 0
        )
        .map(
          (item) =>
            item.name
        );

    let suggestion = '';

    if (average >= 80) {
      suggestion =
        `Excellent positioning for ${targetRole}. Focus on advanced case studies, leadership examples, measurable business impact, and executive-level communication.`;
    } else if (average >= 60) {
      suggestion =
        `You have a solid foundation for ${targetRole}, but you should strengthen ${deficientSkills
          .slice(0, 2)
          .join(' and ')}. Build practical projects and practice structured interview answers.`;
    } else {
      suggestion =
        `Your current profile has significant gaps for ${targetRole}. Focus first on foundational knowledge, practical exercises, tools, and repeated mock interviews before targeting highly competitive positions.`;
    }

    setAnalysis({
      score: average,
      skills: list,
      verdict:
        average >= 75
          ? 'Industry Ready'
          : average >= 55
          ? 'Needs Upskilling'
          : 'Critical Deficits',
      deficientSkills,
      suggestionParagraph:
        suggestion
    });
  };

  // =========================================================
  // TEXT TO SPEECH
  // =========================================================

  const speakText = (
    text: string,
    onComplete?: () => void
  ) => {
    if (
      !('speechSynthesis' in window)
    ) {
      onComplete?.();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      onComplete?.();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      onComplete?.();
    };

    window.speechSynthesis.speak(
      utterance
    );
  };

  // =========================================================
  // ANSWER ANALYSIS
  // =========================================================

  const analyzeAnswer = (
    question: string,
    answer: string
  ): AnswerAnalysis => {
    const cleanAnswer =
      answer.trim();

    const lowerAnswer =
      cleanAnswer.toLowerCase();

    const words =
      cleanAnswer
        .split(/\s+/)
        .filter(Boolean);

    const wordCount =
      words.length;

    const role =
      targetRole ||
      'professional';

    const keywords =
      getRoleKeywords(role);

    const matchedKeywords =
      keywords.filter(
        (keyword) =>
          lowerAnswer.includes(
            keyword.toLowerCase()
          )
      );

    // DETAIL
    let detailScore = 0;

    if (wordCount >= 80) {
      detailScore = 25;
    } else if (wordCount >= 50) {
      detailScore = 20;
    } else if (wordCount >= 30) {
      detailScore = 15;
    } else if (wordCount >= 15) {
      detailScore = 10;
    } else {
      detailScore = 5;
    }

    // RELEVANCE
    const relevanceScore =
      Math.min(
        25,
        10 +
          matchedKeywords.length * 3
      );

    // STRUCTURE
    const structureWords = [
      'first',
      'then',
      'finally',
      'because',
      'therefore',
      'however',
      'for example',
      'result',
      'outcome',
      'situation',
      'task',
      'action'
    ];

    const structureMatches =
      structureWords.filter(
        (word) =>
          lowerAnswer.includes(word)
      ).length;

    const structureScore =
      Math.min(
        20,
        8 +
          structureMatches * 2
      );

    // CLARITY
    const sentenceCount =
      cleanAnswer
        .split(/[.!?]+/)
        .filter(
          (sentence) =>
            sentence.trim()
        ).length;

    let clarityScore = 10;

    if (
      sentenceCount >= 3 &&
      wordCount >= 40
    ) {
      clarityScore = 15;
    } else if (
      sentenceCount >= 2
    ) {
      clarityScore = 12;
    }

    // RESULT
    const resultWords = [
      'achieved',
      'improved',
      'increased',
      'reduced',
      'saved',
      'delivered',
      'completed',
      'result',
      'outcome',
      '%'
    ];

    const hasResult =
      resultWords.some(
        (word) =>
          lowerAnswer.includes(word)
      );

    const resultScore =
      hasResult ? 15 : 5;

    let score =
      detailScore +
      relevanceScore +
      structureScore +
      clarityScore +
      resultScore;

    score = Math.max(
      0,
      Math.min(100, score)
    );

    let rating = '';

    if (score >= 85) {
      rating = 'Excellent';
    } else if (score >= 70) {
      rating = 'Strong';
    } else if (score >= 55) {
      rating = 'Average';
    } else if (score >= 40) {
      rating =
        'Needs Improvement';
    } else {
      rating = 'Weak';
    }

    // STRENGTHS
    const strengths: string[] = [];

    if (wordCount >= 50) {
      strengths.push(
        'You provided a reasonably detailed answer.'
      );
    }

    if (
      matchedKeywords.length >= 2
    ) {
      strengths.push(
        `Your answer demonstrated ${role}-relevant knowledge.`
      );
    }

    if (
      structureMatches >= 2
    ) {
      strengths.push(
        'Your answer had a logical structure.'
      );
    }

    if (hasResult) {
      strengths.push(
        'You included an outcome or measurable result.'
      );
    }

    if (sentenceCount >= 3) {
      strengths.push(
        'Your response contained multiple connected ideas.'
      );
    }

    if (!strengths.length) {
      strengths.push(
        'You responded directly to the interview question.'
      );
    }

    // IMPROVEMENTS
    const improvements: string[] =
      [];

    if (wordCount < 40) {
      improvements.push(
        'Give a more detailed answer. Aim for roughly 45–90 seconds when speaking.'
      );
    }

    if (
      matchedKeywords.length === 0
    ) {
      improvements.push(
        `Connect your answer more directly to ${role}-specific responsibilities and terminology.`
      );
    }

    if (
      structureMatches < 2
    ) {
      improvements.push(
        'Use a clear structure: Situation → Action → Result.'
      );
    }

    if (!hasResult) {
      improvements.push(
        'Include a concrete outcome, metric, achievement, or business impact.'
      );
    }

    if (sentenceCount < 2) {
      improvements.push(
        'Expand your explanation instead of giving only a short statement.'
      );
    }

    if (!improvements.length) {
      improvements.push(
        'Your answer is strong. Focus on adding even more measurable impact and specific examples.'
      );
    }

    // FEEDBACK
    let feedback = '';

    if (score >= 85) {
      feedback =
        `Excellent answer. You demonstrated strong communication, relevant knowledge, and a structured response. For a ${role} interview, this would generally come across as confident and well-prepared.`;
    } else if (score >= 70) {
      feedback =
        `Good answer. You demonstrated useful knowledge and reasonable structure. To make this interview-level strong, add more specific examples and measurable results.`;
    } else if (score >= 55) {
      feedback =
        `Your answer shows potential, but it needs more depth. For a ${role} interview, explain what you personally did, why you made your decisions, and what result you achieved.`;
    } else {
      feedback =
        `This answer needs significant improvement. Try using a structured example with the situation, your specific actions, and the final result.`;
    }

    // NEXT QUESTION
    let nextQuestion = '';

    if (!hasResult) {
      nextQuestion =
        `You mentioned your approach to the problem. Can you give me a specific real-world example from your experience as a ${role} and explain the result you achieved?`;
    } else if (
      matchedKeywords.length < 2
    ) {
      nextQuestion =
        `Let's go deeper into your professional expertise. What is one difficult challenge you have faced as a ${role}, and how did you decide which solution to use?`;
    } else if (
      structureMatches < 2
    ) {
      nextQuestion =
        `Imagine you are under significant pressure and a project is at risk of missing its deadline. Walk me through exactly how you would analyze the situation, prioritize the work, and communicate with stakeholders.`;
    } else {
      nextQuestion =
        `Good. Now let's test your judgment. Tell me about a time when your first approach did not work. What did you change, and what did you learn from the experience?`;
    }

    return {
      score,
      rating,
      strengths,
      improvements,
      feedback,
      nextQuestion
    };
  };

  // =========================================================
  // MICROPHONE / SPEECH RECOGNITION
  // =========================================================

  const startRecording = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any)
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.'
      );
      return;
    }

    if (
      isSpeaking ||
      isAnalyzing ||
      isRecording
    ) {
      return;
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      alert(
        'Your browser does not allow microphone access. Please use Google Chrome or Microsoft Edge and open the Preview in a separate tab.'
      );
      return;
    }

    if (
      restartTimeoutRef.current
    ) {
      clearTimeout(
        restartTimeoutRef.current
      );

      restartTimeoutRef.current =
        null;
    }

    try {
      // =====================================================
      // EXPLICITLY REQUEST MICROPHONE PERMISSION
      // =====================================================

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          }
        );

      microphoneStreamRef.current =
        stream;

      console.log(
        'Microphone permission granted'
      );

      // SpeechRecognition uses the microphone.
      // We only use getUserMedia here to explicitly
      // trigger browser permission.

      stream
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      microphoneStreamRef.current =
        null;

      // =====================================================
      // RESET TRANSCRIPT
      // =====================================================

      transcriptRef.current = '';

      shouldKeepRecordingRef.current =
        true;

      setUserInput('');
      setIsRecording(true);

      // =====================================================
      // CREATE RECOGNITION
      // =====================================================

      const createRecognition =
        () => {
          if (
            !shouldKeepRecordingRef.current
          ) {
            return;
          }

          const recognition =
            new SpeechRecognition();

          recognition.lang =
            'en-US';

          recognition.continuous =
            true;

          recognition.interimResults =
            true;

          recognition.maxAlternatives =
            1;

          recognitionRef.current =
            recognition;

          recognition.onstart =
            () => {
              console.log(
                'Speech recognition started'
              );

              setIsRecording(
                true
              );
            };

          recognition.onresult =
            (event: any) => {
              let finalText =
                transcriptRef.current;

              let interimText =
                '';

              for (
                let i =
                  event.resultIndex;
                i <
                event.results.length;
                i++
              ) {
                const transcript =
                  event.results[i][0]
                    ?.transcript || '';

                if (
                  event.results[i]
                    .isFinal
                ) {
                  finalText +=
                    transcript + ' ';
                } else {
                  interimText +=
                    transcript;
                }
              }

              transcriptRef.current =
                finalText;

              const combinedText =
                `${finalText}${interimText}`.trim();

              console.log(
                'Transcript:',
                combinedText
              );

              setUserInput(
                combinedText
              );
            };

          recognition.onerror =
            (event: any) => {
              console.error(
                'Speech recognition error:',
                event?.error
              );

              if (
                event?.error ===
                  'not-allowed' ||
                event?.error ===
                  'service-not-allowed'
              ) {
                shouldKeepRecordingRef.current =
                  false;

                setIsRecording(
                  false
                );

                alert(
                  'Microphone access was blocked. Click the 🔒 icon near the website address, allow Microphone access, reload the page, and try again.'
                );

                return;
              }

              if (
                event?.error ===
                'audio-capture'
              ) {
                shouldKeepRecordingRef.current =
                  false;

                setIsRecording(
                  false
                );

                alert(
                  'No microphone was detected. Check that your microphone is connected and enabled in your computer settings.'
                );

                return;
              }

              if (
                event?.error ===
                'network'
              ) {
                console.warn(
                  'Speech recognition network error.'
                );
              }
            };

          recognition.onend =
            () => {
              console.log(
                'Speech recognition ended'
              );

              if (
                shouldKeepRecordingRef.current
              ) {
                restartTimeoutRef.current =
                  setTimeout(
                    () => {
                      if (
                        !shouldKeepRecordingRef.current
                      ) {
                        return;
                      }

                      try {
                        createRecognition();
                      } catch (
                        error
                      ) {
                        console.error(
                          'Could not restart speech recognition:',
                          error
                        );
                      }
                    },
                    300
                  );
              } else {
                setIsRecording(
                  false
                );
              }
            };

          try {
            recognition.start();

            console.log(
              'Attempting to start speech recognition...'
            );
          } catch (error) {
            console.error(
              'Recognition start error:',
              error
            );
          }
        };

      createRecognition();
    } catch (error: any) {
      console.error(
        'Microphone permission error:',
        error
      );

      setIsRecording(false);

      if (
        error?.name ===
        'NotAllowedError'
      ) {
        alert(
          'Microphone permission was denied. Please allow microphone access for this website and try again.'
        );
      } else if (
        error?.name ===
        'NotFoundError'
      ) {
        alert(
          'No microphone was found. Please connect or enable a microphone and try again.'
        );
      } else if (
        error?.name ===
        'NotReadableError'
      ) {
        alert(
          'Your microphone is already being used by another application. Close Zoom, Meet, Discord, WhatsApp, or another browser tab using the microphone, then try again.'
        );
      } else {
        alert(
          'Could not access your microphone. Please check your browser microphone permission and try again.'
        );
      }
    }
  };

  // =========================================================
  // STOP RECORDING AND ANALYZE
  // =========================================================

  const stopRecordingAndAnalyze =
    () => {
      console.log(
        'Stopping recording...'
      );

      shouldKeepRecordingRef.current =
        false;

      if (
        restartTimeoutRef.current
      ) {
        clearTimeout(
          restartTimeoutRef.current
        );

        restartTimeoutRef.current =
          null;
      }

      if (
        recognitionRef.current
      ) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log(
            'Recognition already stopped'
          );
        }
      }

      recognitionRef.current =
        null;

      if (
        microphoneStreamRef.current
      ) {
        microphoneStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        microphoneStreamRef.current =
          null;
      }

      setIsRecording(false);

      // Give SpeechRecognition time
      // to deliver final result.

      setTimeout(() => {
        const answer =
          transcriptRef.current.trim() ||
          userInput.trim();

        console.log(
          'Final answer:',
          answer
        );

        if (!answer) {
          const message =
            'I could not detect an answer. Please make sure your microphone is enabled, speak clearly, and try again.';

          setChatLog(
            (previous) => [
              ...previous,
              {
                sender: 'ai',
                text: message
              }
            ]
          );

          speakText(message);

          return;
        }

        analyzeAndContinue(
          answer
        );
      }, 800);
    };

  // =========================================================
  // ANALYZE AND CONTINUE
  // =========================================================

  const analyzeAndContinue = (
    answer: string
  ) => {
    if (!currentQuestion) {
      return;
    }

    setIsAnalyzing(true);

    setChatLog((previous) => [
      ...previous,
      {
        sender: 'user',
        text: answer
      }
    ]);

    const result =
      analyzeAnswer(
        currentQuestion,
        answer
      );

    setLastAnswerAnalysis(
      result
    );

    setInterviewAnswers(
      (previous) => [
        ...previous,
        {
          question:
            currentQuestion,
          answer,
          analysis: result
        }
      ]
    );

    const feedbackMessage =
      `I have analyzed your answer. Your score is ${result.score} out of 100, rated ${result.rating}. ${result.feedback} One important improvement is: ${result.improvements[0]}`;

    const nextQuestion =
      result.nextQuestion;

    setTimeout(() => {
      setChatLog((previous) => [
        ...previous,
        {
          sender: 'ai',
          text: feedbackMessage
        },
        {
          sender: 'ai',
          text:
            `Next question: ${nextQuestion}`
        }
      ]);

      setCurrentQuestion(
        nextQuestion
      );

      setIsAnalyzing(false);

      speakText(
        `${feedbackMessage} ${nextQuestion}`
      );
    }, 700);
  };

  // =========================================================
  // START INTERVIEW
  // =========================================================

  const startVoiceSession = () => {
    if (!targetRole.trim()) {
      alert(
        'Please enter your target profession first.'
      );

      setActiveTab('matrix');

      return;
    }

    window.speechSynthesis?.cancel();

    shouldKeepRecordingRef.current =
      false;

    if (
      recognitionRef.current
    ) {
      try {
        recognitionRef.current.stop();
      } catch (error) {}
    }

    recognitionRef.current =
      null;

    setChatLog([]);
    setInterviewAnswers([]);
    setLastAnswerAnalysis(null);
    setUserInput('');
    transcriptRef.current = '';

    setIsRecording(false);
    setInterviewStarted(true);

    const firstQuestion =
      `Hello ${
        candidateName ||
        'candidate'
      }. Welcome to your ${
        targetRole
      } interview${
        targetCompany
          ? ` for ${targetCompany}`
          : ''
      }. I will evaluate the quality, relevance, structure, and depth of your answers. Let's begin. Tell me about yourself and your professional experience relevant to this role.`;

    setCurrentQuestion(
      firstQuestion
    );

    setChatLog([
      {
        sender: 'ai',
        text: firstQuestion
      }
    ]);

    speakText(firstQuestion);
  };

  // =========================================================
  // STOP INTERVIEW
  // =========================================================

  const stopInterview = () => {
    shouldKeepRecordingRef.current =
      false;

    if (
      restartTimeoutRef.current
    ) {
      clearTimeout(
        restartTimeoutRef.current
      );

      restartTimeoutRef.current =
        null;
    }

    if (
      recognitionRef.current
    ) {
      try {
        recognitionRef.current.stop();
      } catch (error) {}
    }

    recognitionRef.current =
      null;

    if (
      microphoneStreamRef.current
    ) {
      microphoneStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      microphoneStreamRef.current =
        null;
    }

    window.speechSynthesis?.cancel();

    setIsRecording(false);
    setIsSpeaking(false);
    setInterviewStarted(false);
    setIsAnalyzing(false);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        minHeight: '100vh',
        color: '#f8fafc',
        fontFamily:
          'Inter, Arial, sans-serif',
        padding: '24px'
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          maxWidth: '1150px',
          margin:
            '0 auto 24px auto',
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems: 'center',
          borderBottom:
            '1px solid #334155',
          paddingBottom: '16px',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 800,
              color: '#38bdf8'
            }}
          >
            ⚡ SkillTwin AI
          </h1>

          <p
            style={{
              margin:
                '4px 0 0 0',
              fontSize: '13px',
              color: '#94a3b8'
            }}
          >
            AI Voice Interview &
            Intelligent Skill Gap
            Analysis
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px'
          }}
        >
          <button
            onClick={() =>
              setActiveTab(
                'matrix'
              )
            }
            style={{
              padding:
                '9px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#fff',
              backgroundColor:
                activeTab ===
                'matrix'
                  ? '#0284c7'
                  : '#1e293b'
            }}
          >
            📊 Skill Matrix
          </button>

          <button
            onClick={() =>
              setActiveTab(
                'assessor'
              )
            }
            style={{
              padding:
                '9px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#fff',
              backgroundColor:
                activeTab ===
                'assessor'
                  ? '#0284c7'
                  : '#1e293b'
            }}
          >
            🎙️ AI Interview
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1150px',
          margin: '0 auto'
        }}
      >
        {/* =====================================================
            SKILL MATRIX
        ====================================================== */}

        {activeTab === 'matrix' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: '24px'
            }}
          >
            {/* LEFT SIDE */}

            <div
              style={{
                backgroundColor:
                  '#1e293b',
                padding: '20px',
                borderRadius:
                  '10px'
              }}
            >
              <h3>
                Candidate & Profession
              </h3>

              {/* NAME */}

              <label
                style={{
                  fontSize: '12px',
                  color: '#94a3b8'
                }}
              >
                Candidate Name
              </label>

              <input
                value={candidateName}
                onChange={(e) =>
                  setCandidateName(
                    e.target.value
                  )
                }
                placeholder="Your name"
                style={{
                  width: '100%',
                  margin:
                    '5px 0 15px',
                  padding: '10px',
                  borderRadius:
                    '6px',
                  border:
                    '1px solid #334155',
                  background:
                    '#0f172a',
                  color: '#fff',
                  boxSizing:
                    'border-box'
                }}
              />

              {/* ROLE */}

              <label
                style={{
                  fontSize: '12px',
                  color: '#94a3b8'
                }}
              >
                Target Role *
              </label>

              <input
                value={targetRole}
                onChange={(e) =>
                  handleRoleInputChange(
                    e.target.value
                  )
                }
                placeholder="e.g. Software Engineer"
                style={{
                  width: '100%',
                  margin:
                    '5px 0 15px',
                  padding: '10px',
                  borderRadius:
                    '6px',
                  border:
                    '1px solid #0284c7',
                  background:
                    '#0f172a',
                  color: '#fff',
                  boxSizing:
                    'border-box'
                }}
              />

              {/* COMPANY */}

              <label
                style={{
                  fontSize: '12px',
                  color: '#94a3b8'
                }}
              >
                Target Company
              </label>

              <input
                value={targetCompany}
                onChange={(e) =>
                  setTargetCompany(
                    e.target.value
                  )
                }
                placeholder="e.g. Microsoft"
                style={{
                  width: '100%',
                  margin:
                    '5px 0 15px',
                  padding: '10px',
                  borderRadius:
                    '6px',
                  border:
                    '1px solid #334155',
                  background:
                    '#0f172a',
                  color: '#fff',
                  boxSizing:
                    'border-box'
                }}
              />

              {/* =================================================
                  OPTIONAL RESUME
              ================================================= */}

              <div
                style={{
                  marginTop: '20px',
                  background:
                    '#0f172a',
                  padding: '15px',
                  borderRadius:
                    '8px',
                  border:
                    '1px solid #334155'
                }}
              >
                <h4
                  style={{
                    marginTop: 0,
                    color:
                      '#38bdf8'
                  }}
                >
                  📄 Optional Resume
                </h4>

                <p
                  style={{
                    fontSize: '11px',
                    color:
                      '#94a3b8',
                    lineHeight:
                      '1.5'
                  }}
                >
                  Paste your resume here
                  if you want SkillTwin
                  AI to analyze it against
                  your target role.
                  This is completely
                  optional.
                </p>

                <textarea
                  value={resumeText}
                  onChange={(e) =>
                    setResumeText(
                      e.target.value
                    )
                  }
                  placeholder="Paste your resume here..."
                  rows={9}
                  style={{
                    width: '100%',
                    padding: '10px',
                    boxSizing:
                      'border-box',
                    background:
                      '#111827',
                    color: '#fff',
                    border:
                      '1px solid #334155',
                    borderRadius:
                      '6px',
                    resize:
                      'vertical',
                    fontFamily:
                      'inherit',
                    fontSize:
                      '12px',
                    lineHeight:
                      '1.5'
                  }}
                />

                <button
                  onClick={
                    analyzeResume
                  }
                  disabled={
                    !resumeText.trim() ||
                    !targetRole.trim() ||
                    isResumeAnalyzing
                  }
                  style={{
                    width: '100%',
                    padding:
                      '10px',
                    marginTop:
                      '10px',
                    background:
                      '#7c3aed',
                    color: '#fff',
                    border:
                      'none',
                    borderRadius:
                      '6px',
                    fontWeight:
                      700,
                    cursor:
                      'pointer'
                  }}
                >
                  {isResumeAnalyzing
                    ? '🧠 Analyzing Resume...'
                    : '📄 Analyze Resume'}
                </button>
              </div>

              {/* SKILLS */}

              <h4
                style={{
                  color:
                    '#38bdf8'
                }}
              >
                Proficiency Ratings
              </h4>

              {activeSkills.map(
                (skill) => {
                  const value =
                    customRatings[
                      skill.name
                    ] ?? 50;

                  return (
                    <div
                      key={
                        skill.name
                      }
                      style={{
                        background:
                          '#0f172a',
                        padding:
                          '10px',
                        marginBottom:
                          '10px',
                        borderRadius:
                          '6px'
                      }}
                    >
                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          fontSize:
                            '12px',
                          gap:
                            '10px'
                        }}
                      >
                        <span>
                          {skill.name}
                        </span>

                        <strong
                          style={{
                            color:
                              '#38bdf8',
                            whiteSpace:
                              'nowrap'
                          }}
                        >
                          {value}% /{' '}
                          {
                            skill.recommendedScore
                          }%
                        </strong>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) =>
                          handleSliderChange(
                            skill.name,
                            Number(
                              e.target
                                .value
                            )
                          )
                        }
                        style={{
                          width:
                            '100%',
                          accentColor:
                            '#0284c7'
                        }}
                      />

                      <div
                        style={{
                          color:
                            '#64748b',
                          fontSize:
                            '10px'
                        }}
                      >
                        {
                          skill.description
                        }
                      </div>
                    </div>
                  );
                }
              )}

              <button
                onClick={
                  calculateGaps
                }
                disabled={
                  !activeSkills.length
                }
                style={{
                  width: '100%',
                  padding: '11px',
                  marginTop:
                    '10px',
                  background:
                    '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius:
                    '6px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Calculate Skill Gaps
              </button>
            </div>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div
              style={{
                display:
                  'flex',
                flexDirection:
                  'column',
                gap: '20px'
              }}
            >
              {/* RESUME RESULT */}

              {resumeAnalysis && (
                <div
                  style={{
                    background:
                      '#1e293b',
                    padding:
                      '20px',
                    borderRadius:
                      '10px'
                  }}
                >
                  <h3
                    style={{
                      marginTop:
                        0
                    }}
                  >
                    📄 Resume Evaluation
                  </h3>

                  <div
                    style={{
                      background:
                        '#0f172a',
                      padding:
                        '20px',
                      borderRadius:
                        '8px',
                      marginBottom:
                        '15px'
                    }}
                  >
                    <div
                      style={{
                        color:
                          '#94a3b8',
                        fontSize:
                          '12px'
                      }}
                    >
                      Resume Match
                    </div>

                    <div
                      style={{
                        fontSize:
                          '36px',
                        fontWeight:
                          800,
                        color:
                          resumeAnalysis.resumeScore >=
                          75
                            ? '#4ade80'
                            : resumeAnalysis.resumeScore >=
                              55
                            ? '#facc15'
                            : '#f87171'
                      }}
                    >
                      {
                        resumeAnalysis.resumeScore
                      }%
                    </div>

                    <p
                      style={{
                        color:
                          '#cbd5e1',
                        fontSize:
                          '13px',
                        lineHeight:
                          '1.5'
                      }}
                    >
                      {
                        resumeAnalysis.summary
                      }
                    </p>
                  </div>

                  <div
                    style={{
                      marginBottom:
                        '15px'
                    }}
                  >
                    <strong
                      style={{
                        color:
                          '#4ade80'
                      }}
                    >
                      ✓ Skills Found
                    </strong>

                    <div
                      style={{
                        marginTop:
                          '8px',
                        display:
                          'flex',
                        flexWrap:
                          'wrap',
                        gap:
                          '6px'
                      }}
                    >
                      {resumeAnalysis
                        .matchedSkills
                        .length >
                      0 ? (
                        resumeAnalysis.matchedSkills.map(
                          (
                            skill
                          ) => (
                            <span
                              key={
                                skill
                              }
                              style={{
                                background:
                                  '#14532d',
                                color:
                                  '#bbf7d0',
                                padding:
                                  '5px 8px',
                                borderRadius:
                                  '5px',
                                fontSize:
                                  '11px'
                              }}
                            >
                              {skill}
                            </span>
                          )
                        )
                      ) : (
                        <span
                          style={{
                            color:
                              '#94a3b8',
                            fontSize:
                              '12px'
                          }}
                        >
                          No major matching
                          keywords detected.
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      marginBottom:
                        '15px'
                    }}
                  >
                    <strong
                      style={{
                        color:
                          '#f87171'
                      }}
                    >
                      ⚠️ Skills Not Found
                    </strong>

                    <div
                      style={{
                        marginTop:
                          '8px',
                        display:
                          'flex',
                        flexWrap:
                          'wrap',
                        gap:
                          '6px'
                      }}
                    >
                      {resumeAnalysis
                        .missingSkills
                        .slice(
                          0,
                          8
                        )
                        .map(
                          (
                            skill
                          ) => (
                            <span
                              key={
                                skill
                              }
                              style={{
                                background:
                                  '#451a1a',
                                color:
                                  '#fecaca',
                                padding:
                                  '5px 8px',
                                borderRadius:
                                  '5px',
                                fontSize:
                                  '11px'
                              }}
                            >
                              {skill}
                            </span>
                          )
                        )}
                    </div>
                  </div>

                  <div
                    style={{
                      marginBottom:
                        '15px'
                    }}
                  >
                    <strong
                      style={{
                        color:
                          '#4ade80'
                      }}
                    >
                      Strengths
                    </strong>

                    {resumeAnalysis.resumeStrengths.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          style={{
                            fontSize:
                              '12px',
                            color:
                              '#cbd5e1',
                            marginTop:
                              '6px'
                          }}
                        >
                          ✓ {item}
                        </div>
                      )
                    )}
                  </div>

                  <div>
                    <strong
                      style={{
                        color:
                          '#facc15'
                      }}
                    >
                      Improvements
                    </strong>

                    {resumeAnalysis.resumeImprovements.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          style={{
                            fontSize:
                              '12px',
                            color:
                              '#cbd5e1',
                            marginTop:
                              '6px'
                          }}
                        >
                          → {item}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* SKILL MATRIX RESULT */}

              <div
                style={{
                  backgroundColor:
                    '#1e293b',
                  padding:
                    '20px',
                  borderRadius:
                    '10px'
                }}
              >
                <h3>
                  Evaluation &
                  Learning Roadmap
                </h3>

                {!analysis ? (
                  <div
                    style={{
                      padding:
                        '60px 20px',
                      textAlign:
                        'center',
                      color:
                        '#64748b'
                    }}
                  >
                    Enter your role
                    and calculate
                    your skill gaps.
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        background:
                          '#0f172a',
                        padding:
                          '20px',
                        borderRadius:
                          '8px',
                        marginBottom:
                          '15px'
                      }}
                    >
                      <div
                        style={{
                          color:
                            '#94a3b8',
                          fontSize:
                            '12px'
                        }}
                      >
                        Overall Score
                      </div>

                      <div
                        style={{
                          fontSize:
                            '36px',
                          fontWeight:
                            800,
                          color:
                            analysis.score >=
                            75
                              ? '#4ade80'
                              : '#f87171'
                        }}
                      >
                        {
                          analysis.score
                        }%
                      </div>

                      <strong>
                        {
                          analysis.verdict
                        }
                      </strong>
                    </div>

                    <div
                      style={{
                        background:
                          '#2a1a1a',
                        padding:
                          '15px',
                        borderRadius:
                          '8px',
                        marginBottom:
                          '15px'
                      }}
                    >
                      <h4
                        style={{
                          color:
                            '#f87171'
                        }}
                      >
                        ⚠️ Skill Gaps
                      </h4>

                      {analysis
                        .deficientSkills
                        .length >
                      0 ? (
                        analysis.deficientSkills.map(
                          (
                            skill: string
                          ) => (
                            <div
                              key={
                                skill
                              }
                              style={{
                                fontSize:
                                  '12px',
                                marginBottom:
                                  '5px'
                              }}
                            >
                              • {skill}
                            </div>
                          )
                        )
                      ) : (
                        <div
                          style={{
                            fontSize:
                              '12px',
                            color:
                              '#4ade80'
                          }}
                        >
                          No major skill
                          gaps based on
                          your current
                          ratings.
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        background:
                          '#0f172a',
                        padding:
                          '15px',
                        borderRadius:
                          '8px',
                        borderLeft:
                          '4px solid #38bdf8'
                      }}
                    >
                      {
                        analysis.suggestionParagraph
                      }
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            AI INTERVIEW
        ====================================================== */}

        {activeTab === 'assessor' && (
          <div
            style={{
              maxWidth:
                '850px',
              margin:
                '0 auto'
            }}
          >
            <div
              style={{
                background:
                  '#1e293b',
                borderRadius:
                  '12px',
                padding:
                  '24px'
              }}
            >
              {/* TITLE */}

              <div
                style={{
                  textAlign:
                    'center'
                }}
              >
                <h2
                  style={{
                    margin:
                      '0 0 5px',
                    color:
                      '#38bdf8'
                  }}
                >
                  🤖 AI Interviewer
                </h2>

                <p
                  style={{
                    color:
                      '#94a3b8',
                    fontSize:
                      '13px'
                  }}
                >
                  {targetRole ||
                    'Choose a role first'}
                  {targetCompany
                    ? ` • ${targetCompany}`
                    : ''}
                </p>
              </div>

              {/* ROBOT */}

              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'center',
                  margin:
                    '20px 0'
                }}
              >
                <div
                  style={{
                    width: '110px',
                    height:
                      '110px',
                    borderRadius:
                      '50%',
                    display:
                      'flex',
                    justifyContent:
                      'center',
                    alignItems:
                      'center',
                    fontSize:
                      '40px',
                    background:
                      isSpeaking
                        ? 'radial-gradient(circle, #38bdf8, #0369a1)'
                        : isRecording
                        ? 'radial-gradient(circle, #ef4444, #991b1b)'
                        : 'radial-gradient(circle, #64748b, #1e293b)',
                    boxShadow:
                      isSpeaking
                        ? '0 0 35px #38bdf8'
                        : isRecording
                        ? '0 0 35px #ef4444'
                        : '0 0 15px #334155',
                    transform:
                      isSpeaking ||
                      isRecording
                        ? 'scale(1.08)'
                        : 'scale(1)',
                    transition:
                      '0.3s'
                  }}
                >
                  {isSpeaking
                    ? '🗣️'
                    : isRecording
                    ? '🎙️'
                    : isAnalyzing
                    ? '🧠'
                    : '🤖'}
                </div>
              </div>

              {/* STATUS */}

              <div
                style={{
                  textAlign:
                    'center',
                  color:
                    isRecording
                      ? '#ef4444'
                      : isSpeaking
                      ? '#38bdf8'
                      : isAnalyzing
                      ? '#facc15'
                      : '#94a3b8',
                  fontWeight:
                    700,
                  marginBottom:
                    '15px'
                }}
              >
                {isRecording
                  ? '🎙️ Listening to your answer...'
                  : isSpeaking
                  ? '🗣️ AI is speaking...'
                  : isAnalyzing
                  ? '🧠 AI is analyzing your answer...'
                  : interviewStarted
                  ? 'Ready for your answer'
                  : 'Interview not started'}
              </div>

              {/* START */}

              {!interviewStarted && (
                <button
                  onClick={
                    startVoiceSession
                  }
                  style={{
                    width: '100%',
                    padding:
                      '14px',
                    background:
                      '#0284c7',
                    color:
                      '#fff',
                    border:
                      'none',
                    borderRadius:
                      '8px',
                    fontWeight:
                      800,
                    cursor:
                      'pointer',
                    fontSize:
                      '15px',
                    marginBottom:
                      '15px'
                  }}
                >
                  ▶️ Start AI Interview
                </button>
              )}

              {/* CHAT */}

              <div
                style={{
                  height:
                    '330px',
                  overflowY:
                    'auto',
                  background:
                    '#0f172a',
                  padding:
                    '15px',
                  borderRadius:
                    '8px',
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap:
                    '12px',
                  marginBottom:
                    '12px'
                }}
              >
                {chatLog.length ===
                0 ? (
                  <div
                    style={{
                      color:
                        '#64748b',
                      textAlign:
                        'center',
                      marginTop:
                        '130px',
                      fontSize:
                        '13px'
                    }}
                  >
                    Your AI interviewer
                    will appear here.
                  </div>
                ) : (
                  chatLog.map(
                    (
                      message,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        style={{
                          alignSelf:
                            message.sender ===
                            'ai'
                              ? 'flex-start'
                              : 'flex-end',
                          maxWidth:
                            '85%'
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              '10px',
                            color:
                              '#64748b',
                            marginBottom:
                              '3px'
                          }}
                        >
                          {message.sender ===
                          'ai'
                            ? '🤖 AI Interviewer'
                            : `👤 ${
                                candidateName ||
                                'You'
                              }`}
                        </div>

                        <div
                          style={{
                            background:
                              message.sender ===
                              'ai'
                                ? '#334155'
                                : '#0284c7',
                            padding:
                              '10px 13px',
                            borderRadius:
                              '8px',
                            fontSize:
                              '13px',
                            lineHeight:
                              '1.5'
                          }}
                        >
                          {
                            message.text
                          }
                        </div>
                      </div>
                    )
                  )
                )}
              </div>

              {/* ANSWER ANALYSIS */}

              {lastAnswerAnalysis && (
                <div
                  style={{
                    background:
                      '#0f172a',
                    border:
                      '1px solid #334155',
                    borderRadius:
                      '8px',
                    padding:
                      '15px',
                    marginBottom:
                      '12px'
                  }}
                >
                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                      marginBottom:
                        '12px'
                    }}
                  >
                    <strong
                      style={{
                        color:
                          '#38bdf8'
                      }}
                    >
                      🧠 Latest Answer
                      Analysis
                    </strong>

                    <span
                      style={{
                        fontSize:
                          '22px',
                        fontWeight:
                          800,
                        color:
                          lastAnswerAnalysis.score >=
                          75
                            ? '#4ade80'
                            : lastAnswerAnalysis.score >=
                              55
                            ? '#facc15'
                            : '#f87171'
                      }}
                    >
                      {
                        lastAnswerAnalysis.score
                      }
                      /100
                    </span>
                  </div>

                  <div
                    style={{
                      marginBottom:
                        '10px',
                      color:
                        '#cbd5e1',
                      fontSize:
                        '13px'
                    }}
                  >
                    <strong>
                      Rating:
                    </strong>{' '}
                    {
                      lastAnswerAnalysis.rating
                    }
                  </div>

                  <div
                    style={{
                      marginBottom:
                        '10px'
                    }}
                  >
                    <strong
                      style={{
                        color:
                          '#4ade80'
                      }}
                    >
                      Strengths
                    </strong>

                    {lastAnswerAnalysis.strengths.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          style={{
                            fontSize:
                              '12px',
                            color:
                              '#cbd5e1',
                            marginTop:
                              '4px'
                          }}
                        >
                          ✓ {item}
                        </div>
                      )
                    )}
                  </div>

                  <div>
                    <strong
                      style={{
                        color:
                          '#facc15'
                      }}
                    >
                      Improve
                    </strong>

                    {lastAnswerAnalysis.improvements.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          style={{
                            fontSize:
                              '12px',
                            color:
                              '#cbd5e1',
                            marginTop:
                              '4px'
                          }}
                        >
                          → {item}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* LIVE TRANSCRIPT */}

              {isRecording && (
                <div
                  style={{
                    background:
                      '#111827',
                    border:
                      '1px solid #10b981',
                    padding:
                      '12px',
                    borderRadius:
                      '8px',
                    marginBottom:
                      '10px'
                  }}
                >
                  <div
                    style={{
                      color:
                        '#10b981',
                      fontSize:
                        '10px',
                      fontWeight:
                        800,
                      marginBottom:
                        '5px'
                    }}
                  >
                    LIVE TRANSCRIPT
                  </div>

                  <div
                    style={{
                      fontSize:
                        '13px',
                      color:
                        '#e2e8f0'
                    }}
                  >
                    {userInput ||
                      'Listening...'}
                  </div>
                </div>
              )}

              {/* CONTROLS */}

              {interviewStarted && (
                <>
                  <div
                    style={{
                      display:
                        'flex',
                      gap:
                        '8px'
                    }}
                  >
                    <button
                      onClick={
                        isRecording
                          ? stopRecordingAndAnalyze
                          : startRecording
                      }
                      disabled={
                        isSpeaking ||
                        isAnalyzing
                      }
                      style={{
                        flex:
                          1,
                        padding:
                          '13px',
                        border:
                          'none',
                        borderRadius:
                          '8px',
                        background:
                          isRecording
                            ? '#dc2626'
                            : '#10b981',
                        color:
                          '#fff',
                        fontWeight:
                          800,
                        cursor:
                          isSpeaking ||
                          isAnalyzing
                            ? 'not-allowed'
                            : 'pointer'
                      }}
                    >
                      {isRecording
                        ? '⏹️ Stop & Analyze Answer'
                        : isAnalyzing
                        ? '🧠 Analyzing...'
                        : '🎙️ Answer Question'}
                    </button>

                    <button
                      onClick={
                        stopInterview
                      }
                      style={{
                        padding:
                          '13px 18px',
                        background:
                          '#7f1d1d',
                        color:
                          '#fff',
                        border:
                          '1px solid #ef4444',
                        borderRadius:
                          '8px',
                        fontWeight:
                          700,
                        cursor:
                          'pointer'
                      }}
                    >
                      End
                    </button>
                  </div>

                  {/* TEXT FALLBACK */}

                  <div
                    style={{
                      display:
                        'flex',
                      gap:
                        '8px',
                      marginTop:
                        '8px'
                    }}
                  >
                    <input
                      value={
                        isRecording
                          ? ''
                          : userInput
                      }
                      onChange={(e) =>
                        setUserInput(
                          e.target
                            .value
                        )
                      }
                      disabled={
                        isRecording ||
                        isSpeaking ||
                        isAnalyzing
                      }
                      placeholder="Or type your answer here..."
                      style={{
                        flex: 1,
                        padding:
                          '11px',
                        background:
                          '#0f172a',
                        color:
                          '#fff',
                        border:
                          '1px solid #334155',
                        borderRadius:
                          '6px',
                        boxSizing:
                          'border-box'
                      }}
                    />

                    <button
                      onClick={() => {
                        const answer =
                          userInput.trim();

                        if (
                          answer
                        ) {
                          analyzeAndContinue(
                            answer
                          );

                          setUserInput(
                            ''
                          );
                        }
                      }}
                      disabled={
                        !userInput.trim() ||
                        isRecording ||
                        isSpeaking ||
                        isAnalyzing
                      }
                      style={{
                        padding:
                          '11px 18px',
                        background:
                          '#0284c7',
                        color:
                          '#fff',
                        border:
                          'none',
                        borderRadius:
                          '6px',
                        fontWeight:
                          700,
                        cursor:
                          'pointer'
                      }}
                    >
                      Analyze
                    </button>
                  </div>
                </>
              )}

              {/* STATUS */}

              <div
                style={{
                  marginTop:
                    '12px',
                  textAlign:
                    'center',
                  color:
                    '#64748b',
                  fontSize:
                    '10px'
                }}
              >
                The interviewer analyzes
                your answer before asking
                the next question.
              </div>
            </div>

            {/* =================================================
                INTERVIEW SUMMARY
            ================================================= */}

            {interviewAnswers.length >
              0 && (
              <div
                style={{
                  marginTop:
                    '20px',
                  background:
                    '#1e293b',
                  padding:
                    '20px',
                  borderRadius:
                    '10px'
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    color:
                      '#38bdf8'
                  }}
                >
                  📈 Interview Progress
                </h3>

                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(130px, 1fr))',
                    gap:
                      '10px'
                  }}
                >
                  {interviewAnswers.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        style={{
                          background:
                            '#0f172a',
                          padding:
                            '14px',
                          borderRadius:
                            '8px',
                          textAlign:
                            'center'
                        }}
                      >
                        <div
                          style={{
                            color:
                              '#64748b',
                            fontSize:
                              '11px'
                          }}
                        >
                          Answer{' '}
                          {index +
                            1}
                        </div>

                        <div
                          style={{
                            fontSize:
                              '24px',
                            fontWeight:
                              800,
                            color:
                              item
                                .analysis
                                .score >=
                              75
                                ? '#4ade80'
                                : item
                                    .analysis
                                    .score >=
                                  55
                                ? '#facc15'
                                : '#f87171'
                          }}
                        >
                          {
                            item
                              .analysis
                              .score
                          }
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}