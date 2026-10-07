type SkillLevel = { skill: string; current: number };
type InterviewResponse = { question: string; answer: string };

const clampScore = (score: number) =>
  Math.max(0, Math.min(100, Math.round(score)));

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

function calculateReadiness(gaps: Array<{ current: number; required: number }>) {
  return clampScore(
    (gaps.reduce(
      (total, gap) => total + Math.min(gap.current / Math.max(gap.required, 1), 1),
      0,
    ) /
      gaps.length) *
      100,
  );
}

function inferResumeLevel(skill: string, resumeText: string): number {
  if (!resumeText.trim()) return 12;
  const resumeWords = new Set(
    resumeText.toLowerCase().match(/[a-z0-9+#.]+/g) ?? [],
  );
  const skillWords = skill
    .toLowerCase()
    .match(/[a-z0-9+#.]+/g)
    ?.filter((word) => word.length > 4) ?? [];
  const matchingWords = skillWords.filter((word) => resumeWords.has(word)).length;
  return clampScore(Math.min(72, 18 + matchingWords * 17));
}

function makeRoleSkillNames(targetRole: string): string[] {
  const roleLabel = normalizeText(targetRole).slice(0, 42);
  return [
    `${roleLabel} fundamentals`,
    `${roleLabel} tools and technologies`,
    `${roleLabel} problem solving`,
    `${roleLabel} workflows and execution`,
    `${roleLabel} communication`,
    `${roleLabel} quality and standards`,
  ].map((skill) => skill.slice(0, 80));
}

function buildFallbackRoadmap(
  targetRole: string,
  gaps: Array<{ skill: string; current: number; required: number }>,
) {
  const priorities = [...gaps].sort(
    (left, right) =>
      right.required - right.current - (left.required - left.current),
  );
  const phases = [
    {
      phase: "30 days" as const,
      title: "Build a reliable foundation",
      focus: `Start with ${priorities[0].skill} and establish a repeatable learning routine.`,
      project: `Create a small ${targetRole} case study that documents a real problem, your approach, and what you learned.`,
    },
    {
      phase: "60 days" as const,
      title: "Apply skills to a real-world brief",
      focus: "Combine the top development areas in one realistic, portfolio-ready exercise.",
      project: `Complete a practical ${targetRole} project using ${priorities[0].skill} and ${priorities[1 % priorities.length].skill}; include a short decision log.`,
    },
    {
      phase: "90 days" as const,
      title: "Present evidence of readiness",
      focus: "Refine your strongest project and practice explaining its impact.",
      project: `Publish a polished ${targetRole} portfolio piece with a clear problem statement, process, outcome, and lessons learned.`,
    },
  ];

  return phases.map((phase, phaseIndex) => {
    const skill = priorities[phaseIndex % priorities.length].skill;
    return {
      phase: phase.phase,
      title: phase.title,
      focus: phase.focus,
      weeklyMilestones: [
        {
          week: "Week 1",
          goal: `Identify the core concepts in ${skill} used by a ${targetRole}.`,
          deliverable: "A one-page learning checklist with three measurable practice goals.",
        },
        {
          week: "Week 2",
          goal: `Complete guided practice in ${skill} and record questions you cannot yet answer.`,
          deliverable: "Two short practice exercises and notes on corrections.",
        },
        {
          week: "Week 3",
          goal: `Apply ${skill} to a small task related to ${targetRole}.`,
          deliverable: "A first draft of the phase project with a short explanation of choices.",
        },
        {
          week: "Week 4",
          goal: "Review the work against the role requirements and ask for feedback.",
          deliverable: "A revised artifact, one improvement note, and a next-month goal.",
        },
      ],
      portfolioProject: phase.project,
      resources: [
        {
          title: `Free beginner lessons for ${skill}`,
          provider: "Open course platforms",
          reason: "Search for a free, structured introduction and practice one lesson at a time.",
          free: true,
        },
        {
          title: `Official guides and documentation for ${skill}`,
          provider: "Official documentation",
          reason: "Use primary references to verify terminology and understand real workflows.",
          free: true,
        },
      ],
      resumeTips: [
        `Add a truthful, outcome-led bullet showing how you practiced ${skill}; include a measurable result when you have one.`,
        "Link the finished project and describe your own contribution without overstating experience.",
      ],
    };
  });
}

export function createLocalSkillTwinAnalysis(
  targetRole: string,
  resumeText = "",
  skillLevels: SkillLevel[] = [],
) {
  const skillNames =
    skillLevels.length > 0
      ? skillLevels.map(({ skill }) => normalizeText(skill).slice(0, 80))
      : makeRoleSkillNames(targetRole);
  const suppliedLevels = new Map(
    skillLevels.map(({ skill, current }) => [
      normalizeText(skill).toLowerCase(),
      current,
    ]),
  );
  const gaps = skillNames.map((skill, index) => {
    const required = [72, 78, 75, 82, 70, 80, 76][index] ?? 75;
    return {
      skill,
      current:
        suppliedLevels.get(skill.toLowerCase()) ??
        inferResumeLevel(skill, resumeText),
      required,
      rationale: `A useful general competency for ${targetRole}; this offline estimate cannot confirm the role's specific tools or standards.`,
      missingTools: [],
    };
  });
  const readiness = calculateReadiness(gaps);
  const priorities = [...gaps].sort(
    (left, right) =>
      right.required - right.current - (left.required - left.current),
  );
  const strengths = [...gaps]
    .sort((left, right) => right.current - left.current)
    .slice(0, 3)
    .map(
      (gap) =>
        `Your current estimate is strongest in ${gap.skill} (${gap.current}%).`,
    );
  const shortfalls = priorities
    .filter((gap) => gap.required > gap.current)
    .slice(0, 3)
    .map(
      (gap) =>
        `${gap.skill} is about ${gap.required - gap.current} points below its general target.`,
    );

  return {
    targetRole,
    source: "local" as const,
    readiness,
    matchScore: readiness,
    summary: `Local estimate for ${targetRole}: ${readiness}% readiness. The offline profile uses broad role competencies, not verified industry-specific requirements. Review the skill labels and adjust your current levels.`,
    strengths:
      strengths.length > 0
        ? strengths
        : [`Your starting baseline is set for a ${targetRole} role.`],
    shortfalls:
      shortfalls.length > 0
        ? shortfalls
        : ["No major general skill gaps were found in this local estimate."],
    gaps,
    roadmap: buildFallbackRoadmap(targetRole, gaps),
  };
}

export function createLocalInterviewQuestions(
  targetRole: string,
  targetCompany = "",
) {
  const company = normalizeText(targetCompany) || "your target organization";
  return {
    source: "local" as const,
    targetRole,
    targetCompany,
    questions: [
      `What interests you about working as a ${targetRole} at ${company}, and what would you focus on in your first 90 days?`,
      `Describe a challenging problem relevant to ${targetRole}. How would you investigate it, choose an approach, and measure success?`,
      `Tell me about a project or experience that shows how you learn new tools and apply feedback in ${targetRole} work.`,
      `How would you explain a complex ${targetRole} decision to a teammate or stakeholder who has a different perspective?`,
    ],
  };
}

export function createLocalInterviewEvaluation(
  targetRole: string,
  targetCompany: string,
  responses: InterviewResponse[],
) {
  const answers = responses.map(({ answer }) => normalizeText(answer));
  const totalWords = answers
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  const avgWords = totalWords / Math.max(responses.length, 1);
  const clarityScore = clampScore(28 + Math.min(avgWords, 120) * 0.55);
  const detailBonus = answers.filter((answer) => /\d|because|result|learn|measur/i.test(answer)).length;
  const technicalAccuracy = clampScore(
    30 + Math.min(avgWords, 90) * 0.45 + detailBonus * 3,
  );
  const overallScore = clampScore(
    clarityScore * 0.45 + technicalAccuracy * 0.55,
  );
  const roleWords = targetRole
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const joinedAnswers = answers.join(" ").toLowerCase();
  const conceptsCovered = roleWords.filter((word) =>
    joinedAnswers.includes(word.toLowerCase()),
  );
  const missedConcepts =
    conceptsCovered.length > 0
      ? ["Specific tools and technical claims could not be verified offline."]
      : ["Role-specific tools, methods, and industry terminology were not assessed offline."];

  return {
    source: "local" as const,
    targetRole,
    targetCompany,
    overallScore,
    clarityScore,
    technicalAccuracy,
    conceptsCovered:
      conceptsCovered.length > 0
        ? conceptsCovered.map((word) => `Role context: ${word}`)
        : ["Clear answer structure and role-specific examples need AI review."],
    missedConcepts,
    summary: `This is a local communication and detail estimate for your ${targetRole} interview${targetCompany ? ` at ${targetCompany}` : ""}. It cannot verify technical accuracy or industry knowledge without AI review.`,
    tips: [
      "Use a clear situation, action, and result structure, then explain what you learned.",
      "Name the role-specific tools, methods, and trade-offs behind each decision.",
      "Add concrete evidence such as scale, constraints, metrics, or stakeholder impact.",
    ],
  };
}

export function calculateSkillReadiness(
  gaps: Array<{ current: number; required: number }>,
): number {
  return calculateReadiness(gaps);
}
