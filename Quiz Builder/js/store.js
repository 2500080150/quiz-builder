/* ==========================================================================
   QuizCraft - Data Store & LocalStorage Persistence
   ========================================================================== */

const STORAGE_KEYS = {
  USERS: 'quizcraft_users',
  CURRENT_USER: 'quizcraft_current_user',
  QUIZZES: 'quizcraft_quizzes',
  ATTEMPTS: 'quizcraft_attempts',
  SETTINGS: 'quizcraft_settings'
};

const DEFAULT_USERS = [
  {
    id: 'user_teacher_1',
    name: 'Prof. Sarah Jenkins',
    email: 'teacher@quizcraft.io',
    password: 'password123',
    role: 'Educator',
    avatar: '👩‍🏫',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user_student_1',
    name: 'Alex Rivera',
    email: 'student@quizcraft.io',
    password: 'password123',
    role: 'Student',
    avatar: '🚀',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_QUIZZES = [
  {
    id: 'quiz_web_dev',
    title: 'Fullstack Web Development & JS Masterclass',
    description: 'Test your understanding of modern JavaScript, DOM manipulation, asynchronous programming, and web standards.',
    category: 'Technology',
    difficulty: 'Intermediate',
    icon: '💻',
    timeLimit: 120, // 2 minutes
    passPercentage: 70,
    shuffleQuestions: true,
    shuffleOptions: true,
    instantFeedback: false,
    authorId: 'user_teacher_1',
    authorName: 'Prof. Sarah Jenkins',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'Which of the following methods creates a new array populated with the results of calling a provided function on every element in the calling array?',
        options: ['filter()', 'map()', 'forEach()', 'reduce()'],
        correctAnswers: [1], // Index 1: map()
        explanation: 'Array.prototype.map() calls a provided callback function once for each element in an array and constructs a new array from the results.'
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'In JavaScript, the "===" strict equality operator converts operands of different types before comparing.',
        options: ['True', 'False'],
        correctAnswers: [1], // False
        explanation: 'False! The strict equality operator (===) checks both value and type without performing type coercion.'
      },
      {
        id: 'q3',
        type: 'open-ended',
        question: 'What JavaScript keyword is used inside an async function to pause execution until a Promise settles?',
        acceptedKeywords: ['await', 'await keyword'],
        explanation: 'The "await" operator pauses async function execution until a Promise resolves or rejects.'
      },
      {
        id: 'q4',
        type: 'multiple-choice',
        question: 'Which of the following are valid primitive data types in JavaScript? (Choose the correct one)',
        options: ['Symbol', 'Array', 'Function', 'Object'],
        correctAnswers: [0], // Symbol
        explanation: 'JavaScript primitives include: string, number, bigint, boolean, undefined, symbol, and null. Array and Function are object subtypes.'
      },
      {
        id: 'q5',
        type: 'true-false',
        question: 'CSS Grid is inherently a two-dimensional layout system, whereas Flexbox is primarily one-dimensional.',
        options: ['True', 'False'],
        correctAnswers: [0], // True
        explanation: 'True! CSS Grid is engineered to handle rows and columns simultaneously (2D), while Flexbox handles items in one direction at a time (1D).'
      }
    ]
  },
  {
    id: 'quiz_cosmos',
    title: 'Cosmos & Planetary Science Trivia',
    description: 'Embark on an astronomical journey exploring the mysteries of the solar system, stars, and galaxies.',
    category: 'Science',
    difficulty: 'Beginner',
    icon: '🪐',
    timeLimit: 90,
    passPercentage: 60,
    shuffleQuestions: true,
    shuffleOptions: true,
    instantFeedback: false,
    authorId: 'user_teacher_1',
    authorName: 'Prof. Sarah Jenkins',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'c1',
        type: 'multiple-choice',
        question: 'Which planet in our solar system is known as the Red Planet due to iron oxide on its surface?',
        options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
        correctAnswers: [1],
        explanation: 'Mars appears reddish because its regolith (surface material) contains a high amount of iron oxide (rust).'
      },
      {
        id: 'c2',
        type: 'true-false',
        question: 'Light from the Sun takes approximately 8 minutes and 20 seconds to reach Earth.',
        options: ['True', 'False'],
        correctAnswers: [0],
        explanation: 'True! Traveling at 300,000 km/s, solar photons cover the ~150 million kilometer distance to Earth in about 500 seconds.'
      },
      {
        id: 'c3',
        type: 'open-ended',
        question: 'What is the name of the supermassive black hole located at the center of our Milky Way galaxy?',
        acceptedKeywords: ['sagittarius a*', 'sagittarius a', 'sag a*'],
        explanation: 'Sagittarius A* (pronounced "Sagittarius A-star") is the supermassive black hole located at the galactic center of the Milky Way.'
      },
      {
        id: 'c4',
        type: 'multiple-choice',
        question: 'What is the hottest planet in our solar system, with surface temperatures exceeding 450°C (850°F)?',
        options: ['Mercury', 'Venus', 'Mars', 'Saturn'],
        correctAnswers: [1],
        explanation: 'Venus is hotter than Mercury despite being farther from the Sun, due to a runaway greenhouse effect from its thick CO2 atmosphere.'
      }
    ]
  },
  {
    id: 'quiz_world_geo',
    title: 'World Geography & Natural Wonders',
    description: 'Challenge your global knowledge of continents, capitals, mountain ranges, and oceans.',
    category: 'Geography',
    difficulty: 'Hard',
    icon: '🌍',
    timeLimit: 100,
    passPercentage: 70,
    shuffleQuestions: true,
    shuffleOptions: true,
    instantFeedback: false,
    authorId: 'user_teacher_1',
    authorName: 'Prof. Sarah Jenkins',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'g1',
        type: 'multiple-choice',
        question: 'What is the capital city of Australia?',
        options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'],
        correctAnswers: [2],
        explanation: 'Canberra was selected as the compromise capital of Australia in 1908 between rivals Sydney and Melbourne.'
      },
      {
        id: 'g2',
        type: 'true-false',
        question: 'The Amazon River is the longest river in the world according to the Guinness World Records (surpassing the Nile).',
        options: ['True', 'False'],
        correctAnswers: [1], // False (Nile is traditionally recognized)
        explanation: 'False! The Nile is traditionally recognized as the longest river (~6,650 km), although ongoing scientific expeditions continue to measure Amazon tributaries.'
      },
      {
        id: 'g3',
        type: 'open-ended',
        question: 'Which desert is the largest hot desert on Earth?',
        acceptedKeywords: ['sahara', 'sahara desert'],
        explanation: 'The Sahara Desert covers over 9 million square kilometers across Northern Africa, making it the largest hot desert.'
      }
    ]
  }
];

class Store {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUIZZES)) {
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(DEFAULT_QUIZZES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTEMPTS)) {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify([]));
    }
  }

  // --- User Operations ---
  getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  getCurrentUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  registerUser(userData) {
    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const newUser = {
      id: 'user_' + Date.now(),
      name: userData.name.trim(),
      email: userData.email.trim(),
      password: userData.password,
      role: userData.role || 'Student',
      avatar: userData.avatar || '🎓',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);
    return newUser;
  }

  loginUser(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password.');
    }
    this.setCurrentUser(user);
    return user;
  }

  // --- Quiz Operations ---
  getQuizzes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]');
  }

  getQuizById(id) {
    const quizzes = this.getQuizzes();
    return quizzes.find(q => q.id === id) || null;
  }

  saveQuiz(quiz) {
    const quizzes = this.getQuizzes();
    const existingIndex = quizzes.findIndex(q => q.id === quiz.id);

    if (existingIndex >= 0) {
      quizzes[existingIndex] = { ...quiz, updatedAt: new Date().toISOString() };
    } else {
      quizzes.unshift({
        ...quiz,
        id: quiz.id || 'quiz_' + Date.now(),
        createdAt: new Date().toISOString()
      });
    }

    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    return quiz;
  }

  deleteQuiz(id) {
    const quizzes = this.getQuizzes().filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    return true;
  }

  // --- Quiz Attempts & Score Tracking ---
  getAttempts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '[]');
  }

  saveAttempt(attempt) {
    const attempts = this.getAttempts();
    const record = {
      id: 'att_' + Date.now(),
      timestamp: new Date().toISOString(),
      ...attempt
    };
    attempts.unshift(record);
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
    return record;
  }

  getUserAttempts(userId) {
    const attempts = this.getAttempts();
    return attempts.filter(a => a.userId === userId);
  }

  // --- Export & Import ---
  exportQuizJSON(quizId) {
    const quiz = this.getQuizById(quizId);
    if (!quiz) return null;
    const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quiz.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_quiz.json`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  importQuizJSON(jsonText) {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.title || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid quiz schema: Missing title or questions array.');
      }
      parsed.id = 'quiz_' + Date.now();
      parsed.title = parsed.title + ' (Imported)';
      parsed.createdAt = new Date().toISOString();
      return this.saveQuiz(parsed);
    } catch (err) {
      throw new Error('Failed to import quiz: ' + err.message);
    }
  }

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(DEFAULT_QUIZZES));
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify([]));
  }
}

// Global Store Instance
window.store = new Store();
