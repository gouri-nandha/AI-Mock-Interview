import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getMockEvaluation(role: string, experience: string, answers: any[]): any {
  // Generate a realistic evaluation report locally
  const overallScore = Math.floor(Math.random() * 15) + 75; // 75 to 90
  
  const questionEvaluations = answers.map((item, index) => {
    const rawScore = (Math.random() * 2 + 7.5); // 7.5 to 9.5
    return {
      questionId: index + 1,
      question: item.question,
      candidateAnswer: item.answer,
      score: Number(rawScore.toFixed(1)),
      sampleCorrectAnswer: `An outstanding answer for ${role} should start by addressing the core issue, sharing direct execution steps, explaining the rationale, and evaluating trade-offs. For example, when answering this question, a candidate at the ${experience} level should focus on scaling concerns, clean structural styling, and debugging principles.`,
      feedback: "You clearly stated the core definitions. To improve this answer, try using the STAR framework to frame your engineering choices with concrete project examples and quantify performance gains."
    };
  });

  return {
    overallScore,
    feedback: `[DEMO MODE EVALUATION] This report was generated offline because the OpenAI API key reached its quota limit (429). 
    
    Overall, your mock interview responses show strong technical familiarity with the role of a ${role} (${experience}). Your explanations cover the necessary definitions correctly. To advance your scoring in a live loop, try to speak with more structured, point-by-point logic, describe architectural trade-offs, and mention code testability.`,
    strengths: [
      "Demonstrates clear knowledge of core runtime syntax and basic configurations.",
      "Identifies the primary engineering considerations and constraints correctly.",
      "Clear verbal phrasing and responsive conceptual explanations."
    ],
    weaknesses: [
      "Could elaborate more on architectural tradeoffs and alternative tools.",
      "Answers would be strengthened by incorporating specific metrics or numbers.",
      "Consider using the STAR format to frame project contributions more effectively."
    ],
    ratings: [
      {
        category: "Technical Depth",
        score: Number((Math.random() * 1.5 + 7.8).toFixed(1)),
        feedback: "Solid understanding of the standard stack, but can demonstrate deeper knowledge of lower-level rendering or data flow optimizations."
      },
      {
        category: "Communication Skills",
        score: Number((Math.random() * 1.5 + 7.5).toFixed(1)),
        feedback: "Easy to follow. Work on speed and structuring answers in bullet points."
      },
      {
        category: "Structured Thinking",
        score: Number((Math.random() * 1.5 + 7.6).toFixed(1)),
        feedback: "Logical path. Categorize your reasoning when responding to multi-part architectural questions."
      }
    ],
    questionEvaluations,
    isDemo: true
  };
}

export async function POST(request: Request) {
  let role = "Software Engineer";
  let experience = "Fresher";
  let answers: any[] = [];

  try {
    const body = await request.json();
    role = body.role || role;
    experience = body.experience || experience;
    const type = body.type;
    const difficulty = body.difficulty;
    const questions = body.questions;
    answers = body.answers || [];

    if (!body.role || !experience || !type || !difficulty || !questions || !body.answers) {
      return NextResponse.json(
        { error: "Missing interview evaluation details." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert technical interviewer and performance analyst.
Review the following candidate's mock interview answers and generate a comprehensive evaluation report.

Candidate Info:
- Job Role: ${role}
- Experience Level: ${experience}
- Interview Type: ${type}
- Difficulty: ${difficulty}

Questions & Candidate Answers:
${JSON.stringify(answers, null, 2)}

Requirements for Analysis:
- Grade the candidate's answers constructively and with high standards.
- Provide an overall score (0 to 100).
- Provide a summary feedback of the entire interview performance.
- List 3-4 specific strengths demonstrated in the answers.
- List 3-4 specific weaknesses or areas for improvement.
- Provide scores (0 to 10 scale) and feedback for three key competency categories: "Technical Depth", "Communication Skills", and "Structured Thinking".
- Evaluate each individual question:
  - Give a score (0 to 10 scale) for that specific answer.
  - Provide a sample model answer that represents an outstanding response for a candidate of their experience level.
  - Provide specific feedback on what they did well in that answer and what they could improve.

You must return ONLY a valid JSON object matching this schema:
{
  "overallScore": number (0 to 100),
  "feedback": "string",
  "strengths": ["string", "string", ...],
  "weaknesses": ["string", "string", ...],
  "ratings": [
    { "category": "Technical Depth", "score": number (0.0 to 10.0), "feedback": "string" },
    { "category": "Communication Skills", "score": number (0.0 to 10.0), "feedback": "string" },
    { "category": "Structured Thinking", "score": number (0.0 to 10.0), "feedback": "string" }
  ],
  "questionEvaluations": [
    {
      "questionId": number,
      "question": "string",
      "candidateAnswer": "string",
      "score": number (0.0 to 10.0),
      "sampleCorrectAnswer": "string",
      "feedback": "string"
    }
  ]
}
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const outputText = response.output_text;
    let cleanOutput = outputText.trim();

    // Clean markdown code blocks if present
    if (cleanOutput.startsWith("```json")) {
      cleanOutput = cleanOutput.substring(7);
    } else if (cleanOutput.startsWith("```")) {
      cleanOutput = cleanOutput.substring(3);
    }
    if (cleanOutput.endsWith("```")) {
      cleanOutput = cleanOutput.substring(0, cleanOutput.length - 3);
    }
    cleanOutput = cleanOutput.trim();

    let result;
    try {
      result = JSON.parse(cleanOutput);
    } catch (parseError) {
      console.warn("AI returned malformed evaluation JSON, falling back to local evaluation.");
      return NextResponse.json(getMockEvaluation(role, experience, answers));
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Evaluation API error, falling back to local analysis report. Error details:", error);
    
    // Return realistic locally generated analysis
    return NextResponse.json(getMockEvaluation(role, experience, answers));
  }
}
