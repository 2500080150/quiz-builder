# QuizCraft - Interactive Quiz Builder & Live Arena

A modern, responsive, and feature-packed web application for building, sharing, and playing interactive quizzes. Built entirely with vanilla **HTML5**, **CSS3**, and **modern JavaScript (ES6+)**.

---

## 🌟 Key Features

### 1. 🔐 User Authentication & Roles
- **Registration**: Custom name, email, password strength validation, avatar selector (12 animated emojis), and role assignment (**Educator**, **Student**, or **Trivia Master**).
- **Login**: Email + password authentication with persistent session state.
- **Quick Demo Logins**: 1-click login presets for instant testing:
  - 👩‍🏫 **Teacher Sarah** (`teacher@quizcraft.io` / `password123`)
  - 🚀 **Student Alex** (`student@quizcraft.io` / `password123`)
- **Guest Player Mode**: Jump straight into taking quizzes or joining live games without signing up.

### 2. ✏️ Dynamic Quiz Builder & Question Editor
- **Metadata Configuration**:
  - Quiz Title & Description
  - Category (Technology, Science, Geography, Entertainment, General)
  - Difficulty Levels (Beginner, Intermediate, Hard)
  - Custom Cover Emoji & Passing Score Percentage (e.g. 70%)
  - Configurable Time Limit (in seconds, or 0 for untimed)
- **3 Question Types Supported**:
  1. **Multiple Choice (MCQ)**: 2 to 6 options with radio selection for the correct answer, dynamic option addition/removal, and custom feedback explanations.
  2. **True / False**: Bold tactile True/False selector with visual color indicators.
  3. **Open-Ended / Short Answer**: Flexible matching against accepted keywords (comma-separated, case-insensitive, whitespace-trimmed).
- **Builder Capabilities**:
  - Reorder questions (Move Up / Move Down)
  - Duplicate questions
  - Delete questions with confirmation
  - Live Validation: ensures questions have prompts, options, and designated correct answers
  - **Live Test Preview**: Test-run the quiz in a modal sandbox before publishing
  - Save, edit existing quizzes, and delete quizzes

### 3. 🎮 Solo Quiz Taking Experience
- **Progress Tracking**: Real-time progress bar and "Question X of Y" indicator.
- **Live Countdown Timer**: Visual timer badge with red pulsating alert and audible ticks under 10 seconds.
- **Question Map Drawer**: Jump directly to any question; highlights answered, current, and flagged questions.
- **Keyboard Shortcuts**:
  - Keys `1`, `2`, `3`, `4` to pick options
  - Keys `T` / `F` for True / False
  - `ArrowRight` / `Enter` for Next, `ArrowLeft` for Previous
- **Flag for Review**: Bookmark difficult questions to review before submission.
- **Immediate Feedback Mode**: Optional mode that instantly reveals whether your choice was right or wrong along with an educational explanation.

### 4. ⚡ Live Arena (Real-Time Multiplayer Competition)
- **Host Room Mode**:
  - Generates a unique 6-digit Game PIN (e.g. `742 918`).
  - Real-time Lobby displaying connected players.
  - Multi-tab synchronization via standard **`BroadcastChannel` API**: open another tab or incognito window, enter the PIN, and play synchronously!
  - **AI Competitors**: Instantly summon simulated bots (e.g., *Brainy Bot*, *Speedy Sam*, *QuizWhiz Zoe*) to test multiplayer anytime.
  - Synchronized countdown: `3... 2... 1... GO!`.
- **Kahoot-Style Competitive Rounds**:
  - 15-second round timers per question.
  - Speed-based scoring algorithm (up to 1,000 pts per question + streak multiplier).
  - Live animated leaderboard showing ranks and point progression after every question.
  - **3D Victory Podium**: Celebration screen with 1st, 2nd, and 3rd place pillars, bouncing crown, and animated confetti!

### 5. 📊 Analytics, Scorecards & Report Generator
- **Performance Breakdown**:
  - Overall score, percentage, correct/wrong ratio, time elapsed, and Pass/Fail badge.
  - Accuracy breakdown categorized by question type (MCQ vs True/False vs Open-Ended).
- **Question-by-Question Review**:
  - Compare user's response against correct answer.
  - Comprehensive explanation cards.
  - Filterable by: *All*, *Correct*, or *Incorrect*.
- **Exporting & Sharing**:
  - **Printable Certificate & Official Report**: Styled with `@media print` for saving directly to PDF or printing.
  - **CSV Export**: Download complete assessment spreadsheet.
  - **Direct Link Sharing**: Copyable shareable URLs (`?quiz=quiz_id`).
  - **JSON Export & Import**: Download quiz schema or import custom quiz packs.

### 6. 🎨 Design & Polish
- **Modern Aesthetic**: Glassmorphism, smooth micro-interactions, responsive flexbox/grid layout.
- **Theme Support**: Seamless Dark Mode & Light Mode switcher.
- **Zero-Dependency Web Audio API**: Procedurally synthesized sound effects (chimes, clicks, buzzer, ticking, victory fanfare) with a mute toggle.
- **HTML5 Canvas Confetti**: Lightweight particle explosion on quiz completion and podium wins.

---

## 🚀 How to Run the Application

You can run this application directly in any modern browser without any build tools or dependencies:

### Option 1: Open Directly in Browser
Double-click `index.html` or open it with your browser:
```
file:///C:/Users/simha/.gemini/antigravity/scratch/quiz-builder/index.html
```

### Option 2: Run with Local HTTP Server (Recommended for multi-tab testing)
Using Python:
```bash
cd C:\Users\simha\.gemini\antigravity\scratch\quiz-builder
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

Using Node.js:
```bash
cd C:\Users\simha\.gemini\antigravity\scratch\quiz-builder
npx serve .
```

---

## 📂 Project Directory Structure

```
quiz-builder/
├── index.html              # Main application shell (single-page app)
├── README.md               # Documentation and usage guide
├── css/
│   ├── style.css           # Design system, CSS variables, dark/light themes, components
│   ├── animations.css      # Keyframes for confetti, podium, countdowns, and modals
│   └── responsive.css      # Mobile and tablet responsiveness
└── js/
    ├── app.js              # Main SPA router, modal manager, and confetti engine
    ├── audio.js            # Web Audio API sound synthesizer (zero external audio files)
    ├── auth.js             # User login, registration, session, and demo profiles
    ├── store.js            # LocalStorage persistence, seed quizzes, and import/export
    ├── builder.js          # Quiz creation, question editor (MCQ, True/False, Open-ended)
    ├── player.js           # Solo quiz player, countdown timer, keyboard navigation
    ├── live.js             # Real-time Live Arena (BroadcastChannel multi-tab + AI bots)
    └── reports.js          # Scorecards, performance charts, CSV export, print certificate
```
