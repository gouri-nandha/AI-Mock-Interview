# AI Mock Interview & Analytics Platform

An advanced, full-stack AI-powered mock interview environment designed to help candidates prepare for technical, behavioral, and mixed loops. The platform leverages customized AI question generation, Web Speech voice interaction, and detailed performance grading.

---

## 🚀 Key Features

### 1. 🎙️ Immersive Voice Practice
* **Text-to-Speech (TTS)**: The AI interviewer reads out questions naturally (with audio mute/unmute control).
* **AI Speaker Waveform**: Active audio pulse visualizer indicating when the AI is speaking.
* **Speech-to-Text (STT) Dictation**: Live dictation with interim transcription rendering, allowing you to speak your answers and review/edit them manually before submitting.
* **Soundwave Visualizer**: Dynamic soundwave visualizer that pulses during live dictation and rests in a quiet node row when idle.
* **Active Response Timer**: Tracks elapsed time per question to help you monitor pacing.

### 2. 📝 Resume-Tailored Questions
* **Client-Side Text File Parsing**: Upload a `.txt` resume, and the platform parses it instantly using HTML5 `FileReader`.
* **Copy-Paste Integration**: Dedicated resume copy-paste block to support PDF/Word resume details.
* **Hyper-Custom AI Prompting**: Passes your resume context to the OpenAI API to craft questions tailored to your actual projects, achievements, and technical stack.

### 3. 📊 Deep Performance Analytics Dashboard
* **Circular Progress Scorecard**: Glowing, color-coded radial progress bar showing your overall performance percentage.
* **Competency Matrix**: Slider bars evaluating your skills in **Technical Depth**, **Communication**, and **Structured Thinking** (scored out of 10).
* **Question-by-Question Accordion**: Expansion cards comparing your verbatim dictation answer side-by-side with specific AI feedback and an outstanding **Model Answer** key.

### 4. 📈 History & Database Sync
* **Session Persistence**: Saves all interview results under your Firebase Authentication UID.
* **Dashboard Summary**: Displays total completed interviews, your overall average score, and past interview history cards.
* **Direct Report URLs**: Rewrites browser history state to `/interview/results?id={id}` on completion to support direct URL sharing, bookmarking, and reloading without incurring extra AI API costs.

### 🔌 Quota Fallback Mode (Demo Mode)
If your OpenAI API key exceeds its billing limit (429 Rate Limit error), the backend automatically triggers **Demo Fallback Mode**:
* Generates realistic, role-specific questions locally from an offline mock questions store (supporting 8 roles: Frontend, Backend, Full Stack, Python, Java, Data Science, ML, and general Software Engineering).
* Calculates realistic feedback and ratings locally so the end-to-end interview flow remains fully testable.

---

## 🛠️ Technology Stack

* **Frontend Framework**: Next.js (App Router)
* **Styling**: Tailwind CSS v4 (Vanilla Modern Glassmorphism & Dark Mode)
* **Database & Auth**: Firebase (Authentication + Cloud Firestore)
* **AI Engine**: OpenAI SDK (`gpt-5-mini` with responses API)
* **Voice Engine**: HTML5 Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)

---

## ⚙️ Project Setup

### 1. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Firebase credentials and OpenAI API Key:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
OPENAI_API_KEY="sk-proj-your-openai-api-key"
```

2. Install Dependencies
```
npm install
```
4. Run Development Server
```
npm run dev
```

check it out 👇🏽
Open http://localhost:3000 in your browser to start practicing.
