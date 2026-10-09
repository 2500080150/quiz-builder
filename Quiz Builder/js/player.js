/* ==========================================================================
   QuizCraft - Solo Quiz Player Engine
   Handles question playback, timers, keyboard navigation, and scoring
   ========================================================================== */

class QuizPlayer {
  constructor() {
    this.quiz = null;
    this.questions = [];
    this.currentIndex = 0;
    this.userAnswers = {}; // { [qId]: selected answer }
    this.flaggedQuestions = new Set();
    this.timeRemaining = 0;
    this.timerInterval = null;
    this.isPreviewMode = false;
    this.startTime = null;
    this.endTime = null;
  }

  init() {
    this.bindEvents();
    this.bindKeyboardShortcuts();
  }

  bindEvents() {
    // Next / Prev buttons
    const btnNext = document.getElementById('player-btn-next');
    const btnPrev = document.getElementById('player-btn-prev');
    const btnSubmit = document.getElementById('player-btn-submit');
    const btnFlag = document.getElementById('player-btn-flag');

    if (btnNext) btnNext.addEventListener('click', () => this.nextQuestion());
    if (btnPrev) btnPrev.addEventListener('click', () => this.prevQuestion());
    if (btnSubmit) btnSubmit.addEventListener('click', () => this.confirmSubmit());
    if (btnFlag) btnFlag.addEventListener('click', () => this.toggleFlag());
  }

  bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Only process when player view is active
      const playerView = document.getElementById('view-player');
      if (!playerView || !playerView.classList.contains('active')) return;

      // Don't intercept typing in text inputs or textareas
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const q = this.questions[this.currentIndex];
      if (!q) return;

      if (q.type === 'multiple-choice') {
        const keyNum = parseInt(e.key, 10);
        if (keyNum >= 1 && keyNum <= (q.options || []).length) {
          this.selectOption(keyNum - 1);
        }
      } else if (q.type === 'true-false') {
        if (e.key.toLowerCase() === 't' || e.key === '1') {
          this.selectOption(0); // True
        } else if (e.key.toLowerCase() === 'f' || e.key === '2') {
          this.selectOption(1); // False
        }
      }

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        this.nextQuestion();
      } else if (e.key === 'ArrowLeft') {
        this.prevQuestion();
      }
    });
  }

  startQuiz(quizData, isPreview = false) {
    this.quiz = quizData;
    this.isPreviewMode = isPreview;
    this.currentIndex = 0;
    this.userAnswers = {};
    this.flaggedQuestions.clear();
    this.startTime = Date.now();

    // Clone questions
    let qs = JSON.parse(JSON.stringify(quizData.questions || []));

    // Shuffle questions if enabled
    if (quizData.shuffleQuestions && !isPreview) {
      qs = this.shuffleArray(qs);
    }

    // Shuffle options if enabled for multiple-choice questions
    if (quizData.shuffleOptions && !isPreview) {
      qs = qs.map(q => {
        if (q.type === 'multiple-choice' && Array.isArray(q.options)) {
          const originalCorrect = q.correctAnswers[0];
          const correctText = q.options[originalCorrect];
          const shuffledOpts = this.shuffleArray([...q.options]);
          const newCorrect = shuffledOpts.indexOf(correctText);
          return {
            ...q,
            options: shuffledOpts,
            correctAnswers: [newCorrect]
          };
        }
        return q;
      });
    }

    this.questions = qs;

    // Setup Timer
    this.timeRemaining = quizData.timeLimit || 0;
    this.startTimer();

    // Render interface
    document.getElementById('player-quiz-title').textContent = quizData.title;
    this.renderQuestion();
    this.renderQuestionMap();

    window.app.navigateTo('player');
    if (window.soundFX) window.soundFX.playClick();
  }

  shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  startTimer() {
    clearInterval(this.timerInterval);
    const timerEl = document.getElementById('player-timer');
    const timerWrap = document.getElementById('player-timer-badge');

    if (!this.timeRemaining || this.timeRemaining <= 0) {
      if (timerWrap) timerWrap.style.display = 'none';
      return;
    }

    if (timerWrap) timerWrap.style.display = 'inline-flex';
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this.updateTimerDisplay();

      if (this.timeRemaining <= 10 && this.timeRemaining > 0) {
        if (timerWrap) timerWrap.classList.add('warning');
        if (window.soundFX) window.soundFX.playTick();
      }

      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        if (window.soundFX) window.soundFX.playWrong();
        window.app.showToast('Time is up! Submitting your quiz...', 'warning');
        this.submitQuiz();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById('player-timer');
    if (!timerEl) return;
    const mins = Math.floor(this.timeRemaining / 60);
    const secs = this.timeRemaining % 60;
    timerEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  renderQuestion() {
    const q = this.questions[this.currentIndex];
    if (!q) return;

    // Progress bar
    const progressPercent = ((this.currentIndex + 1) / this.questions.length) * 100;
    const bar = document.getElementById('player-progress-bar');
    if (bar) bar.style.width = `${progressPercent}%`;

    // Counter
    const counterEl = document.getElementById('player-q-counter');
    if (counterEl) counterEl.textContent = `Question ${this.currentIndex + 1} of ${this.questions.length}`;

    // Prompt
    const promptEl = document.getElementById('player-q-text');
    if (promptEl) promptEl.textContent = q.question;

    // Type Badge
    const typeBadge = document.getElementById('player-q-type-badge');
    if (typeBadge) {
      const typeLabel = {
        'multiple-choice': 'Multiple Choice',
        'true-false': 'True / False',
        'open-ended': 'Open-Ended'
      }[q.type] || 'Question';
      typeBadge.textContent = typeLabel;
    }

    // Flag button state
    const flagBtn = document.getElementById('player-btn-flag');
    if (flagBtn) {
      const isFlagged = this.flaggedQuestions.has(q.id);
      flagBtn.style.color = isFlagged ? 'var(--warning)' : 'var(--text-muted)';
      flagBtn.title = isFlagged ? 'Unflag Question' : 'Flag for Review';
    }

    // Options Container
    const optionsContainer = document.getElementById('player-options-container');
    optionsContainer.innerHTML = '';

    const selectedAnswer = this.userAnswers[q.id];

    if (q.type === 'multiple-choice') {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      (q.options || []).forEach((opt, idx) => {
        const isSelected = selectedAnswer === idx;
        const optCard = document.createElement('div');
        optCard.className = `player-option-card ${isSelected ? 'selected' : ''}`;
        optCard.innerHTML = `
          <div class="player-option-letter">${letters[idx]}</div>
          <div style="flex:1; font-weight:500;">${this.escapeHtml(opt)}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">[Press ${idx + 1}]</div>
        `;
        optCard.addEventListener('click', () => this.selectOption(idx));
        optionsContainer.appendChild(optCard);
      });
    } else if (q.type === 'true-false') {
      const tfChoices = [
        { label: 'True', val: 0, icon: '✅', key: 'T' },
        { label: 'False', val: 1, icon: '❌', key: 'F' }
      ];
      tfChoices.forEach(choice => {
        const isSelected = selectedAnswer === choice.val;
        const optCard = document.createElement('div');
        optCard.className = `player-option-card ${isSelected ? 'selected' : ''}`;
        optCard.innerHTML = `
          <div class="player-option-letter">${choice.icon}</div>
          <div style="flex:1; font-weight:700; font-size:1.1rem;">${choice.label}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">[Press ${choice.key}]</div>
        `;
        optCard.addEventListener('click', () => this.selectOption(choice.val));
        optionsContainer.appendChild(optCard);
      });
    } else if (q.type === 'open-ended') {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <div class="form-group">
          <label class="form-label">Type your answer below:</label>
          <textarea id="player-open-input" class="form-textarea" placeholder="Enter concise answer here...">${selectedAnswer || ''}</textarea>
        </div>
      `;
      optionsContainer.appendChild(wrapper);

      const textarea = wrapper.querySelector('#player-open-input');
      textarea.addEventListener('input', (e) => {
        this.userAnswers[q.id] = e.target.value.trim();
        this.renderQuestionMap();
      });
    }

    // Explanation Box for Instant Feedback Mode
    const expBox = document.getElementById('player-explanation-box');
    if (expBox) {
      if (this.quiz.instantFeedback && selectedAnswer !== undefined) {
        expBox.classList.add('visible');
        expBox.innerHTML = `
          <strong>💡 Explanation:</strong>
          <p style="margin-top:0.35rem;">${this.escapeHtml(q.explanation || 'No explanation provided.')}</p>
        `;
      } else {
        expBox.classList.remove('visible');
      }
    }

    // Prev / Next button status
    const prevBtn = document.getElementById('player-btn-prev');
    if (prevBtn) prevBtn.disabled = (this.currentIndex === 0);

    const nextBtn = document.getElementById('player-btn-next');
    const submitBtn = document.getElementById('player-btn-submit');
    const isLast = (this.currentIndex === this.questions.length - 1);

    if (nextBtn) nextBtn.style.display = isLast ? 'none' : 'inline-flex';
    if (submitBtn) submitBtn.style.display = isLast ? 'inline-flex' : 'none';

    this.renderQuestionMap();
  }

  selectOption(optIndex) {
    const q = this.questions[this.currentIndex];
    this.userAnswers[q.id] = optIndex;
    if (window.soundFX) window.soundFX.playClick();

    // Instant feedback sound
    if (this.quiz.instantFeedback) {
      const isCorrect = (q.correctAnswers && q.correctAnswers.includes(optIndex));
      if (isCorrect) {
        if (window.soundFX) window.soundFX.playCorrect();
      } else {
        if (window.soundFX) window.soundFX.playWrong();
      }
    }

    this.renderQuestion();
  }

  toggleFlag() {
    const q = this.questions[this.currentIndex];
    if (this.flaggedQuestions.has(q.id)) {
      this.flaggedQuestions.delete(q.id);
      window.app.showToast('Unflagged question.', 'info');
    } else {
      this.flaggedQuestions.add(q.id);
      window.app.showToast('Flagged question for review.', 'info');
    }
    if (window.soundFX) window.soundFX.playClick();
    this.renderQuestion();
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      if (window.soundFX) window.soundFX.playClick();
      this.renderQuestion();
    }
  }

  prevQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      if (window.soundFX) window.soundFX.playClick();
      this.renderQuestion();
    }
  }

  jumpToQuestion(index) {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
      if (window.soundFX) window.soundFX.playClick();
      this.renderQuestion();
    }
  }

  renderQuestionMap() {
    const mapContainer = document.getElementById('player-q-map');
    if (!mapContainer) return;

    mapContainer.innerHTML = this.questions.map((q, idx) => {
      const isAnswered = this.userAnswers[q.id] !== undefined && this.userAnswers[q.id] !== '';
      const isCurrent = (idx === this.currentIndex);
      const isFlagged = this.flaggedQuestions.has(q.id);

      let classes = 'q-map-item';
      if (isCurrent) classes += ' current';
      if (isAnswered) classes += ' answered';
      if (isFlagged) classes += ' flagged';

      return `<button type="button" class="${classes}" data-index="${idx}" title="Jump to #${idx + 1}">${idx + 1}</button>`;
    }).join('');

    mapContainer.querySelectorAll('.q-map-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.jumpToQuestion(idx);
      });
    });
  }

  confirmSubmit() {
    const answeredCount = Object.keys(this.userAnswers).filter(k => this.userAnswers[k] !== undefined && this.userAnswers[k] !== '').length;
    const unansweredCount = this.questions.length - answeredCount;

    if (unansweredCount > 0) {
      if (confirm(`You have ${unansweredCount} unanswered question(s). Are you sure you want to finish and submit?`)) {
        this.submitQuiz();
      }
    } else {
      if (confirm('Ready to submit your quiz and view your results?')) {
        this.submitQuiz();
      }
    }
  }

  submitQuiz() {
    clearInterval(this.timerInterval);
    this.endTime = Date.now();
    const timeSpentSeconds = Math.round((this.endTime - this.startTime) / 1000);

    // Compute Score
    let correctCount = 0;
    const questionReview = [];

    this.questions.forEach(q => {
      const userAnswer = this.userAnswers[q.id];
      let isCorrect = false;
      let displayUserAnswer = 'No answer';
      let displayCorrectAnswer = '';

      if (q.type === 'multiple-choice') {
        const correctIndex = q.correctAnswers[0];
        displayCorrectAnswer = q.options[correctIndex] || '';
        if (userAnswer !== undefined && userAnswer !== '') {
          displayUserAnswer = q.options[userAnswer] || '';
          isCorrect = (userAnswer === correctIndex);
        }
      } else if (q.type === 'true-false') {
        const correctIndex = q.correctAnswers[0];
        displayCorrectAnswer = (correctIndex === 0 ? 'True' : 'False');
        if (userAnswer !== undefined && userAnswer !== '') {
          displayUserAnswer = (userAnswer === 0 ? 'True' : 'False');
          isCorrect = (userAnswer === correctIndex);
        }
      } else if (q.type === 'open-ended') {
        displayCorrectAnswer = (q.acceptedKeywords || []).join(' OR ');
        if (userAnswer && typeof userAnswer === 'string') {
          displayUserAnswer = userAnswer;
          const cleanUser = userAnswer.trim().toLowerCase();
          isCorrect = (q.acceptedKeywords || []).some(kw => cleanUser.includes(kw.toLowerCase()));
        }
      }

      if (isCorrect) correctCount++;

      questionReview.push({
        questionId: q.id,
        prompt: q.question,
        type: q.type,
        userAnswer: displayUserAnswer,
        correctAnswer: displayCorrectAnswer,
        isCorrect: isCorrect,
        explanation: q.explanation || ''
      });
    });

    const percentage = Math.round((correctCount / this.questions.length) * 100);
    const passed = percentage >= (this.quiz.passPercentage || 70);
    const currentUser = window.store.getCurrentUser();

    const attemptRecord = {
      quizId: this.quiz.id,
      quizTitle: this.quiz.title,
      userId: currentUser ? currentUser.id : 'guest',
      userName: currentUser ? currentUser.name : 'Guest Player',
      score: correctCount,
      totalQuestions: this.questions.length,
      percentage: percentage,
      passed: passed,
      timeSpentSeconds: timeSpentSeconds,
      review: questionReview
    };

    if (!this.isPreviewMode) {
      window.store.saveAttempt(attemptRecord);
    }

    if (passed) {
      if (window.soundFX) window.soundFX.playFanfare();
      if (window.app && window.app.fireConfetti) window.app.fireConfetti();
    } else {
      if (window.soundFX) window.soundFX.playWrong();
    }

    // Open Reports Page
    window.reports.displayReport(attemptRecord, this.quiz);
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.player = new QuizPlayer();
