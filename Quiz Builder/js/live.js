/* ==========================================================================
   QuizCraft - Live Arena & Real-Time Multiplayer Module
   Powered by modern BroadcastChannel API for multi-tab live sync + AI Bots
   ========================================================================== */

class LiveArena {
  constructor() {
    this.channel = null;
    this.role = null; // 'host' or 'participant'
    this.gamePin = null;
    this.quiz = null;
    this.players = []; // [{ id, name, avatar, score, streak, currentAnswer }]
    this.currentQIndex = 0;
    this.roundTimer = 15; // 15 seconds per question in live arena
    this.roundInterval = null;
    this.roundStartTime = null;
    this.myPlayerId = null;
    this.hasAnswered = false;
    this.botIntervals = [];

    this.initChannel();
  }

  initChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('quizcraft_live_channel');
      this.channel.onmessage = (event) => this.handleChannelMessage(event.data);
    }
  }

  broadcast(action, payload = {}) {
    if (this.channel) {
      this.channel.postMessage({
        action,
        pin: this.gamePin,
        ...payload
      });
    }
  }

  handleChannelMessage(data) {
    if (!data || data.pin !== this.gamePin) return;

    switch (data.action) {
      case 'PLAYER_JOINED':
        if (this.role === 'host') {
          this.addPlayer(data.player);
          this.broadcast('LOBBY_STATE', { players: this.players });
        }
        break;

      case 'LOBBY_STATE':
        if (this.role === 'participant') {
          this.players = data.players;
          this.renderParticipantLobby();
        }
        break;

      case 'START_GAME':
        this.quiz = data.quiz;
        this.currentQIndex = 0;
        this.runCountdown(() => this.showLiveQuestion(0));
        break;

      case 'PLAYER_ANSWERED':
        if (this.role === 'host') {
          this.recordPlayerAnswer(data.playerId, data.answer, data.timeMs);
        }
        break;

      case 'SHOW_QUESTION':
        if (this.role === 'participant') {
          this.currentQIndex = data.questionIndex;
          this.showParticipantQuestion(data.question);
        }
        break;

      case 'SHOW_ROUND_RESULTS':
        this.players = data.players;
        this.showRoundLeaderboard(data.correctAnswer, data.explanation);
        break;

      case 'GAME_OVER':
        this.players = data.players;
        this.showFinalPodium();
        break;
    }
  }

  // --- HOST FLOW ---
  hostGame(quizId) {
    const quiz = window.store.getQuizById(quizId);
    if (!quiz) {
      window.app.showToast('Quiz not found.', 'error');
      return;
    }

    this.role = 'host';
    this.quiz = quiz;
    this.gamePin = Math.floor(100000 + Math.random() * 900000).toString();
    this.currentQIndex = 0;

    const hostUser = window.store.getCurrentUser();
    this.myPlayerId = 'host_' + Date.now();
    this.players = [
      {
        id: this.myPlayerId,
        name: hostUser ? hostUser.name : 'Host Player',
        avatar: hostUser ? hostUser.avatar : '👑',
        score: 0,
        streak: 0,
        isHost: true
      }
    ];

    this.renderHostLobby();
    window.app.navigateTo('live');
    if (window.soundFX) window.soundFX.playClick();
  }

  renderHostLobby() {
    const container = document.getElementById('live-arena-view-container');
    if (!container) return;

    container.innerHTML = `
      <div class="live-lobby-card">
        <span class="hero-tag">⚡ Live Multiplayer Arena</span>
        <h2>${this.escapeHtml(this.quiz.title)}</h2>
        <p style="margin-top:0.5rem;">Share this Game PIN with players or invite them to open another window/tab:</p>

        <div class="game-pin-display">${this.gamePin.slice(0, 3)} ${this.gamePin.slice(3)}</div>

        <div style="display:flex; justify-content:center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-copy-pin">📋 Copy PIN</button>
          <button type="button" class="btn btn-accent btn-sm" id="btn-add-bots">+ Add AI Competitors (Bots)</button>
        </div>

        <div style="margin-top: 1.5rem;">
          <h4>Players in Lobby (<span id="live-player-count">${this.players.length}</span>)</h4>
          <div class="live-player-grid" id="live-players-list">
            ${this.renderPlayerChips()}
          </div>
        </div>

        <div style="margin-top: 2rem; display:flex; justify-content:center; gap:1rem;">
          <button type="button" class="btn btn-secondary btn-lg" id="btn-leave-live">Leave Arena</button>
          <button type="button" class="btn btn-primary btn-lg" id="btn-start-live-match">🚀 Start Match!</button>
        </div>
      </div>
    `;

    document.getElementById('btn-copy-pin').addEventListener('click', () => {
      navigator.clipboard.writeText(this.gamePin).then(() => {
        window.app.showToast('Game PIN copied to clipboard!', 'success');
      });
    });

    document.getElementById('btn-add-bots').addEventListener('click', () => {
      this.addSimulatedBots();
    });

    document.getElementById('btn-leave-live').addEventListener('click', () => {
      if (confirm('Leave live match?')) {
        this.cleanup();
        window.app.navigateTo('dashboard');
      }
    });

    document.getElementById('btn-start-live-match').addEventListener('click', () => {
      this.startMatch();
    });
  }

  addSimulatedBots() {
    const botTemplates = [
      { name: 'Brainy Bot', avatar: '🤖' },
      { name: 'Speedy Sam', avatar: '⚡' },
      { name: 'QuizWhiz Zoe', avatar: '🌟' }
    ];

    botTemplates.forEach(b => {
      if (!this.players.some(p => p.name === b.name)) {
        this.addPlayer({
          id: 'bot_' + Math.random().toString(36).substr(2, 6),
          name: b.name,
          avatar: b.avatar,
          score: 0,
          streak: 0,
          isBot: true
        });
      }
    });

    if (window.soundFX) window.soundFX.playClick();
    window.app.showToast('Added AI competitors!', 'info');
  }

  addPlayer(player) {
    if (!this.players.some(p => p.id === player.id)) {
      this.players.push(player);
      const countEl = document.getElementById('live-player-count');
      const listEl = document.getElementById('live-players-list');
      if (countEl) countEl.textContent = this.players.length;
      if (listEl) listEl.innerHTML = this.renderPlayerChips();
      if (window.soundFX) window.soundFX.playClick();
    }
  }

  renderPlayerChips() {
    return this.players.map(p => `
      <div class="live-player-chip">
        <span style="font-size:1.4rem;">${p.avatar}</span>
        <span>${this.escapeHtml(p.name)}</span>
        ${p.isHost ? '<span class="badge badge-cat">Host</span>' : ''}
        ${p.isBot ? '<span class="badge badge-diff-med">AI</span>' : ''}
      </div>
    `).join('');
  }

  // --- JOIN FLOW ---
  joinGame(pin, nickname, avatar) {
    this.role = 'participant';
    this.gamePin = pin.replace(/\s+/g, '');
    this.myPlayerId = 'p_' + Date.now();

    const playerObj = {
      id: this.myPlayerId,
      name: nickname || 'Player',
      avatar: avatar || '🚀',
      score: 0,
      streak: 0
    };

    this.broadcast('PLAYER_JOINED', { player: playerObj });
    this.renderParticipantLobby();
    window.app.navigateTo('live');
    if (window.soundFX) window.soundFX.playClick();
  }

  renderParticipantLobby() {
    const container = document.getElementById('live-arena-view-container');
    if (!container) return;

    container.innerHTML = `
      <div class="live-lobby-card">
        <span class="hero-tag">Room PIN: ${this.gamePin}</span>
        <h2>You are in the Lobby! 🎉</h2>
        <p style="margin-top:0.5rem;">Waiting for host to start the battle...</p>

        <div style="margin: 2.5rem 0;">
          <div style="font-size: 4rem; animation: pulseWarning 1.5s infinite;">⏳</div>
        </div>

        <div style="margin-top: 1.5rem;">
          <h4>Players Connected</h4>
          <div class="live-player-grid" id="live-players-list">
            ${this.renderPlayerChips()}
          </div>
        </div>
      </div>
    `;
  }

  // --- GAMEPLAY FLOW ---
  startMatch() {
    if (this.players.length === 0) {
      window.app.showToast('Waiting for at least one player to join.', 'error');
      return;
    }

    this.broadcast('START_GAME', { quiz: this.quiz });
    this.runCountdown(() => {
      this.showLiveQuestion(0);
    });
  }

  runCountdown(callback) {
    if (window.soundFX) window.soundFX.playTick();
    const overlay = document.createElement('div');
    overlay.className = 'live-countdown-overlay';
    document.body.appendChild(overlay);

    let count = 3;
    overlay.innerHTML = `<div class="live-countdown-number">${count}</div>`;

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        if (window.soundFX) window.soundFX.playTick();
        overlay.innerHTML = `<div class="live-countdown-number">${count}</div>`;
      } else if (count === 0) {
        if (window.soundFX) window.soundFX.playFanfare();
        overlay.innerHTML = `<div class="live-countdown-number" style="color:var(--success)">GO!</div>`;
      } else {
        clearInterval(interval);
        overlay.remove();
        if (callback) callback();
      }
    }, 1000);
  }

  showLiveQuestion(qIndex) {
    this.currentQIndex = qIndex;
    this.hasAnswered = false;
    const q = this.quiz.questions[qIndex];

    if (this.role === 'host') {
      this.broadcast('SHOW_QUESTION', {
        questionIndex: qIndex,
        question: q
      });
      this.simulateBotsAnswering(q);
    }

    this.renderRoundUI(q);
  }

  showParticipantQuestion(q) {
    this.hasAnswered = false;
    this.renderRoundUI(q);
  }

  renderRoundUI(q) {
    const container = document.getElementById('live-arena-view-container');
    if (!container) return;

    this.roundTimer = 15;
    this.roundStartTime = Date.now();

    const letters = ['A', 'B', 'C', 'D'];
    let optionsHtml = '';

    if (q.type === 'multiple-choice' || q.type === 'true-false') {
      const opts = (q.type === 'multiple-choice' ? q.options : ['True', 'False']);
      optionsHtml = opts.map((opt, idx) => `
        <div class="player-option-card live-option-btn" data-opt="${idx}">
          <div class="player-option-letter">${q.type === 'multiple-choice' ? letters[idx] : (idx === 0 ? '✅' : '❌')}</div>
          <div style="font-weight:700; font-size:1.15rem;">${this.escapeHtml(opt)}</div>
        </div>
      `).join('');
    } else {
      optionsHtml = `
        <div class="form-group" style="margin-top:1rem;">
          <input type="text" class="form-input" id="live-open-ans" placeholder="Type answer and press Enter...">
          <button type="button" class="btn btn-primary" id="btn-live-submit-open" style="margin-top:0.75rem; width:100%;">Submit Answer</button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="player-container">
        <div class="player-header">
          <div>
            <span class="hero-tag">Question ${this.currentQIndex + 1} of ${this.quiz.questions.length}</span>
            <h2>${this.escapeHtml(this.quiz.title)}</h2>
          </div>
          <div class="player-timer-badge" id="live-timer-badge">
            ⏱️ <span id="live-timer-val">${this.roundTimer}s</span>
          </div>
        </div>

        <div class="player-question-card">
          <div class="player-question-text">${this.escapeHtml(q.question)}</div>
          <div class="player-options-grid" id="live-options-grid">
            ${optionsHtml}
          </div>
          <div id="live-waiting-feedback" style="display:none; text-align:center; padding:1.5rem; background:var(--bg-input); border-radius:var(--radius-lg); margin-top:1rem;">
            <h3>Answer locked in! 🎯</h3>
            <p>Waiting for other players or timer to finish...</p>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    container.querySelectorAll('.live-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.hasAnswered) return;
        const opt = parseInt(btn.dataset.opt, 10);
        this.submitPlayerAnswer(opt);
        btn.classList.add('selected');
      });
    });

    const openBtn = document.getElementById('btn-live-submit-open');
    if (openBtn) {
      openBtn.addEventListener('click', () => {
        if (this.hasAnswered) return;
        const val = document.getElementById('live-open-ans').value.trim();
        this.submitPlayerAnswer(val);
      });
    }

    // Start Round Timer
    clearInterval(this.roundInterval);
    this.roundInterval = setInterval(() => {
      this.roundTimer--;
      const timerVal = document.getElementById('live-timer-val');
      if (timerVal) timerVal.textContent = `${this.roundTimer}s`;

      if (this.roundTimer <= 5 && this.roundTimer > 0) {
        if (window.soundFX) window.soundFX.playTick();
      }

      if (this.roundTimer <= 0) {
        clearInterval(this.roundInterval);
        this.endRound();
      }
    }, 1000);
  }

  submitPlayerAnswer(answer) {
    this.hasAnswered = true;
    const timeMs = Date.now() - this.roundStartTime;
    if (window.soundFX) window.soundFX.playClick();

    const feedback = document.getElementById('live-waiting-feedback');
    const grid = document.getElementById('live-options-grid');
    if (feedback) feedback.style.display = 'block';
    if (grid) grid.style.pointerEvents = 'none';

    if (this.role === 'host') {
      this.recordPlayerAnswer(this.myPlayerId, answer, timeMs);
    } else {
      this.broadcast('PLAYER_ANSWERED', {
        playerId: this.myPlayerId,
        answer: answer,
        timeMs: timeMs
      });
    }
  }

  simulateBotsAnswering(q) {
    this.botIntervals.forEach(clearInterval);
    this.botIntervals = [];

    const bots = this.players.filter(p => p.isBot);
    bots.forEach(bot => {
      // Delay between 2s and 9s
      const delay = Math.floor(2000 + Math.random() * 7000);
      const timer = setTimeout(() => {
        let answer = 0;
        const accuracy = Math.random();

        if (q.type === 'multiple-choice' || q.type === 'true-false') {
          const correct = q.correctAnswers[0];
          // Bot answers correctly 75% of time
          if (accuracy < 0.75) {
            answer = correct;
          } else {
            const count = (q.options ? q.options.length : 2);
            answer = (correct + 1) % count;
          }
        } else if (q.type === 'open-ended') {
          answer = (accuracy < 0.75 ? (q.acceptedKeywords[0] || 'answer') : 'incorrect answer');
        }

        this.recordPlayerAnswer(bot.id, answer, delay);
      }, delay);

      this.botIntervals.push(timer);
    });
  }

  recordPlayerAnswer(playerId, answer, timeMs) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    const q = this.quiz.questions[this.currentQIndex];
    let isCorrect = false;

    if (q.type === 'multiple-choice' || q.type === 'true-false') {
      isCorrect = (q.correctAnswers[0] === answer);
    } else if (q.type === 'open-ended') {
      const cleanAns = String(answer).toLowerCase().trim();
      isCorrect = (q.acceptedKeywords || []).some(k => cleanAns.includes(k.toLowerCase()));
    }

    if (isCorrect) {
      // Speed multiplier: max 1000 points scaled by time remaining
      const speedScore = Math.max(200, Math.round(1000 * (1 - timeMs / 15000)));
      player.streak = (player.streak || 0) + 1;
      const streakBonus = Math.min(player.streak * 50, 300);
      player.score = (player.score || 0) + speedScore + streakBonus;
    } else {
      player.streak = 0;
    }

    player.lastCorrect = isCorrect;
  }

  endRound() {
    clearInterval(this.roundInterval);
    if (this.role !== 'host') return;

    const q = this.quiz.questions[this.currentQIndex];
    let displayCorrect = '';
    if (q.type === 'multiple-choice') {
      displayCorrect = q.options[q.correctAnswers[0]];
    } else if (q.type === 'true-false') {
      displayCorrect = q.correctAnswers[0] === 0 ? 'True' : 'False';
    } else {
      displayCorrect = (q.acceptedKeywords || []).join(' / ');
    }

    this.broadcast('SHOW_ROUND_RESULTS', {
      players: this.players,
      correctAnswer: displayCorrect,
      explanation: q.explanation || ''
    });

    this.showRoundLeaderboard(displayCorrect, q.explanation || '');
  }

  showRoundLeaderboard(correctAnswer, explanation) {
    const container = document.getElementById('live-arena-view-container');
    if (!container) return;

    // Sort players by score
    this.players.sort((a, b) => (b.score || 0) - (a.score || 0));

    const isLastQ = (this.currentQIndex >= this.quiz.questions.length - 1);

    container.innerHTML = `
      <div class="player-container">
        <div class="card" style="text-align:center; margin-bottom:2rem;">
          <h2 style="color:var(--success);">Round Results! 🎯</h2>
          <p style="margin: 0.5rem 0;">Correct Answer: <strong>${this.escapeHtml(correctAnswer)}</strong></p>
          ${explanation ? `<div class="player-explanation-box visible" style="margin-top:1rem; text-align:left;">💡 <strong>Explanation:</strong> ${this.escapeHtml(explanation)}</div>` : ''}
        </div>

        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>Leaderboard</h3>
            <span class="badge badge-cat">Round ${this.currentQIndex + 1} of ${this.quiz.questions.length}</span>
          </div>

          <div class="leaderboard-list">
            ${this.players.map((p, idx) => `
              <div class="leaderboard-row rank-${idx + 1}">
                <div class="leaderboard-rank">#${idx + 1}</div>
                <div class="leaderboard-player">
                  <span style="font-size:1.5rem;">${p.avatar}</span>
                  <div>
                    <strong style="color:var(--text-main);">${this.escapeHtml(p.name)}</strong>
                    ${p.streak > 1 ? `<span class="badge badge-diff-easy">🔥 ${p.streak} Streak!</span>` : ''}
                  </div>
                </div>
                <div class="leaderboard-score">${(p.score || 0).toLocaleString()} pts</div>
              </div>
            `).join('')}
          </div>

          ${this.role === 'host' ? `
            <div style="text-align:center; margin-top:2rem;">
              <button type="button" class="btn btn-primary btn-lg" id="btn-next-live-round">
                ${isLastQ ? '🏆 Reveal Final Podium!' : 'Next Question ➔'}
              </button>
            </div>
          ` : `
            <div style="text-align:center; margin-top:1.5rem; color:var(--text-muted);">
              Waiting for host to proceed to next round...
            </div>
          `}
        </div>
      </div>
    `;

    if (this.role === 'host') {
      document.getElementById('btn-next-live-round').addEventListener('click', () => {
        if (isLastQ) {
          this.broadcast('GAME_OVER', { players: this.players });
          this.showFinalPodium();
        } else {
          this.showLiveQuestion(this.currentQIndex + 1);
        }
      });
    }
  }

  showFinalPodium() {
    const container = document.getElementById('live-arena-view-container');
    if (!container) return;

    this.players.sort((a, b) => (b.score || 0) - (a.score || 0));
    const p1 = this.players[0] || { name: '-', avatar: '👑', score: 0 };
    const p2 = this.players[1] || { name: '-', avatar: '🥈', score: 0 };
    const p3 = this.players[2] || { name: '-', avatar: '🥉', score: 0 };

    if (window.soundFX) window.soundFX.playFanfare();
    if (window.app && window.app.fireConfetti) window.app.fireConfetti();

    container.innerHTML = `
      <div class="player-container text-center">
        <div class="report-hero">
          <div class="report-badge-stamp">🏆</div>
          <h1>Live Arena Champions!</h1>
          <p>Glorious victory in ${this.escapeHtml(this.quiz.title)}</p>

          <!-- 3D Podium Graphic -->
          <div class="podium-container">
            <!-- 2nd Place -->
            <div class="podium-step podium-2">
              <div style="font-size:2.5rem;">${p2.avatar}</div>
              <div style="font-weight:700; margin-bottom:0.5rem;">${this.escapeHtml(p2.name)}</div>
              <div class="badge badge-secondary" style="margin-bottom:0.5rem;">${(p2.score || 0).toLocaleString()} pts</div>
              <div class="podium-pillar">2</div>
            </div>

            <!-- 1st Place -->
            <div class="podium-step podium-1 bounce-podium">
              <div style="font-size:3.5rem;">👑</div>
              <div style="font-size:3rem; margin-top:-1rem;">${p1.avatar}</div>
              <div style="font-weight:800; font-size:1.2rem; margin-bottom:0.5rem; color:#f59e0b;">${this.escapeHtml(p1.name)}</div>
              <div class="badge badge-warning" style="margin-bottom:0.5rem;">${(p1.score || 0).toLocaleString()} pts</div>
              <div class="podium-pillar">1</div>
            </div>

            <!-- 3rd Place -->
            <div class="podium-step podium-3">
              <div style="font-size:2.2rem;">${p3.avatar}</div>
              <div style="font-weight:700; margin-bottom:0.5rem;">${this.escapeHtml(p3.name)}</div>
              <div class="badge badge-secondary" style="margin-bottom:0.5rem;">${(p3.score || 0).toLocaleString()} pts</div>
              <div class="podium-pillar">3</div>
            </div>
          </div>

          <div style="display:flex; justify-content:center; gap:1rem; margin-top:2rem;">
            <button type="button" class="btn btn-primary" id="btn-finish-live">Return to Dashboard</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-finish-live').addEventListener('click', () => {
      this.cleanup();
      window.app.navigateTo('dashboard');
    });
  }

  cleanup() {
    clearInterval(this.roundInterval);
    this.botIntervals.forEach(clearInterval);
    this.botIntervals = [];
    this.role = null;
    this.gamePin = null;
    this.quiz = null;
    this.players = [];
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

window.liveArena = new LiveArena();
