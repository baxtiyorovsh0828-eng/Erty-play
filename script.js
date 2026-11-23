(() => {
	const ACCOUNTS_KEY = 'erty-accounts';
	const SESSION_KEY = 'erty-session';

	function readAccounts() {
		try {
			const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
			return Array.isArray(accounts) ? accounts : [];
		} catch {
			return [];
		}
	}

	function saveAccounts(accounts) {
		localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
	}

	function hashPassword(password) {
		let hash = 2166136261;
		for (let index = 0; index < password.length; index += 1) {
			hash ^= password.charCodeAt(index);
			hash = Math.imul(hash, 16777619);
		}
		return (hash >>> 0).toString(16);
	}

	function getSession() {
		try {
			return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
		} catch {
			return null;
		}
	}

	function setSession(account) {
		localStorage.setItem(SESSION_KEY, JSON.stringify({
			name: account.name,
			email: account.email
		}));
	}

	function clearSession() {
		localStorage.removeItem(SESSION_KEY);
	}

	function updateAccountLinks() {
		const session = getSession();
		document.querySelectorAll('.account, .store-account').forEach((link) => {
			if (session) {
				const label = link.querySelector('span:first-child');
				if (label) label.textContent = session.name;
				else link.textContent = session.name;
				link.setAttribute('aria-label', `${session.name} hisobidan chiqish`);
				link.title = 'Hisobdan chiqish';
				link.dataset.loggedIn = 'true';
			} else {
				link.dataset.loggedIn = 'false';
			}
		});
	}

	updateAccountLinks();

	document.querySelectorAll('.account, .store-account').forEach((link) => {
		link.addEventListener('click', (event) => {
			if (getSession() && window.confirm('Hisobdan chiqmoqchimisiz?')) {
				event.preventDefault();
				clearSession();
				updateAccountLinks();
				window.location.reload();
			}
		});
	});

	const forms = document.querySelectorAll('[data-auth-form]');

	// Agar sessiya ochiq bo'lsa, kirish sahifalarini ko'rsatmaymiz.
	if (getSession() && /sign(In|Up)\.html$/i.test(window.location.pathname)) {
		window.location.replace('index.html');
	}

	function setStatus(form, message, state = 'error') {
		const status = form.querySelector('[data-auth-status]');
		status.textContent = message;
		status.dataset.state = state;
	}

	function passwordRules(password) {
		return {
			length: password.length >= 8,
			upper: /[A-ZА-Я]/.test(password),
			number: /\d/.test(password),
			symbol: /[^A-Za-zА-Яа-я0-9]/.test(password)
		};
	}

	function updatePasswordFeedback(form) {
		const password = form.querySelector('[data-password]');
		if (!password) return;

		const rules = passwordRules(password.value);
		const score = Object.values(rules).filter(Boolean).length;
		const meter = form.querySelector('[data-password-meter]');
		if (meter) meter.dataset.level = String(score);

		Object.entries(rules).forEach(([rule, passed]) => {
			form.querySelector(`[data-rule="${rule}"]`)?.classList.toggle('met', passed);
		});

		const confirmation = form.querySelector('[data-password-confirm]');
		if (confirmation) {
			confirmation.setCustomValidity(
				confirmation.value && confirmation.value !== password.value
					? 'Parollar mos kelmadi.'
					: ''
			);
		}
	}

	document.querySelectorAll('[data-password-toggle]').forEach((toggle) => {
		toggle.addEventListener('click', () => {
			const input = document.getElementById(toggle.dataset.passwordToggle);
			const show = input.type === 'password';
			input.type = show ? 'text' : 'password';
			toggle.textContent = show ? 'Yashirish' : "Ko'rsatish";
			toggle.setAttribute('aria-label', show ? 'Parolni yashirish' : "Parolni ko'rsatish");
		});
	});

	forms.forEach((form) => {
		const password = form.querySelector('[data-password]');
		const confirmation = form.querySelector('[data-password-confirm]');

		password?.addEventListener('input', () => updatePasswordFeedback(form));
		confirmation?.addEventListener('input', () => updatePasswordFeedback(form));

		form.addEventListener('input', () => {
			const status = form.querySelector('[data-auth-status]');
			status.textContent = '';
			delete status.dataset.state;
		});

		form.addEventListener('submit', (event) => {
			event.preventDefault();
			updatePasswordFeedback(form);

			if (!form.reportValidity()) return;

			if (form.dataset.authForm === 'signup') {
				const rules = passwordRules(password.value);
				if (!Object.values(rules).every(Boolean)) {
					setStatus(form, 'Parol barcha xavfsizlik talablariga javob berishi kerak.');
					password.focus();
					return;
				}

				const name = form.elements.namedItem('name').value.trim();
				const email = form.elements.namedItem('email').value.trim().toLowerCase();
				const accounts = readAccounts();

				if (accounts.some((account) => account.email === email)) {
					setStatus(form, 'Bu elektron pochta bilan hisob allaqachon yaratilgan.');
					return;
				}

				const account = { name, email, passwordHash: hashPassword(password.value) };
				accounts.push(account);
				saveAccounts(accounts);
				setSession(account);
				updateAccountLinks();
				setStatus(form, 'Hisob yaratildi. Siz tizimga kirdingiz.', 'success');
				window.setTimeout(() => window.location.replace('index.html'), 500);
				return;
			}

			const login = form.elements.namedItem('email').value.trim();
			const enteredPassword = form.elements.namedItem('password').value;
			if (login === 'Admin' && enteredPassword === 'Admin123') {
				sessionStorage.setItem('erty-admin-unlocked', 'true');
				window.location.replace('admin.html');
				return;
			}
			const email = login.toLowerCase();
			const account = readAccounts().find((item) =>
				item.email === email && item.passwordHash === hashPassword(enteredPassword)
			);

			if (!account) {
				setStatus(form, 'Elektron pochta yoki parol noto‘g‘ri.');
				return;
			}

			setSession(account);
			updateAccountLinks();
			setStatus(form, 'Xush kelibsiz! Siz tizimga kirdingiz.', 'success');
			window.setTimeout(() => window.location.replace('index.html'), 500);
		});
	});

	const authOverlay = document.getElementById('authOverlay');
	if (authOverlay) {
		const tabs = authOverlay.querySelectorAll('[data-auth-tab]');
		let previousFocus = null;

		function setAuthMode(mode) {
			const activeForm = authOverlay.querySelector(`[data-auth-form="${mode}"]`);
			authOverlay.querySelectorAll('[data-auth-form]').forEach((form) => {
				form.hidden = form !== activeForm;
				form.reset();
				setStatus(form, '');
				updatePasswordFeedback(form);
			});
			tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.authTab === mode)));
			document.getElementById('authTitle').textContent = mode === 'signup' ? 'Hisob yarating' : 'Hisobingizga kiring';
		}

		function openAuth(mode, updateHash = true) {
			previousFocus = document.activeElement;
			setAuthMode(mode);
			authOverlay.classList.add('is-open');
			authOverlay.setAttribute('aria-hidden', 'false');
			document.body.style.overflow = 'hidden';
			authOverlay.querySelector(`[data-auth-form="${mode}"] input`).focus();
			if (updateHash) window.location.hash = mode;
		}

		function closeAuth() {
			authOverlay.classList.remove('is-open');
			authOverlay.setAttribute('aria-hidden', 'true');
			document.body.style.overflow = '';
			if (window.location.hash === '#signin' || window.location.hash === '#signup') window.location.hash = 'home';
			previousFocus?.focus();
		}

		document.querySelectorAll('[data-open-auth]').forEach((trigger) => {
			trigger.addEventListener('click', (event) => {
				event.preventDefault();
				openAuth(trigger.dataset.openAuth);
			});
		});

		tabs.forEach((tab) => tab.addEventListener('click', () => {
			setAuthMode(tab.dataset.authTab);
			window.location.hash = tab.dataset.authTab;
		}));
		authOverlay.querySelectorAll('[data-auth-switch]').forEach((button) => {
			button.addEventListener('click', () => {
				setAuthMode(button.dataset.authSwitch);
				window.location.hash = button.dataset.authSwitch;
			});
		});
		authOverlay.querySelector('#authClose').addEventListener('click', closeAuth);
		authOverlay.addEventListener('click', (event) => {
			if (event.target === authOverlay) closeAuth();
		});
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && authOverlay.classList.contains('is-open')) closeAuth();
		});

		const initialMode = window.location.hash.slice(1);
		if (initialMode === 'signin' || initialMode === 'signup') openAuth(initialMode, false);
	}
})();
