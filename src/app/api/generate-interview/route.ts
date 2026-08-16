import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Curated questions database for offline/quota fallbacks
const mockDatabase: Record<string, string[]> = {
  "Frontend Developer": [
    "What is the difference between state and props in React, and when would you use one over the other?",
    "Explain how the virtual DOM works in React and how it optimizes rendering performance.",
    "What are CSS modules, and how do they help in scoping CSS in a React component?",
    "Describe the difference between Server Components and Client Components in Next.js.",
    "How do you optimize a website's core web vitals, specifically Largest Contentful Paint (LCP)?",
    "What is the difference between useEffect and useLayoutEffect in React?",
    "Explain the concept of debouncing and throttling. Give a front-end use case for each.",
    "How does client-side routing work under the hood in libraries like React Router or Next.js?",
    "What is hydration in SSR, and why do hydration mismatch errors occur?",
    "Describe the difference between absolute, relative, fixed, and sticky positioning in CSS."
  ],
  "Backend Developer": [
    "Describe the difference between SQL and NoSQL databases, and when you would choose one over the other.",
    "What is database indexing, and how does it improve query speed? Are there any disadvantages?",
    "Explain the concept of RESTful API design principles. What makes an API Restful?",
    "How do you handle horizontal scaling for a stateless backend service?",
    "Describe the role of middleware in a backend framework like Express or Next.js.",
    "What is the N+1 query problem in ORMs, and how can you solve it?",
    "Explain the difference between optimistic and pessimistic locking in databases.",
    "What is a message broker (e.g. RabbitMQ or Kafka), and in what scenarios would you integrate one?",
    "How do you handle password storage securely in a backend system?",
    "Describe the difference between process and thread in backend server concurrency models."
  ],
  "Full Stack Developer": [
    "What is CORS (Cross-Origin Resource Sharing) and how do you handle it in a full-stack application?",
    "Describe how you would design a user authentication system from scratch using JWTs.",
    "Explain the difference between client-side rendering (CSR) and server-side rendering (SSR).",
    "How do you handle state management across client-side page views and database updates?",
    "Describe a scenario where you had to debug a performance bottleneck in a full-stack app.",
    "What are WebSockets, and when would you use them over standard HTTP polling?",
    "Explain how caching (browser, CDN, Redis) works across a typical full-stack architecture.",
    "How do you secure a web application against Cross-Site Scripting (XSS) and CSRF attacks?",
    "Describe your CI/CD pipeline approach for deploying a Next.js frontend with a Node backend.",
    "What is database replication, and how does it improve read scaling vs write scaling?"
  ],
  "Python Developer": [
    "What is the difference between list and tuple in Python, and when is one preferred over the other?",
    "Explain how decorators work in Python and provide a common use case.",
    "Describe how memory management and garbage collection work in Python (Reference counting vs Generational).",
    "What are Python generators and yield statements, and how do they optimize memory usage?",
    "What is the difference between deep copy and shallow copy in Python?",
    "What is the GIL (Global Interpreter Lock) in Python, and how does it affect multi-threading?",
    "Explain the difference between static methods, class methods, and instance methods in Python.",
    "How does dependency management work in Python using virtualenv, pipenv, or poetry?",
    "Describe how you would debug a memory leak in a running Python application.",
    "What is list comprehension in Python, and how does it compare to map and filter functions?"
  ],
  "Java Developer": [
    "What is the difference between an abstract class and an interface in Java 8 and beyond?",
    "Explain how garbage collection works in the JVM. What are the different GC generations?",
    "Describe the difference between Checked and Unchecked exceptions in Java.",
    "What is the Java Memory Model, and how do volatile and synchronized keywords affect concurrency?",
    "Explain how the Spring Boot framework simplifies web service configuration.",
    "What is the difference between fail-fast and fail-safe iterators in Java Collections?",
    "Describe how the HashMap class works under the hood in Java 8 (buckets, linked lists, balanced trees).",
    "What are Java streams and lambda expressions? How do they improve code readability?",
    "Explain the difference between thread-safe structures like ConcurrentHashMap and Collections.synchronizedMap.",
    "What is the difference between JDK, JRE, and JVM?"
  ],
  "Data Scientist": [
    "Explain the difference between supervised and unsupervised learning, and give examples of each.",
    "What is the bias-variance tradeoff in machine learning, and how do you address overfitting?",
    "Describe how random forest handles feature selection and classification.",
    "What is the difference between L1 (Lasso) and L2 (Ridge) regularization?",
    "Explain how a confusion matrix is used to evaluate classification performance metrics.",
    "Describe how K-means clustering algorithm works. How do you find the optimal number of clusters?",
    "What is principal component analysis (PCA), and in what scenario is it useful?",
    "Explain the Central Limit Theorem and its importance in hypothesis testing.",
    "What is the difference between A/B testing and multivariate testing?",
    "Describe how gradient boosting machines (GBM) build sequential estimators."
  ],
  "Machine Learning Engineer": [
    "What is gradient descent, and how do stochastic and batch gradient descent differ?",
    "Describe the architecture of a Convolutional Neural Network (CNN) and how it parses spatial data.",
    "Explain the concept of transfer learning and when you would apply it.",
    "How do you handle class imbalance in a dataset when training a deep learning model?",
    "What is model quantization and pruning, and how do they optimize models for edge deployment?",
    "What is the difference between precision, recall, and F1-score? When is recall more important than precision?",
    "Describe how backpropagation works in neural networks. What is the vanishing gradient problem?",
    "How do you design a real-time inference pipeline for a model with latency SLA constraints?",
    "Explain the attention mechanism in Transformers. What are query, key, and value vectors?",
    "What is the difference between batch normalization and layer normalization?"
  ],
  "Software Engineer": [
    "Explain the SOLID design principles. Pick one and describe its practical importance.",
    "Describe the difference between time and space complexity using Big O notation for Binary Search.",
    "How do you approach writing unit tests and integration tests for a newly written module?",
    "Describe the difference between concurrency and parallelism.",
    "How do you design a simple distributed caching system like Redis?",
    "What is the difference between a process and a thread?",
    "Describe how a load balancer routes requests to multiple application servers.",
    "Explain the difference between vertical scaling and horizontal scaling.",
    "Describe how a DNS query works to resolve a domain name into an IP address.",
    "What is the purpose of Git rebase vs Git merge? When would you use one over the other?"
  ]
};

function getMockQuestions(role: string, count: number, difficulty: string): any[] {
  const questionsList = mockDatabase[role] || mockDatabase["Software Engineer"];
  return Array.from({ length: count }, (_, idx) => {
    const questionText = questionsList[idx % questionsList.length];
    return {
      id: idx + 1,
      question: questionText,
      category: idx % 2 === 0 ? "Technical" : "Conceptual",
      difficulty: difficulty
    };
  });
}

export async function POST(request: Request) {
  let role = "Software Engineer";
  let difficulty = "Medium";
  let questions = 10;

  try {
    const body = await request.json();
    role = body.role || role;
    const experience = body.experience;
    const type = body.type;
    difficulty = body.difficulty || difficulty;
    questions = Number(body.questions) || questions;
    const resume = body.resume;

    if (!body.role || !experience || !type || !difficulty || !body.questions) {
      return NextResponse.json(
        { error: "Missing interview configuration." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert technical interviewer.

Create a realistic mock interview for the following candidate:

Job Role: ${role}
Experience Level: ${experience}
Interview Type: ${type}
Difficulty: ${difficulty}
Number of Questions: ${questions}
${resume ? `\nCandidate Resume Context:\n${resume}\n` : ""}

Generate exactly ${questions} interview questions.

Requirements:
- Questions must match the selected job role.
- Questions must match the candidate's experience level.
- Follow the selected interview type.
- Match the requested difficulty.
${resume ? "- Tailor questions to reference the candidate's projects, experience, tech stack, and responsibilities highlighted in their resume." : ""}
- Avoid duplicate questions.
- Make the questions realistic and useful for actual interview preparation.
- Include a mixture of conceptual, practical, and scenario-based questions where appropriate.

Return ONLY valid JSON.

The JSON format must be:

{
  "questions": [
    {
      "id": 1,
      "question": "Interview question here",
      "category": "Technical",
      "difficulty": "Medium"
    }
  ]
}
`;

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: prompt,
    });

    const output = response.output_text;
    let cleanOutput = output.trim();

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
    } catch {
      console.warn("AI returned malformed JSON, falling back to mock questions database.");
      return NextResponse.json({
        questions: getMockQuestions(role, questions, difficulty),
        isDemo: true,
        warning: "AI returned an invalid JSON response structure. Fallback loaded."
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OpenAI call failed, falling back to local database. Error details:", error);
    
    // Return high quality mock questions matching selected role/difficulty
    return NextResponse.json({
      questions: getMockQuestions(role, questions, difficulty),
      isDemo: true,
      warning: `Demo Mode Active (API Quota Exceeded). Questions generated offline.`
    });
  }
}