/* ==========================================================================
   QuizCraft - Quiz Builder & Editor Module
   Supports: Multiple-Choice, True/False, and Open-Ended Questions
   ========================================================================== */

class QuizBuilder {
  constructor() {
    this.currentQuizId = null;
    this.questions = [];
  }

  init() {
    this.bindEvents();
    this.resetForm();
  }

  resetForm() {
    this.currentQuizId = null;
    this.questions = [
      {
        id: 'q_' + Date.now() + '_1',
        type: 'multiple-choice',
        question: '',
        options: ['', '', '', ''],
        correctAnswers: [0],
        explanation: ''
      }
    ];

    document.getElementById('builder-title').value = '';
    document.getElementById('builder-desc').value = '';
    document.getElementById('builder-category').value = 'General';
    document.getElementById('builder-difficulty').value = 'Intermediate';
    document.getElementById('builder-icon').value = '🧠';
    document.getElementById('builder-time-limit').value = '60';
    document.getElementById('builder-pass-percent').value = '70';
    document.getElementById('builder-shuffle-q').checked = true;
    document.getElementById('builder-shuffle-opt').checked = true;
    document.getElementById('builder-instant-feedback').checked = false;

    document.getElementById('builder-page-title').textContent = 'Create New Quiz';
    this.renderQuestionsList();
  }

  loadQuizForEditing(quizId) {
    const quiz = window.store.getQuizById(quizId);
    if (!quiz) {
      window.app.showToast('Quiz not found.', 'error');
      return;
    }

    this.currentQuizId = quiz.id;
    this.questions = JSON.parse(JSON.stringify(quiz.questions || []));

    document.getElementById('builder-title').value = quiz.title || '';
    document.getElementById('builder-desc').value = quiz.description || '';
    document.getElementById('builder-category').value = quiz.category || 'General';
    document.getElementById('builder-difficulty').value = quiz.difficulty || 'Intermediate';
    document.getElementById('builder-icon').value = quiz.icon || '🧠';
    document.getElementById('builder-time-limit').value = quiz.timeLimit || 0;
    document.getElementById('builder-pass-percent').value = quiz.passPercentage || 70;
    document.getElementById('builder-shuffle-q').checked = quiz.shuffleQuestions ?? true;
    document.getElementById('builder-shuffle-opt').checked = quiz.shuffleOptions ?? true;
    document.getElementById('builder-instant-feedback').checked = quiz.instantFeedback ?? false;

    document.getElementById('builder-page-title').textContent = 'Edit Quiz: ' + quiz.title;
    this.renderQuestionsList();
    window.app.navigateTo('builder');
  }

  bindEvents() {
    // Add Question buttons
    const btnAddMCQ = document.getElementById('btn-add-mcq');
    const btnAddTF = document.getElementById('btn-add-tf');
    const btnAddOpen = document.getElementById('btn-add-open');

    if (btnAddMCQ) {
      btnAddMCQ.addEventListener('click', () => this.addQuestion('multiple-choice'));
    }
    if (btnAddTF) {
      btnAddTF.addEventListener('click', () => this.addQuestion('true-false'));
    }
    if (btnAddOpen) {
      btnAddOpen.addEventListener('click', () => this.addQuestion('open-ended'));
    }

    // Save Quiz button
    const btnSave = document.getElementById('btn-builder-save');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.saveQuiz());
    }

    // Cancel / Back button
    const btnCancel = document.getElementById('btn-builder-cancel');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => {
        if (confirm('Discard changes and return to Dashboard?')) {
          this.resetForm();
          window.app.navigateTo('dashboard');
        }
      });
    }

    // Live Preview Button
    const btnPreview = document.getElementById('btn-builder-preview');
    if (btnPreview) {
      btnPreview.addEventListener('click', () => this.previewQuiz());
    }
  }

  addQuestion(type) {
    if (window.soundFX) window.soundFX.playClick();
    const newQ = {
      id: 'q_' + Date.now() + '_' + (this.questions.length + 1),
      type: type,
      question: '',
      explanation: ''
    };

    if (type === 'multiple-choice') {
      newQ.options = ['', '', '', ''];
      newQ.correctAnswers = [0];
    } else if (type === 'true-false') {
      newQ.options = ['True', 'False'];
      newQ.correctAnswers = [0];
    } else if (type === 'open-ended') {
      newQ.acceptedKeywords = [];
    }

    this.questions.push(newQ);
    this.renderQuestionsList();
    window.app.showToast(`Added ${type.replace('-', ' ')} question!`, 'info');

    // Scroll to bottom
    setTimeout(() => {
      const container = document.getElementById('builder-questions-container');
      if (container && container.lastElementChild) {
        container.lastElementChild.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }

  duplicateQuestion(index) {
    if (window.soundFX) window.soundFX.playClick();
    const original = this.questions[index];
    const clone = JSON.parse(JSON.stringify(original));
    clone.id = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    clone.question = (clone.question ? clone.question + ' (Copy)' : '');
    this.questions.splice(index + 1, 0, clone);
    this.renderQuestionsList();
    window.app.showToast('Question duplicated.', 'info');
  }

  deleteQuestion(index) {
    if (this.questions.length <= 1) {
      window.app.showToast('Quiz must have at least one question.', 'error');
      return;
    }
    if (confirm('Are you sure you want to delete this question?')) {
      if (window.soundFX) window.soundFX.playClick();
      this.questions.splice(index, 1);
      this.renderQuestionsList();
    }
  }

  moveQuestion(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= this.questions.length) return;
    if (window.soundFX) window.soundFX.playClick();
    const temp = this.questions[index];
    this.questions[index] = this.questions[targetIndex];
    this.questions[targetIndex] = temp;
    this.renderQuestionsList();
  }

  renderQuestionsList() {
    const container = document.getElementById('builder-questions-container');
    const countBadge = document.getElementById('builder-question-count-badge');
    if (!container) return;

    if (countBadge) countBadge.textContent = `${this.questions.length} Question${this.questions.length > 1 ? 's' : ''}`;

    container.innerHTML = this.questions.map((q, qIndex) => {
      return this.renderQuestionCard(q, qIndex);
    }).join('');

    this.bindQuestionCardEvents(container);
  }

  renderQuestionCard(q, index) {
    const typeLabel = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True / False',
      'open-ended': 'Open-Ended'
    }[q.type] || 'Question';

    return `
      <div class="question-builder-card" data-q-index="${index}">
        <div class="question-card-header">
          <div style="display:flex; align-items:center; gap: 0.75rem;">
            <span class="question-number-pill">#${index + 1}</span>
            <span class="badge badge-cat">${typeLabel}</span>
          </div>
          <div class="question-actions-group">
            <button type="button" class="btn btn-secondary btn-sm btn-move-up" title="Move Up" ${index === 0 ? 'disabled style="opacity:0.4"' : ''}>↑</button>
            <button type="button" class="btn btn-secondary btn-sm btn-move-down" title="Move Down" ${index === this.questions.length - 1 ? 'disabled style="opacity:0.4"' : ''}>↓</button>
            <button type="button" class="btn btn-secondary btn-sm btn-duplicate" title="Duplicate">📋</button>
            <button type="button" class="btn btn-danger btn-sm btn-delete-q" title="Delete">🗑️</button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Question Text <span style="color:var(--danger)">*</span></label>
          <input type="text" class="form-input q-text-input" placeholder="Enter your question prompt here..." value="${this.escapeHtml(q.question || '')}">
        </div>

        <!-- Question Type Specific Form -->
        ${q.type === 'multiple-choice' ? this.renderMCQBuilder(q, index) : ''}
        ${q.type === 'true-false' ? this.renderTFBuilder(q, index) : ''}
        ${q.type === 'open-ended' ? this.renderOpenEndedBuilder(q, index) : ''}

        <div class="form-group" style="margin-top:1rem;">
          <label class="form-label">Explanation / Feedback Note <span class="form-label-help">(shown after answering)</span></label>
          <input type="text" class="form-input q-explanation-input" placeholder="Explain why the answer is correct..." value="${this.escapeHtml(q.explanation || '')}">
        </div>
      </div>
    `;
  }

  renderMCQBuilder(q, qIndex) {
    const options = q.options || ['', '', '', ''];
    const correct = q.correctAnswers || [0];

    const optionsHtml = options.map((opt, optIndex) => {
      const isChecked = correct.includes(optIndex);
      return `
        <div class="option-builder-row">
          <button type="button" class="option-check-btn ${isChecked ? 'checked' : ''}" data-opt-index="${optIndex}" title="Mark as correct answer">
            ${isChecked ? '✓' : ''}
          </button>
          <input type="text" class="form-input opt-text-input" placeholder="Option ${optIndex + 1}" value="${this.escapeHtml(opt)}" data-opt-index="${optIndex}">
          ${options.length > 2 ? `<button type="button" class="btn btn-ghost btn-sm btn-remove-opt" data-opt-index="${optIndex}" title="Remove Option">✕</button>` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="form-group">
        <label class="form-label">Answer Options <span class="form-label-help">(Click the circle to select the correct answer)</span></label>
        <div class="options-builder-list">${optionsHtml}</div>
        ${options.length < 6 ? `<button type="button" class="btn btn-ghost btn-sm btn-add-opt" style="border:1px dashed var(--border-color); width:100%;">+ Add Another Option</button>` : ''}
      </div>
    `;
  }

  renderTFBuilder(q, qIndex) {
    const isTrue = (q.correctAnswers && q.correctAnswers[0] === 0);
    return `
      <div class="form-group">
        <label class="form-label">Correct Statement State</label>
        <div class="true-false-selector">
          <div class="tf-choice-btn ${isTrue ? 'selected-true' : ''}" data-val="true">
            ✅ TRUE
          </div>
          <div class="tf-choice-btn ${!isTrue ? 'selected-false' : ''}" data-val="false">
            ❌ FALSE
          </div>
        </div>
      </div>
    `;
  }

  renderOpenEndedBuilder(q, qIndex) {
    const keywords = (q.acceptedKeywords || []).join(', ');
    return `
      <div class="form-group">
        <label class="form-label">Accepted Keyword Answers <span style="color:var(--danger)">*</span></label>
        <input type="text" class="form-input q-keywords-input" placeholder="e.g. photosynthesis, light synthesis (comma-separated, case-insensitive)" value="${this.escapeHtml(keywords)}">
        <span class="form-label-help">The student's response will be graded as correct if it matches any of these keywords.</span>
      </div>
    `;
  }

  bindQuestionCardEvents(container) {
    container.querySelectorAll('.question-builder-card').forEach(card => {
      const qIndex = parseInt(card.dataset.qIndex, 10);
      const q = this.questions[qIndex];

      // Question text input
      const qInput = card.querySelector('.q-text-input');
      qInput.addEventListener('input', (e) => {
        q.question = e.target.value;
      });

      // Explanation input
      const expInput = card.querySelector('.q-explanation-input');
      expInput.addEventListener('input', (e) => {
        q.explanation = e.target.value;
      });

      // Actions
      card.querySelector('.btn-move-up').addEventListener('click', () => this.moveQuestion(qIndex, -1));
      card.querySelector('.btn-move-down').addEventListener('click', () => this.moveQuestion(qIndex, 1));
      card.querySelector('.btn-duplicate').addEventListener('click', () => this.duplicateQuestion(qIndex));
      card.querySelector('.btn-delete-q').addEventListener('click', () => this.deleteQuestion(qIndex));

      // MCQ Option events
      if (q.type === 'multiple-choice') {
        // Toggle correct answer
        card.querySelectorAll('.option-check-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (window.soundFX) window.soundFX.playClick();
            const optIndex = parseInt(btn.dataset.optIndex, 10);
            q.correctAnswers = [optIndex];
            this.renderQuestionsList();
          });
        });

        // Option text change
        card.querySelectorAll('.opt-text-input').forEach(input => {
          input.addEventListener('input', (e) => {
            const optIndex = parseInt(input.dataset.optIndex, 10);
            q.options[optIndex] = e.target.value;
          });
        });

        // Add Option
        const addOptBtn = card.querySelector('.btn-add-opt');
        if (addOptBtn) {
          addOptBtn.addEventListener('click', () => {
            if (q.options.length < 6) {
              q.options.push('');
              this.renderQuestionsList();
            }
          });
        }

        // Remove Option
        card.querySelectorAll('.btn-remove-opt').forEach(btn => {
          btn.addEventListener('click', () => {
            const optIndex = parseInt(btn.dataset.optIndex, 10);
            q.options.splice(optIndex, 1);
            q.correctAnswers = [0];
            this.renderQuestionsList();
          });
        });
      }

      // True/False events
      if (q.type === 'true-false') {
        card.querySelectorAll('.tf-choice-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (window.soundFX) window.soundFX.playClick();
            const isTrue = btn.dataset.val === 'true';
            q.correctAnswers = isTrue ? [0] : [1];
            this.renderQuestionsList();
          });
        });
      }

      // Open-ended keywords
      if (q.type === 'open-ended') {
        const kwInput = card.querySelector('.q-keywords-input');
        if (kwInput) {
          kwInput.addEventListener('input', (e) => {
            q.acceptedKeywords = e.target.value
              .split(',')
              .map(s => s.trim().toLowerCase())
              .filter(s => s.length > 0);
          });
        }
      }
    });
  }

  validate() {
    const title = document.getElementById('builder-title').value.trim();
    if (!title) {
      window.app.showToast('Please provide a Quiz Title.', 'error');
      document.getElementById('builder-title').focus();
      return false;
    }

    if (this.questions.length === 0) {
      window.app.showToast('Quiz must have at least one question.', 'error');
      return false;
    }

    for (let i = 0; i < this.questions.length; i++) {
      const q = this.questions[i];
      if (!q.question.trim()) {
        window.app.showToast(`Question #${i + 1} has an empty prompt.`, 'error');
        return false;
      }

      if (q.type === 'multiple-choice') {
        const hasBlankOpt = q.options.some(opt => !opt.trim());
        if (hasBlankOpt) {
          window.app.showToast(`Question #${i + 1} has empty options. Fill or remove them.`, 'error');
          return false;
        }
        if (!q.correctAnswers || q.correctAnswers.length === 0) {
          window.app.showToast(`Select the correct answer for Question #${i + 1}.`, 'error');
          return false;
        }
      }

      if (q.type === 'open-ended') {
        if (!q.acceptedKeywords || q.acceptedKeywords.length === 0) {
          window.app.showToast(`Question #${i + 1} must have at least one accepted keyword.`, 'error');
          return false;
        }
      }
    }

    return true;
  }

  saveQuiz() {
    if (!this.validate()) {
      if (window.soundFX) window.soundFX.playWrong();
      return;
    }

    const currentUser = window.store.getCurrentUser();
    const title = document.getElementById('builder-title').value.trim();
    const description = document.getElementById('builder-desc').value.trim();
    const category = document.getElementById('builder-category').value;
    const difficulty = document.getElementById('builder-difficulty').value;
    const icon = document.getElementById('builder-icon').value.trim() || '🧠';
    const timeLimit = parseInt(document.getElementById('builder-time-limit').value, 10) || 0;
    const passPercentage = parseInt(document.getElementById('builder-pass-percent').value, 10) || 70;
    const shuffleQuestions = document.getElementById('builder-shuffle-q').checked;
    const shuffleOptions = document.getElementById('builder-shuffle-opt').checked;
    const instantFeedback = document.getElementById('builder-instant-feedback').checked;

    const quizData = {
      id: this.currentQuizId || 'quiz_' + Date.now(),
      title,
      description,
      category,
      difficulty,
      icon,
      timeLimit,
      passPercentage,
      shuffleQuestions,
      shuffleOptions,
      instantFeedback,
      authorId: currentUser ? currentUser.id : 'guest',
      authorName: currentUser ? currentUser.name : 'Community Author',
      questions: this.questions
    };

    window.store.saveQuiz(quizData);
    if (window.soundFX) window.soundFX.playCorrect();
    window.app.showToast(`Quiz "${quizData.title}" saved successfully! 🎉`, 'success');
    this.resetForm();
    window.app.navigateTo('dashboard');
  }

  previewQuiz() {
    if (!this.validate()) return;
    const title = document.getElementById('builder-title').value.trim();
    const timeLimit = parseInt(document.getElementById('builder-time-limit').value, 10) || 0;

    const mockQuiz = {
      id: 'preview_temp',
      title: title + ' (Preview Mode)',
      description: 'Quick test preview before saving',
      category: document.getElementById('builder-category').value,
      difficulty: document.getElementById('builder-difficulty').value,
      icon: document.getElementById('builder-icon').value || '🧠',
      timeLimit,
      passPercentage: parseInt(document.getElementById('builder-pass-percent').value, 10) || 70,
      shuffleQuestions: false,
      shuffleOptions: false,
      instantFeedback: document.getElementById('builder-instant-feedback').checked,
      questions: this.questions
    };

    window.player.startQuiz(mockQuiz, true);
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

window.builder = new QuizBuilder();
