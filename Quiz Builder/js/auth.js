/* ==========================================================================
   QuizCraft - Authentication & User Management Module
   ========================================================================== */

const AVATARS = ['👩‍🏫', '🚀', '🎓', '🦁', '🦉', '⚡', '🌟', '🤖', '🦊', '🎨', '🔥', '💎'];

class AuthManager {
  constructor() {
    this.selectedAvatar = '👩‍🏫';
  }

  init() {
    this.renderAvatarPicker();
    this.bindEvents();
    this.checkSession();
  }

  renderAvatarPicker() {
    const container = document.getElementById('register-avatar-picker');
    if (!container) return;

    container.innerHTML = AVATARS.map(emoji => `
      <button type="button" class="avatar-option ${emoji === this.selectedAvatar ? 'selected' : ''}" data-avatar="${emoji}">
        ${emoji}
      </button>
    `).join('');

    container.querySelectorAll('.avatar-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedAvatar = btn.dataset.avatar;
        if (window.soundFX) window.soundFX.playClick();
      });
    });
  }

  bindEvents() {
    // Tab switching between Login and Register
    const tabLogin = document.getElementById('auth-tab-login');
    const tabRegister = document.getElementById('auth-tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.style.display = 'block';
        formRegister.style.display = 'none';
        this.clearErrors();
        if (window.soundFX) window.soundFX.playClick();
      });

      tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        formRegister.style.display = 'block';
        formLogin.style.display = 'none';
        this.clearErrors();
        if (window.soundFX) window.soundFX.playClick();
      });
    }

    // Login Form Submit
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        try {
          const user = window.store.loginUser(email, password);
          if (window.soundFX) window.soundFX.playCorrect();
          window.app.showToast(`Welcome back, ${user.name}! 👋`, 'success');
          this.updateNavUser(user);
          window.app.navigateTo('dashboard');
        } catch (err) {
          if (window.soundFX) window.soundFX.playWrong();
          errorEl.textContent = err.message;
          errorEl.classList.add('visible');
        }
      });
    }

    // Register Form Submit
    if (formRegister) {
      formRegister.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const role = document.getElementById('reg-role').value;
        const errorEl = document.getElementById('register-error');

        if (password !== confirmPassword) {
          if (window.soundFX) window.soundFX.playWrong();
          errorEl.textContent = 'Passwords do not match.';
          errorEl.classList.add('visible');
          return;
        }

        if (password.length < 6) {
          if (window.soundFX) window.soundFX.playWrong();
          errorEl.textContent = 'Password must be at least 6 characters.';
          errorEl.classList.add('visible');
          return;
        }

        try {
          const user = window.store.registerUser({
            name,
            email,
            password,
            role,
            avatar: this.selectedAvatar
          });
          if (window.soundFX) window.soundFX.playCorrect();
          window.app.showToast(`Account created! Welcome, ${user.name}! 🎉`, 'success');
          this.updateNavUser(user);
          window.app.navigateTo('dashboard');
        } catch (err) {
          if (window.soundFX) window.soundFX.playWrong();
          errorEl.textContent = err.message;
          errorEl.classList.add('visible');
        }
      });
    }

    // Demo Logins
    const demoTeacher = document.getElementById('btn-demo-teacher');
    if (demoTeacher) {
      demoTeacher.addEventListener('click', () => {
        const user = window.store.loginUser('teacher@quizcraft.io', 'password123');
        if (window.soundFX) window.soundFX.playClick();
        window.app.showToast(`Logged in as Teacher Sarah! 👩‍🏫`, 'info');
        this.updateNavUser(user);
        window.app.navigateTo('dashboard');
      });
    }

    const demoStudent = document.getElementById('btn-demo-student');
    if (demoStudent) {
      demoStudent.addEventListener('click', () => {
        const user = window.store.loginUser('student@quizcraft.io', 'password123');
        if (window.soundFX) window.soundFX.playClick();
        window.app.showToast(`Logged in as Student Alex! 🚀`, 'info');
        this.updateNavUser(user);
        window.app.navigateTo('dashboard');
      });
    }

    // Guest Mode
    const guestBtn = document.getElementById('btn-continue-guest');
    if (guestBtn) {
      guestBtn.addEventListener('click', () => {
        const guest = {
          id: 'guest_' + Date.now(),
          name: 'Guest Player',
          email: 'guest@quizcraft.io',
          role: 'Guest',
          avatar: '🎮',
          isGuest: true
        };
        window.store.setCurrentUser(guest);
        if (window.soundFX) window.soundFX.playClick();
        window.app.showToast('Playing as Guest!', 'info');
        this.updateNavUser(guest);
        window.app.navigateTo('dashboard');
      });
    }

    // Logout
    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        window.store.setCurrentUser(null);
        if (window.soundFX) window.soundFX.playClick();
        window.app.showToast('You have been logged out.', 'info');
        this.checkSession();
        window.app.navigateTo('auth');
      });
    }
  }

  clearErrors() {
    const errs = document.querySelectorAll('.form-error-msg');
    errs.forEach(el => el.classList.remove('visible'));
  }

  checkSession() {
    const user = window.store.getCurrentUser();
    this.updateNavUser(user);
    return user;
  }

  updateNavUser(user) {
    const navAuth = document.getElementById('nav-auth-section');
    const navUser = document.getElementById('nav-user-section');

    if (!user) {
      if (navAuth) navAuth.style.display = 'flex';
      if (navUser) navUser.style.display = 'none';
      return;
    }

    if (navAuth) navAuth.style.display = 'none';
    if (navUser) {
      navUser.style.display = 'flex';
      const avatarEl = document.getElementById('nav-user-avatar');
      const nameEl = document.getElementById('nav-user-name');
      const roleEl = document.getElementById('nav-user-role');

      if (avatarEl) avatarEl.textContent = user.avatar || '👤';
      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = user.role;
    }
  }
}

window.authManager = new AuthManager();
