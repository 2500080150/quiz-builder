/* ==========================================================================
   QuizCraft - Main App Controller & Router
   ========================================================================== */

class App {
  constructor() {
    this.currentView = 'dashboard';
    this.theme = localStorage.getItem('quizcraft_theme') || 'light';
    this.confettiCanvas = null;
    this.confettiCtx = null;
    this.confettiParticles = [];
    this.confettiAnimId = null;
  }

  init() {
    this.applyTheme(this.theme);
    this.initConfetti();
    this.bindGlobalEvents();

    // Init sub-modules
    window.authManager.init();
    window.builder.init();
    window.player.init();

    // Check auth session
    const user = window.store.getCurrentUser();
    
    // Check if shared quiz parameter is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedQuizId = urlParams.get('quiz');
    if (sharedQuizId) {
      const quiz = window.store.getQuizById(sharedQuizId);
      if (quiz) {
        window.player.startQuiz(quiz);
        return;
      }
    }

    if (!user) {
      this.navigateTo('auth');
    } else {
      this.navigateTo('dashboard');
    }

    this.renderDashboard();
  }

  // --- Theme Management ---
  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('quizcraft_theme', theme);

    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`;
    }
  }

  toggleTheme() {
    const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    if (window.soundFX) window.soundFX.playClick();
  }

  // --- Routing ---
  navigateTo(viewName) {
    this.currentView = viewName;

    // Hide all view sections
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    // Show active section
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Update active state in nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.target === viewName);
    });

    // Trigger view-specific re-renders
    if (viewName === 'dashboard') {
      this.renderDashboard();
    } else if (viewName === 'history') {
      this.renderHistory();
    }
  }

  // --- Dashboard Rendering ---
  renderDashboard() {
    const user = window.store.getCurrentUser();
    const quizzes = window.store.getQuizzes();
    const attempts = user ? window.store.getUserAttempts(user.id) : [];

    // Render Stats
    const statQuizzesEl = document.getElementById('dash-stat-quizzes');
    const statAttemptsEl = document.getElementById('dash-stat-attempts');
    const statAvgScoreEl = document.getElementById('dash-stat-avg');

    if (statQuizzesEl) statQuizzesEl.textContent = quizzes.length;
    if (statAttemptsEl) statAttemptsEl.textContent = attempts.length;
    if (statAvgScoreEl) {
      const avg = attempts.length > 0
        ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / attempts.length)
        : 0;
      statAvgScoreEl.textContent = `${avg}%`;
    }

    this.filterAndRenderQuizzes();
  }

  filterAndRenderQuizzes() {
    const container = document.getElementById('quiz-grid-container');
    if (!container) return;

    const searchTerm = (document.getElementById('search-quiz-input')?.value || '').toLowerCase();
    const activeChip = document.querySelector('.category-chips .chip-btn.active');
    const selectedCategory = activeChip ? activeChip.dataset.category : 'all';

    let quizzes = window.store.getQuizzes();

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      quizzes = quizzes.filter(q => (q.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    // Search query filter
    if (searchTerm) {
      quizzes = quizzes.filter(q =>
        q.title.toLowerCase().includes(searchTerm) ||
        (q.description && q.description.toLowerCase().includes(searchTerm)) ||
        (q.category && q.category.toLowerCase().includes(searchTerm))
      );
    }

    if (quizzes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 4rem 1rem; color:var(--text-muted);">
          <div style="font-size:3rem; margin-bottom:1rem;">🔍</div>
          <h3>No quizzes found</h3>
          <p style="margin-top:0.5rem;">Try modifying your search query or create a brand new quiz!</p>
          <button type="button" class="btn btn-primary" style="margin-top:1.25rem;" onclick="window.builder.resetForm(); window.app.navigateTo('builder');">
            ✨ Create Quiz
          </button>
        </div>
      `;
      return;
    }

    const currentUser = window.store.getCurrentUser();

    container.innerHTML = quizzes.map(quiz => {
      const diffClass = {
        'beginner': 'badge-diff-easy',
        'intermediate': 'badge-diff-med',
        'hard': 'badge-diff-hard'
      }[(quiz.difficulty || '').toLowerCase()] || 'badge-diff-med';

      const isAuthor = currentUser && (quiz.authorId === currentUser.id || currentUser.role === 'Educator');

      return `
        <div class="quiz-card" data-quiz-id="${quiz.id}">
          <div>
            <div class="quiz-card-top">
              <div class="quiz-cover-icon">${quiz.icon || '🧠'}</div>
              <div class="quiz-badges">
                <span class="badge badge-cat">${this.escapeHtml(quiz.category || 'General')}</span>
                <span class="badge ${diffClass}">${this.escapeHtml(quiz.difficulty || 'Intermediate')}</span>
              </div>
            </div>

            <div class="quiz-card-body">
              <h3>${this.escapeHtml(quiz.title)}</h3>
              <p class="quiz-desc">${this.escapeHtml(quiz.description || 'No description provided.')}</p>
            </div>
          </div>

          <div>
            <div class="quiz-meta-info">
              <span class="quiz-meta-item">❓ ${(quiz.questions || []).length} Qs</span>
              <span class="quiz-meta-item">⏱️ ${quiz.timeLimit ? `${quiz.timeLimit}s` : 'Untimed'}</span>
              <span class="quiz-meta-item">🎯 ${quiz.passPercentage || 70}% Pass</span>
            </div>

            <div class="quiz-card-footer">
              <button type="button" class="btn btn-primary btn-play" onclick="window.player.startQuiz(window.store.getQuizById('${quiz.id}'))">
                ▶ Play Solo
              </button>
              <button type="button" class="btn btn-accent btn-sm" title="Host Live Multiplayer Arena" onclick="window.liveArena.hostGame('${quiz.id}')">
                ⚡ Host Live
              </button>
              <button type="button" class="btn btn-secondary btn-sm" title="Share Quiz Link & QR" onclick="window.app.openShareModal('${quiz.id}')">
                🔗
              </button>
              ${isAuthor ? `
                <button type="button" class="btn btn-secondary btn-sm" title="Edit Quiz" onclick="window.builder.loadQuizForEditing('${quiz.id}')">
                  ✏️
                </button>
                <button type="button" class="btn btn-danger btn-sm" title="Delete Quiz" onclick="window.app.deleteQuizPrompt('${quiz.id}')">
                  🗑️
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  deleteQuizPrompt(quizId) {
    const quiz = window.store.getQuizById(quizId);
    if (!quiz) return;
    if (confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
      window.store.deleteQuiz(quizId);
      if (window.soundFX) window.soundFX.playClick();
      this.showToast('Quiz deleted.', 'info');
      this.renderDashboard();
    }
  }

  // --- History & Score Tracking View ---
  renderHistory() {
    const container = document.getElementById('history-table-body');
    const user = window.store.getCurrentUser();
    if (!container) return;

    const attempts = user ? window.store.getUserAttempts(user.id) : window.store.getAttempts();

    if (attempts.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 3rem 1rem; color:var(--text-muted);">
            No quiz attempts recorded yet. Play a quiz to see your performance history!
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = attempts.map(a => {
      const date = new Date(a.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return `
        <tr>
          <td style="font-weight:600;">${this.escapeHtml(a.quizTitle)}</td>
          <td>${date}</td>
          <td><strong>${a.score}</strong> / ${a.totalQuestions}</td>
          <td>
            <span style="font-weight:700; color:${a.passed ? 'var(--success)' : 'var(--danger)'};">
              ${a.percentage}%
            </span>
          </td>
          <td>
            <span class="badge ${a.passed ? 'badge-diff-easy' : 'badge-diff-hard'}">
              ${a.passed ? 'Passed' : 'Failed'}
            </span>
          </td>
          <td>
            <button type="button" class="btn btn-secondary btn-sm" onclick='window.reports.displayReport(${JSON.stringify(a).replace(/'/g, "&#39;")})'>
              View Report ➔
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- Share Modal ---
  openShareModal(quizId) {
    const quiz = window.store.getQuizById(quizId);
    if (!quiz) return;

    const modal = document.getElementById('modal-share');
    if (!modal) return;

    document.getElementById('share-quiz-title').textContent = quiz.title;
    const shareUrl = `${window.location.origin}${window.location.pathname}?quiz=${quiz.id}`;
    const urlInput = document.getElementById('share-quiz-url');
    if (urlInput) urlInput.value = shareUrl;

    modal.classList.add('active');
    if (window.soundFX) window.soundFX.playClick();
  }

  // --- Toast System ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: '✅', error: '⚠️', info: 'ℹ️', warning: '🔔' };

    toast.innerHTML = `
      <span style="font-size:1.2rem;">${icons[type] || 'ℹ️'}</span>
      <span style="font-weight:500;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Global Event Bindings ---
  bindGlobalEvents() {
    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());

    // Sound toggle
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      const updateSoundBtn = () => {
        const isMuted = window.soundFX.isMuted();
        soundBtn.textContent = isMuted ? '🔇' : '🔊';
        soundBtn.title = isMuted ? 'Unmute Sound FX' : 'Mute Sound FX';
      };
      updateSoundBtn();

      soundBtn.addEventListener('click', () => {
        window.soundFX.toggleMute();
        updateSoundBtn();
        if (!window.soundFX.isMuted()) window.soundFX.playClick();
      });
    }

    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.dataset.target;
        if (target) {
          if (target === 'builder') window.builder.resetForm();
          this.navigateTo(target);
          if (window.soundFX) window.soundFX.playClick();
        }
      });
    });

    // Brand logo returns to dashboard
    document.querySelector('.brand-logo')?.addEventListener('click', () => {
      this.navigateTo('dashboard');
    });

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileMenuBtn && navLinks) {
      mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
      });
    }

    // Search and Category Chips in Dashboard
    const searchInput = document.getElementById('search-quiz-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterAndRenderQuizzes());
    }

    document.querySelectorAll('.category-chips .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-chips .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.soundFX) window.soundFX.playClick();
        this.filterAndRenderQuizzes();
      });
    });

    // Live Game PIN Join from Nav/Dashboard
    const btnJoinLive = document.getElementById('btn-nav-join-live');
    if (btnJoinLive) {
      btnJoinLive.addEventListener('click', () => {
        const modal = document.getElementById('modal-join-live');
        if (modal) {
          modal.classList.add('active');
          if (window.soundFX) window.soundFX.playClick();
        }
      });
    }

    // Join Live Form Submit
    const formJoinLive = document.getElementById('form-join-live');
    if (formJoinLive) {
      formJoinLive.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = document.getElementById('join-game-pin').value.trim();
        const nick = document.getElementById('join-nickname').value.trim();
        const user = window.store.getCurrentUser();
        const avatar = user ? user.avatar : '🚀';

        if (!pin) {
          this.showToast('Please enter a Game PIN.', 'error');
          return;
        }

        document.getElementById('modal-join-live').classList.remove('active');
        window.liveArena.joinGame(pin, nick || 'Player', avatar);
      });
    }

    // Copy Share Link Button
    const btnCopyShare = document.getElementById('btn-copy-share-url');
    if (btnCopyShare) {
      btnCopyShare.addEventListener('click', () => {
        const url = document.getElementById('share-quiz-url').value;
        navigator.clipboard.writeText(url).then(() => {
          this.showToast('Quiz link copied to clipboard! 📋', 'success');
        });
      });
    }

    // Modal Close buttons
    document.querySelectorAll('.modal-close-btn, .btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.modal-backdrop').classList.remove('active');
      });
    });

    // Close modal on outside click
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
      });
    });

    // Import / Export JSON buttons
    document.getElementById('btn-import-quiz-json')?.addEventListener('click', () => {
      document.getElementById('modal-import-quiz').classList.add('active');
    });

    document.getElementById('btn-submit-import-json')?.addEventListener('click', () => {
      const text = document.getElementById('import-json-text').value.trim();
      if (!text) {
        this.showToast('Please paste valid JSON quiz text.', 'error');
        return;
      }
      try {
        window.store.importQuizJSON(text);
        this.showToast('Quiz imported successfully! 🎉', 'success');
        document.getElementById('modal-import-quiz').classList.remove('active');
        this.renderDashboard();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });

    // Reset default samples
    document.getElementById('btn-reset-defaults')?.addEventListener('click', () => {
      if (confirm('Reset all quizzes and user data back to factory defaults?')) {
        window.store.resetToDefaults();
        this.showToast('Reset to default quizzes and accounts.', 'info');
        this.renderDashboard();
      }
    });
  }

  // --- Confetti Engine ---
  initConfetti() {
    this.confettiCanvas = document.getElementById('confetti-canvas');
    if (!this.confettiCanvas) return;
    this.confettiCtx = this.confettiCanvas.getContext('2d');

    const resize = () => {
      this.confettiCanvas.width = window.innerWidth;
      this.confettiCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  fireConfetti() {
    if (!this.confettiCtx) return;
    const colors = ['#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
    this.confettiParticles = [];

    for (let i = 0; i < 120; i++) {
      this.confettiParticles.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        w: Math.random() * 10 + 6,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 22,
        vy: (Math.random() - 0.8) * 20,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    cancelAnimationFrame(this.confettiAnimId);
    this.animateConfetti();
  }

  animateConfetti() {
    this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);

    for (let i = 0; i < this.confettiParticles.length; i++) {
      const p = this.confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5; // gravity
      p.rot += p.rotSpeed;
      p.opacity -= 0.008;

      if (p.opacity > 0) {
        this.confettiCtx.save();
        this.confettiCtx.translate(p.x, p.y);
        this.confettiCtx.rotate((p.rot * Math.PI) / 180);
        this.confettiCtx.globalAlpha = Math.max(0, p.opacity);
        this.confettiCtx.fillStyle = p.color;
        this.confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.confettiCtx.restore();
      }
    }

    this.confettiParticles = this.confettiParticles.filter(p => p.opacity > 0);
    if (this.confettiParticles.length > 0) {
      this.confettiAnimId = requestAnimationFrame(() => this.animateConfetti());
    } else {
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
    }
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

// Instantiate and start App on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
