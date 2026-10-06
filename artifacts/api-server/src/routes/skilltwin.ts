import { Router, type IRouter, type Request, type Response } from "express";
import {
  AnalyzeSkillTwinBody,
  AnalyzeSkillTwinResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

type SkillName = "Python" | "SQL" | "Excel" | "Statistics" | "Communication";
type SkillInput = { skill: SkillName; current: number };

const ROLE_REQUIREMENTS: Record<string, Partial<Record<SkillName, number>>> = {
  "Data Analyst": {
    Python: 72,
    SQL: 78,
    Excel: 82,
    Statistics: 70,
    Communication: 72,
  },
  "Software Engineer": {
    Python: 82,
    SQL: 58,
    Excel: 35,
    Statistics: 55,
    Communication: 68,
  },
  "Product Manager": {
    Python: 35,
    SQL: 58,
    Excel: 62,
    Statistics: 60,
    Communication: 86,
  },
};

const DEFAULT_REQUIREMENTS: Record<SkillName, number> = {
  Python: 65,
  SQL: 65,
  Excel: 65,
  Statistics: 65,
  Communication: 70,
};

function calculateReadiness(
  gaps: Array<{ current: number; required: number }>,
): number {
  return Math.round(
    (gaps.reduce(
      (total, gap) => total + Math.min(gap.current / gap.required, 1),
      0,
    ) /
      gaps.length) *
      100,
  );
}

function createLocalAnalysis(targetRole: string, skills: SkillInput[]) {
  const requirements =
    ROLE_REQUIREMENTS[targetRole] ?? DEFAULT_REQUIREMENTS;
  const gaps = skills.map(({ skill, current }) => ({
    skill,
    current,
    required: requirements[skill] ?? DEFAULT_REQUIREMENTS[skill],
    rationale: `${skill} is a useful foundation for ${targetRole}; this local estimate uses a general role-readiness target.`,
  }));
  const priorities = [...gaps].sort(
    (left, right) =>
      right.required - right.current - (left.required - left.current),
  );
  const topGap = priorities[0];
  const readiness = calculateReadiness(gaps);
  const phases = [
    {
      phase: "30 days" as const,
      title: "Strengthen the foundations",
      focus: `Start with ${topGap.skill}, the largest estimated gap for ${targetRole}.`,
      actionTitle: (skill: SkillName) => `Build ${skill} fundamentals`,
      description: (skill: SkillName) =>
        `Complete two structured lessons in ${skill} and practice the core concepts for at least three short sessions each week.`,
      effort: "medium" as const,
    },
    {
      phase: "60 days" as const,
      title: "Turn practice into proof",
      focus: "Apply the priority skills to a small, role-relevant project.",
      actionTitle: (skill: SkillName) => `Practice ${skill} in a real task`,
      description: (skill: SkillName) =>
        `Use ${skill} to solve a focused problem related to ${targetRole}, then write down your approach and result.`,
      effort: "medium" as const,
    },
    {
      phase: "90 days" as const,
      title: "Show your readiness",
      focus: "Polish a portfolio example and prepare to explain your decisions.",
      actionTitle: (skill: SkillName) => `Present your ${skill} work`,
      description: (skill: SkillName) =>
        `Add a finished ${skill} example to your portfolio and rehearse a concise explanation of the choices you made.`,
      effort: "high" as const,
    },
  ];
  const roadmap = phases.map((phase, index) => {
    const primarySkill = priorities[index % priorities.length].skill;
    const supportingSkill =
      priorities[(index + 1) % priorities.length].skill;
    return {
      phase: phase.phase,
      title: phase.title,
      focus: phase.focus,
      actions: [primarySkill, supportingSkill].map((skill) => ({
        title: phase.actionTitle(skill),
        description: phase.description(skill),
        skill,
        effort: phase.effort,
      })),
    };
  });

  return AnalyzeSkillTwinResponse.parse({
    targetRole,
    source: "local",
    readiness,
    summary: `Local estimate: ${readiness}% readiness for ${targetRole}. Focus first on ${topGap.skill}, then use the 90-day plan to build practical evidence of your progress.`,
    gaps,
    roadmap,
  });
}

function respondWithLocalEstimate(
  req: Request,
  res: Response,
  targetRole: string,
  skills: SkillInput[],
  reason: string,
): void {
  req.log.warn({ reason }, "Returning a local SkillTwin estimate");
  res.json(createLocalAnalysis(targetRole, skills));
}

router.post("/skilltwin/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeSkillTwinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Provide a target role and valid skill percentages." });
    return;
  }

  const { targetRole, resumeText, skills } = parsed.data;
  const uniqueSkills = new Set(skills.map(({ skill }) => skill));
  if (uniqueSkills.size !== skills.length) {
    res.status(400).json({ error: "Each skill can only be included once." });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    respondWithLocalEstimate(
      req,
      res,
      targetRole,
      skills as SkillInput[],
      "missing_api_key",
    );
    return;
  }

  const skillNames = skills.map(({ skill }) => skill as SkillName);
  const prompt = [
    "You are a practical career coach helping a student prepare for a target role.",
    "Return only a JSON object with these fields: targetRole, readiness, summary, gaps, roadmap.",
    "For each skill in the supplied list, include one gaps item with skill, current (copy the supplied integer exactly), required (an integer from 1 to 100), and a concise role-specific rationale.",
    "Set readiness to an estimated integer percentage from 0 to 100. It will be recalculated from the skill levels, so focus on the rest of the response.",
    'Return exactly three roadmap items with phase values "30 days", "60 days", and "90 days". Each roadmap item needs title, focus, and 2 to 4 actions.',
    "Each action needs title, description, skill (one supplied skill), and effort (low, medium, or high).",
    "Make actions achievable for a student, specific, measurable where possible, and sequenced from fundamentals to portfolio/interview readiness.",
    "Use the resume only as context. Do not claim experience or skills not supported by the supplied percentages or resume.",
    `Target role: ${targetRole}`,
    `Current skills: ${JSON.stringify(skills)}`,
    `Resume text (may be empty): ${resumeText ?? ""}`,
    `Use only these skill names: ${skillNames.join(", ")}.`,
  ].join("\n");

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "SkillTwin",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.25,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Respond with valid JSON only. Do not wrap it in markdown.",
          },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      req.log.warn(
        { statusCode: response.status },
        "OpenRouter returned an unsuccessful response",
      );
      respondWithLocalEstimate(
        req,
        res,
        targetRole,
        skills as SkillInput[],
        `provider_http_${response.status}`,
      );
      return;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      req.log.warn("OpenRouter response did not include analysis content");
      respondWithLocalEstimate(req, res, targetRole, skills as SkillInput[], "empty_provider_response");
      return;
    }

    let modelOutput: unknown;
    try {
      modelOutput = JSON.parse(content);
    } catch {
      req.log.warn("OpenRouter response was not valid JSON");
      respondWithLocalEstimate(req, res, targetRole, skills as SkillInput[], "invalid_provider_json");
      return;
    }

    const responseData =
      modelOutput && typeof modelOutput === "object"
        ? (modelOutput as Record<string, unknown>)
        : {};
    const rawGaps = Array.isArray(responseData.gaps) ? responseData.gaps : [];
    const hasIncompleteGap = skills.some((skill) => {
      const modelGap = rawGaps.find(
        (candidate) =>
          candidate &&
          typeof candidate === "object" &&
          "skill" in candidate &&
          candidate.skill === skill.skill,
      ) as Record<string, unknown> | undefined;

      return (
        !modelGap ||
        typeof modelGap.required !== "number" ||
        !Number.isFinite(modelGap.required) ||
        typeof modelGap.rationale !== "string" ||
        modelGap.rationale.trim().length === 0
      );
    });
    if (hasIncompleteGap) {
      req.log.warn("OpenRouter analysis omitted required skill-gap details");
      respondWithLocalEstimate(req, res, targetRole, skills as SkillInput[], "incomplete_skill_gaps");
      return;
    }

    const gaps = skills.map((skill) => {
      const modelGap = rawGaps.find(
        (candidate) =>
          candidate &&
          typeof candidate === "object" &&
          "skill" in candidate &&
          candidate.skill === skill.skill,
      ) as Record<string, unknown> | undefined;

      return {
        skill: skill.skill,
        current: skill.current,
        required: Math.max(1, Math.min(100, Math.round(modelGap!.required as number))),
        rationale: (modelGap!.rationale as string).slice(0, 240),
      };
    });

    const readiness = calculateReadiness(gaps);
    const validated = AnalyzeSkillTwinResponse.safeParse({
      targetRole,
      source: "ai",
      readiness,
      summary:
        typeof responseData.summary === "string"
          ? responseData.summary.slice(0, 320)
          : `A focused plan to prepare for a ${targetRole} role.`,
      gaps,
      roadmap: responseData.roadmap,
    });

    if (!validated.success) {
      req.log.warn(
        { validationError: validated.error.message },
        "OpenRouter analysis did not match the SkillTwin response contract",
      );
      respondWithLocalEstimate(req, res, targetRole, skills as SkillInput[], "invalid_provider_output");
      return;
    }

    res.json(validated.data);
  } catch (error) {
    req.log.error(
      { error: error instanceof Error ? error.message : "Unknown error" },
      "SkillTwin analysis request failed",
    );
    respondWithLocalEstimate(
      req,
      res,
      targetRole,
      skills as SkillInput[],
      error instanceof Error && error.name === "TimeoutError"
        ? "provider_timeout"
        : "provider_request_failed",
    );
  }
});

export default router;
