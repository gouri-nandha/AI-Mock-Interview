"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Question = {
  id: number;
  question: string;
  category: string;
  difficulty: string;
};

type Answer = {
  question: string;
  answer: string;
};

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const role = searchParams.get("role");
  const experience = searchParams.get("experience");
  const type = searchParams.get("type");
  const difficulty = searchParams.get("difficulty");
  const questionCount = searchParams.get("questions");

  // Interview flow states
  const [isStarted, setIsStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);

  // System states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  
  // Voice AI (TTS) states
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Timer states
  const [timeElapsed, setTimeElapsed] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error);
      } else {
        console.warn("Speech recognition: no speech detected.");
      }
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAnswer(transcript);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  // Fetch AI generated questions
  useEffect(() => {
    const generateQuestions = async () => {
      try {
        setLoading(true);
        const resumeText = sessionStorage.getItem("candidateResume");
        const response = await fetch("/api/generate-interview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role,
            experience,
            type,
            difficulty,
            questions: Number(questionCount),
            resume: resumeText || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate interview.");
        }

        setQuestions(data.questions);
        if (data.isDemo) {
          setIsDemo(true);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unable to generate interview questions.");
      } finally {
        setLoading(false);
      }
    };

    if (role && experience && type && difficulty && questionCount) {
      generateQuestions();
    } else {
      setError("Invalid interview configuration.");
      setLoading(false);
    }
  }, [role, experience, type, difficulty, questionCount]);

  // Track timer per question
  useEffect(() => {
    if (isStarted && !loading && !error && questions.length > 0) {
      // Clear previous timer
      if (timerRef.current) clearInterval(timerRef.current);
      
      setTimeElapsed(0);
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, currentQuestion, loading, error, questions]);

  // Handle Text-to-Speech read out of question
  const speakQuestion = (text: string) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel(); // Stop current speech
    
    if (isMuted) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to load standard English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith("en-") && v.name.includes("Google"));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-start listening after AI finishes speaking, if speech is supported
      if (speechSupported && recognitionRef.current) {
        startListening();
      }
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Speak when question changes or interview starts
  useEffect(() => {
    if (isStarted && questions.length > 0 && !loading && !error) {
      const q = questions[currentQuestion];
      speakQuestion(q.question);
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isStarted, currentQuestion, questions, loading, error, isMuted]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error("Speech recognition already running:", e);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (nextMuted) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
      }
      return nextMuted;
    });
  };

  const submitAnswer = () => {
    if (!answer.trim()) return;

    const current = questions[currentQuestion];
    const newAnswer: Answer = {
      question: current.question,
      answer: answer.trim(),
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    stopListening();

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setAnswer("");
    } else {
      // Completed, save data and redirect
      const interviewData = {
        role,
        experience,
        type,
        difficulty,
        questions,
        answers: updatedAnswers,
        isDemo,
      };

      sessionStorage.setItem("mockInterview", JSON.stringify(interviewData));
      router.push("/interview/results");
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-500" />
          <h2 className="mt-6 text-xl font-semibold">Preparing your interview...</h2>
          <p className="mt-2 text-sm text-gray-500">AI is crafting custom questions for you.</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] px-6 text-white">
        <div className="max-w-md text-center">
          <div className="text-5xl">⚠️</div>
          <h1 className="mt-6 text-2xl font-bold">Configuration Error</h1>
          <p className="mt-3 text-gray-500">{error}</p>
          <Link
            href="/interview/setup"
            className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200 transition"
          >
            Back to Setup
          </Link>
        </div>
      </main>
    );
  }

  // Pre-interview introduction lobby
  if (!isStarted) {
    return (
      <main className="min-h-screen bg-[#08090d] text-white flex flex-col justify-between">
        {/* Header */}
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-500 transition hover:text-white"
            >
              ← Back
            </button>
            <div className="text-sm font-medium text-gray-400">AI Lobby</div>
            <div className="w-12" />
          </div>
        </header>

        {/* Lobby Content */}
        <section className="mx-auto max-w-2xl px-6 py-12 flex-1 flex flex-col justify-center">
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-3xl mb-6">
              🎙️
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to begin your interview?</h1>
            <p className="mt-4 text-gray-400">
              You will have a mock interview designed specifically for your experience. Read the questions and answer using your microphone or keyboard.
            </p>
          </div>

          {/* Config Details */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Your Session Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-gray-500">Role</p>
                <p className="font-medium text-white">{role}</p>
              </div>
              <div>
                <p className="text-gray-500">Experience</p>
                <p className="font-medium text-white">{experience}</p>
              </div>
              <div>
                <p className="text-gray-500">Interview Type</p>
                <p className="font-medium text-white">{type}</p>
              </div>
              <div>
                <p className="text-gray-500">Questions Count</p>
                <p className="font-medium text-white">{questions.length} questions</p>
              </div>
            </div>
          </div>

          {/* Checks */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.01] p-5 text-sm space-y-3">
            <div className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full ${speechSupported ? "bg-green-500" : "bg-yellow-500"}`} />
              <p className="text-gray-400">
                {speechSupported
                  ? "Speech-to-text dictation is supported on this browser."
                  : "Speech recognition is not fully supported. You can type your answers instead."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <p className="text-gray-400">Text-to-speech audio reader is active.</p>
            </div>
          </div>

          <button
            onClick={() => setIsStarted(true)}
            className="mt-8 w-full rounded-2xl bg-white py-4 font-semibold text-black hover:bg-gray-200 transition hover:scale-[1.02] active:scale-[0.98] duration-200"
          >
            Start Interview Now
          </button>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-6 text-center text-xs text-gray-600">
          Make sure your microphone is connected and you are in a quiet workspace.
        </footer>
      </main>
    );
  }

  const question = questions[currentQuestion];

  return (
    <main className="min-h-screen bg-[#08090d] text-white flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-md bg-[#08090d]/80 sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-ping" />
              Live Interview Room
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {role} · {difficulty}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-mono text-gray-400 flex items-center gap-1.5">
              <span>⏱️</span>
              <span>{formatTime(timeElapsed)}</span>
            </div>

            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className={`p-2 rounded-xl border transition-colors ${
                isMuted
                  ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              title={isMuted ? "Unmute Interviewer" : "Mute Interviewer"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>

            <span className="text-sm font-medium text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              Q: {currentQuestion + 1} / {questions.length}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="mx-auto max-w-4xl px-6 py-8 flex-1 w-full flex flex-col justify-center">
        {isDemo && (
          <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-3 text-xs text-yellow-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>Demo Mode Active: OpenAI API quota exceeded. Questions generated locally offline.</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Panel */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-40 w-40 bg-purple-500/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
              {question.category}
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">
              Level: {question.difficulty}
            </span>
          </div>

          {/* AI Question Box */}
          <div className="mt-8 flex items-start gap-4 p-6 rounded-2xl border border-purple-500/25 bg-purple-950/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent -z-10" />
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/25 text-xl">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">AI Interviewer</span>
                  {isSpeaking && (
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-[2px] bg-purple-400 rounded-full animate-bounce h-1.5" style={{ animationDelay: '0.1s' }} />
                      <span className="w-[2px] bg-purple-400 rounded-full animate-bounce h-3" style={{ animationDelay: '0.2s' }} />
                      <span className="w-[2px] bg-purple-400 rounded-full animate-bounce h-1" style={{ animationDelay: '0.3s' }} />
                      <span className="w-[2px] bg-purple-400 rounded-full animate-bounce h-2.5" style={{ animationDelay: '0.4s' }} />
                    </div>
                  )}
                </div>
                {isSpeaking && (
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full animate-pulse border border-purple-500/10">
                    Speaking
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-lg sm:text-xl font-semibold leading-relaxed text-gray-200">
                {question.question}
              </h2>
            </div>
          </div>

          {/* Answer Text Area */}
          <div className="mt-10">
            <label className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Your Response
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your spoken answer will appear here, or you can type directly..."
              className="min-h-36 w-full resize-none rounded-2xl border border-white/10 bg-black/35 p-5 text-white outline-none placeholder:text-gray-600 focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/40 transition duration-200"
            />
          </div>

          {/* Speech Control Panel */}
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-white/10 bg-black/25 px-6 py-6 border-dashed">
            {/* Visualizer Pulsing waveform */}
            <div className="flex items-end justify-center gap-1.5 h-10 mb-4">
              <span className={`w-1.5 bg-purple-500/40 rounded-full transition-all duration-300 ${isListening ? "h-6 animate-bounce" : "h-1.5"}`} style={{ animationDelay: '0.1s', animationDuration: '0.6s' }} />
              <span className={`w-1.5 bg-indigo-500/40 rounded-full transition-all duration-300 ${isListening ? "h-9 animate-bounce" : "h-1.5"}`} style={{ animationDelay: '0.2s', animationDuration: '0.5s' }} />
              <span className={`w-1.5 bg-purple-400/40 rounded-full transition-all duration-300 ${isListening ? "h-7 animate-bounce" : "h-1.5"}`} style={{ animationDelay: '0.3s', animationDuration: '0.7s' }} />
              <span className={`w-1.5 bg-indigo-400/40 rounded-full transition-all duration-300 ${isListening ? "h-10 animate-bounce" : "h-1.5"}`} style={{ animationDelay: '0.4s', animationDuration: '0.6s' }} />
              <span className={`w-1.5 bg-purple-500/40 rounded-full transition-all duration-300 ${isListening ? "h-4 animate-bounce" : "h-1.5"}`} style={{ animationDelay: '0.5s', animationDuration: '0.8s' }} />
            </div>

            <button
              onClick={isListening ? stopListening : startListening}
              disabled={!speechSupported || isSpeaking}
              className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl transition duration-300 ${
                isListening
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/25 animate-pulse"
                  : "bg-white/10 text-white hover:bg-white/15"
              } ${(!speechSupported || isSpeaking) ? "cursor-not-allowed opacity-35" : ""}`}
            >
              {isListening ? "⏹️" : "🎙️"}
            </button>

            <p className="mt-3 text-sm font-semibold">
              {isListening ? "Listening... Speak now" : isSpeaking ? "Interviewer is reading question..." : "Tap to Speak"}
            </p>

            <p className="mt-1 text-center text-xs text-gray-500 max-w-sm">
              {speechSupported
                ? "Your speech is live-transcribed above. Review or edit manually before submitting."
                : "Speech recognition is unsupported. Please type in your response directly."}
            </p>
          </div>

          {/* Submit Action */}
          <button
            onClick={submitAnswer}
            disabled={!answer.trim()}
            className="mt-8 w-full rounded-2xl bg-white py-4 font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-20 active:scale-[0.99] duration-150"
          >
            {currentQuestion === questions.length - 1 ? "Finish Interview & Run AI Analysis →" : "Submit Answer & Next Question →"}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 text-center text-xs text-gray-600">
        You can speak as long as you'd like, and edit the transcribed text before submitting.
      </footer>
    </main>
  );
}