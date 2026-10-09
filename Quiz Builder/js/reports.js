/* ==========================================================================
   QuizCraft - Results, Analytics & Report Generator Module
   Supports: Performance Breakdown, Question Review, CSV Export & Printable Certificate
   ========================================================================== */

class ReportManager {
  constructor() {
    this.currentAttempt = null;
    this.currentQuiz = null;
  }

  displayReport(attempt, quiz) {
    this.currentAttempt = attempt;
    this.currentQuiz = quiz || window.store.getQuizById(attempt.quizId);

    const container = document.getElementById('report-view-container');
    if (!container) return;

    const { score, totalQuestions, percentage, passed, timeSpentSeconds, review } = attempt;

    // Time formatted
    const mins = Math.floor(timeSpentSeconds / 60);
    const secs = timeSpentSeconds % 60;
    const timeDisplay = `${mins > 0 ? `${mins}m ` : ''}${secs}s`;

    // Performance by type
    const statsByType = {};
    review.forEach(item => {
      const type = item.type || 'multiple-choice';
      if (!statsByType[type]) {
        statsByType[type] = { total: 0, correct: 0 };
      }
      statsByType[type].total++;
      if (item.isCorrect) statsByType[type].correct++;
    });

    const typeRows = Object.keys(statsByType).map(t => {
      const label = {
        'multiple-choice': 'Multiple Choice',
        'true-false': 'True / False',
        'open-ended': 'Open-Ended'
      }[t] || t;
      const s = statsByType[t];
      const acc = Math.round((s.correct / s.total) * 100);
      return `
        <div style="margin-bottom:0.75rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:600; margin-bottom:0.25rem;">
            <span>${label}</span>
            <span>${s.correct} / ${s.total} (${acc}%)</span>
          </div>
          <div style="height:6px; background:var(--border-color); border-radius:var(--radius-full); overflow:hidden;">
            <div style="height:100%; width:${acc}%; background:var(--primary); border-radius:var(--radius-full);"></div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="printable-report-area">
        <div class="report-hero">
          <div class="report-badge-stamp">${passed ? '🏆' : '📚'}</div>
          <h1>${passed ? 'Congratulations!' : 'Keep Learning!'}</h1>
          <p style="font-size:1.15rem; margin-top:0.35rem;">
            ${passed ? `You passed the assessment for <strong>${this.escapeHtml(attempt.quizTitle)}</strong>!` : `You didn't reach the passing score (${this.currentQuiz?.passPercentage || 70}%) this time.`}
          </p>

          <!-- Core Stat Cards -->
          <div class="report-stats-grid">
            <div class="report-stat-box">
              <div class="report-stat-val" style="color:${passed ? 'var(--success)' : 'var(--danger)'};">${percentage}%</div>
              <div style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Overall Score</div>
            </div>
            <div class="report-stat-box">
              <div class="report-stat-val">${score} / ${totalQuestions}</div>
              <div style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Correct Answers</div>
            </div>
            <div class="report-stat-box">
              <div class="report-stat-val">${timeDisplay}</div>
              <div style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Time Elapsed</div>
            </div>
            <div class="report-stat-box">
              <div class="report-stat-val" style="font-size:1.5rem; text-transform:uppercase; color:${passed ? 'var(--success)' : 'var(--danger)'};">
                ${passed ? 'PASSED' : 'RETRY'}
              </div>
              <div style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Status</div>
            </div>
          </div>

          <!-- Actions toolbar -->
          <div class="no-print" style="display:flex; justify-content:center; gap:0.75rem; flex-wrap:wrap; margin-top:1.5rem;">
            <button type="button" class="btn btn-primary" id="btn-print-report">🖨️ Print Certificate & Report</button>
            <button type="button" class="btn btn-secondary" id="btn-export-csv">📥 Export as CSV</button>
            <button type="button" class="btn btn-secondary" id="btn-retake-quiz">🔄 Retake Quiz</button>
            <button type="button" class="btn btn-ghost" id="btn-return-dashboard">Dashboard</button>
          </div>
        </div>

        <!-- Breakdown Section -->
        <div class="card" style="margin-bottom:2rem;">
          <h3>Performance by Question Type</h3>
          <div style="margin-top:1.25rem;">
            ${typeRows}
          </div>
        </div>

        <!-- Question Review Section -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
            <h3>Detailed Question Review</h3>
            <div class="category-chips no-print">
              <button type="button" class="chip-btn active" id="btn-filter-all">All (${review.length})</button>
              <button type="button" class="chip-btn" id="btn-filter-correct">Correct (${score})</button>
              <button type="button" class="chip-btn" id="btn-filter-wrong">Incorrect (${totalQuestions - score})</button>
            </div>
          </div>

          <div id="review-list-container">
            ${this.renderReviewItems(review, 'all')}
          </div>
        </div>
      </div>
    `;

    this.bindReportEvents(container, review);
    window.app.navigateTo('reports');
  }

  renderReviewItems(reviewList, filter) {
    const filtered = reviewList.filter(item => {
      if (filter === 'correct') return item.isCorrect;
      if (filter === 'wrong') return !item.isCorrect;
      return true;
    });

    if (filtered.length === 0) {
      return `<p style="text-align:center; padding:2rem; color:var(--text-muted);">No questions match this filter.</p>`;
    }

    return filtered.map((item, idx) => `
      <div class="review-item ${item.isCorrect ? 'status-correct' : 'status-wrong'}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
          <div style="font-weight:700; font-size:1.05rem;">
            <span>#${idx + 1}</span> ${this.escapeHtml(item.prompt)}
          </div>
          <span class="badge ${item.isCorrect ? 'badge-diff-easy' : 'badge-diff-hard'}">
            ${item.isCorrect ? '✅ Correct' : '❌ Incorrect'}
          </span>
        </div>

        <div style="font-size:0.9rem; margin-bottom:0.5rem;">
          <span style="color:var(--text-muted);">Your Answer:</span>
          <strong style="color:${item.isCorrect ? 'var(--success)' : 'var(--danger)'};"> ${this.escapeHtml(item.userAnswer || 'None')}</strong>
        </div>

        ${!item.isCorrect ? `
          <div style="font-size:0.9rem; margin-bottom:0.5rem;">
            <span style="color:var(--text-muted);">Correct Answer:</span>
            <strong style="color:var(--success);"> ${this.escapeHtml(item.correctAnswer)}</strong>
          </div>
        ` : ''}

        ${item.explanation ? `
          <div style="margin-top:0.75rem; padding:0.75rem 1rem; background:var(--bg-input); border-radius:var(--radius-md); font-size:0.85rem; color:var(--text-secondary);">
            💡 <strong>Explanation:</strong> ${this.escapeHtml(item.explanation)}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  bindReportEvents(container, review) {
    // Print
    const printBtn = container.querySelector('#btn-print-report');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        if (window.soundFX) window.soundFX.playClick();
        window.print();
      });
    }

    // Export CSV
    const csvBtn = container.querySelector('#btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        if (window.soundFX) window.soundFX.playClick();
        this.exportCSV();
      });
    }

    // Retake
    const retakeBtn = container.querySelector('#btn-retake-quiz');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        if (this.currentQuiz) {
          window.player.startQuiz(this.currentQuiz);
        }
      });
    }

    // Dashboard
    const dashBtn = container.querySelector('#btn-return-dashboard');
    if (dashBtn) {
      dashBtn.addEventListener('click', () => {
        window.app.navigateTo('dashboard');
      });
    }

    // Review Filters
    const reviewList = container.querySelector('#review-list-container');
    const filterAll = container.querySelector('#btn-filter-all');
    const filterCorrect = container.querySelector('#btn-filter-correct');
    const filterWrong = container.querySelector('#btn-filter-wrong');

    const updateFilterUI = (btn, filterName) => {
      [filterAll, filterCorrect, filterWrong].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reviewList.innerHTML = this.renderReviewItems(review, filterName);
      if (window.soundFX) window.soundFX.playClick();
    };

    if (filterAll) filterAll.addEventListener('click', () => updateFilterUI(filterAll, 'all'));
    if (filterCorrect) filterCorrect.addEventListener('click', () => updateFilterUI(filterCorrect, 'correct'));
    if (filterWrong) filterWrong.addEventListener('click', () => updateFilterUI(filterWrong, 'wrong'));
  }

  exportCSV() {
    if (!this.currentAttempt) return;
    const a = this.currentAttempt;

    let csv = `Quiz Report: ${a.quizTitle}\r\n`;
    csv += `Student Name: ${a.userName}\r\n`;
    csv += `Date: ${new Date(a.timestamp).toLocaleString()}\r\n`;
    csv += `Score: ${a.score} / ${a.totalQuestions} (${a.percentage}%)\r\n`;
    csv += `Status: ${a.passed ? 'PASSED' : 'FAILED'}\r\n\r\n`;

    csv += `Question #,Prompt,Type,Your Answer,Correct Answer,Status\r\n`;
    a.review.forEach((r, idx) => {
      const prompt = `"${r.prompt.replace(/"/g, '""')}"`;
      const userAns = `"${(r.userAnswer || '').replace(/"/g, '""')}"`;
      const correctAns = `"${(r.correctAnswer || '').replace(/"/g, '""')}"`;
      const status = r.isCorrect ? 'Correct' : 'Incorrect';
      csv += `${idx + 1},${prompt},${r.type},${userAns},${correctAns},${status}\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${a.quizTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_scorecard.csv`;
    link.click();
    URL.revokeObjectURL(url);
    window.app.showToast('CSV report downloaded!', 'success');
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

window.reports = new ReportManager();
