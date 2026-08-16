"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const jobRoles = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Python Developer",
  "Java Developer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Software Engineer",
];

const experienceLevels = [
  "Fresher",
  "1–2 Years",
  "3–5 Years",
  "5+ Years",
];

const interviewTypes = [
  "Technical",
  "Behavioral",
  "Mixed",
];

const difficulties = [
  "Easy",
  "Medium",
  "Hard",
];

const questionCounts = [5, 10, 15];

export default function InterviewSetupPage() {
  const router = useRouter();

  const [jobRole, setJobRole] = useState("Frontend Developer");
  const [experience, setExperience] = useState("Fresher");
  const [interviewType, setInterviewType] = useState("Mixed");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionCount, setQuestionCount] = useState(10);
  
  // Resume state
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setResumeText(content);
    };
    reader.readAsText(file);
  };

  const handleStart = () => {
    if (resumeText.trim()) {
      sessionStorage.setItem("candidateResume", resumeText.trim());
    } else {
      sessionStorage.removeItem("candidateResume");
    }

    const params = new URLSearchParams({
      role: jobRole,
      experience,
      type: interviewType,
      difficulty,
      questions: questionCount.toString(),
    });

    router.push(`/interview?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 transition hover:text-white"
          >
            ← Back
          </button>

          <div className="text-sm font-medium text-gray-400">
            Interview Setup
          </div>

          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-600">
            Step 1
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Configure your interview
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-gray-500">
            Tell us what you're preparing for and we'll create a personalized
            AI interview for you.
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {/* Job Role */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-300">
              Job Role
            </label>

            <select
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition focus:border-white/30"
            >
              {jobRoles.map((role) => (
                <option
                  key={role}
                  value={role}
                  className="bg-[#111217]"
                >
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-300">
              Experience Level
            </label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {experienceLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setExperience(level)}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    experience === level
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Type */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-300">
              Interview Type
            </label>

            <div className="grid grid-cols-3 gap-3">
              {interviewTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setInterviewType(type)}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    interviewType === type
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-300">
              Difficulty
            </label>

            <div className="grid grid-cols-3 gap-3">
              {difficulties.map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    difficulty === level
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-300">
              Number of Questions
            </label>

            <div className="grid grid-cols-3 gap-3">
              {questionCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  className={`rounded-xl border px-4 py-3 text-sm transition ${
                    questionCount === count
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Resume Section */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-300">
              Tailor to your Resume (Optional)
            </label>
            
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <p className="text-xs text-gray-500">
                Upload your resume file (.txt format) or paste your resume details (experience, projects, skills) to get hyper-custom questions.
              </p>
              
              <div className="flex flex-col gap-4">
                {/* File Upload wrapper */}
                <div className="relative flex items-center gap-3">
                  <input
                    type="file"
                    accept=".txt"
                    id="resume-file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <label
                    htmlFor="resume-file"
                    className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-semibold text-gray-300 cursor-pointer transition"
                  >
                    Choose .txt Resume File
                  </label>
                  <span className="text-xs text-gray-500 font-mono">
                    {fileName || "No file chosen"}
                  </span>
                </div>

                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Or paste your resume details directly here..."
                  className="min-h-36 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white outline-none placeholder:text-gray-700 focus:border-white/30 transition duration-200"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-medium text-gray-400">
              Interview Summary
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-gray-600">Role</p>
                <p className="mt-1 font-medium">{jobRole}</p>
              </div>

              <div>
                <p className="text-gray-600">Experience</p>
                <p className="mt-1 font-medium">{experience}</p>
              </div>

              <div>
                <p className="text-gray-600">Type</p>
                <p className="mt-1 font-medium">{interviewType}</p>
              </div>

              <div>
                <p className="text-gray-600">Difficulty</p>
                <p className="mt-1 font-medium">{difficulty}</p>
              </div>
            </div>
            {resumeText.trim() && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-purple-400 font-medium">
                <span>✓</span>
                <span>Tailoring interview to your resume context ({resumeText.trim().length} chars)</span>
              </div>
            )}
          </div>

          {/* Start */}
          <button
            onClick={handleStart}
            className="w-full rounded-xl bg-white py-4 font-semibold text-black transition hover:bg-gray-200"
          >
            Start AI Interview →
          </button>
        </div>
      </section>
    </main>
  );
}