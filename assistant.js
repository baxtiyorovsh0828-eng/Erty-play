(() => {
	const form = document.getElementById('needFinderForm');
	if (!form) return;

	const input = document.getElementById('needInput');
	const results = document.getElementById('needResults');
	const grid = document.getElementById('needResultsGrid');
	const programs = Array.isArray(window.ertyPrograms) ? window.ertyPrograms : [];
	const intentGroups = [
		{ terms: ['do st', 'dost', 'gaplash', 'suhbat', 'ovoz', 'chat', 'aloqa', 'muloqot', 'hamjamiyat'], ids: ['discord', 'roblox'] },
		{ terms: ['poyga', 'mashina', 'avtomobil', 'tezlik', 'haydash', 'racing'], ids: ['forza', 'rocket-league'] },
		{ terms: ['jang', 'otishma', 'urush', 'ekshn', 'action', 'taktik'], ids: ['halo', 'valorant'] },
		{ terms: ['ferma', 'dehqon', 'ekin', 'tinch', 'dam ol', 'osoyishta', 'relax', 'fermer'], ids: ['stardew-valley'] },
		{ terms: ['tarix', 'sivilizatsiya', 'strategiya', 'resurs', 'boshqar'], ids: ['age'] },
		{ terms: ['qurish', 'ijod', 'sandbox', 'survival', 'blok'], ids: ['minecraft', 'roblox'] },
		{ terms: ['rasm', 'foto', 'photoshop', 'tahrir', 'dizayn', 'image', 'graphic'], ids: ['gimp'] },
		{ terms: ['3d', 'model', 'animats', 'render', 'visual'], ids: ['blender'] },
		{ terms: ['video', 'stream', 'strim', 'efir', 'record', 'yozib olish'], ids: ['obs', 'vlc'] },
		{ terms: ['film', 'kino', 'musiqa', 'media', 'player'], ids: ['vlc'] },
		{ terms: ['zip', 'arxiv', 'fayl', 'siqish', 'rar'], ids: ['7zip'] },
		{ terms: ['o yin', 'game', 'launcher', 'store', 'platforma'], ids: ['steam'] },
		{ terms: ['joystick', 'controller', 'gamepad', 'boshqaruv', 'qurilma'], ids: ['xbox'] }
	];

	function normalize(value) {
		return value.toLocaleLowerCase('uz')
			.replace(/[ʻʼ‘’']/g, '')
			.replace(/[^\p{L}\p{N}]+/gu, ' ')
			.trim();
	}

	function scoreProgram(program, query) {
		const normalizedQuery = normalize(query);
		const stopWords = new Set(['bilan', 'va', 'yoki', 'uchun', 'kerak', 'menga', 'men', 'qanday', 'olish', 'olmoq', 'topib', 'ber']);
		const queryWords = normalizedQuery.split(/\s+/).filter((word) => word.length > 2 && !stopWords.has(word));
		const searchable = normalize([
			program.name,
			program.category,
			program.genre,
			program.description,
			...(Array.isArray(program.keywords) ? program.keywords : [])
		].join(' '));
		let score = 0;

		queryWords.forEach((word) => {
			if (searchable.includes(word)) score += 2;
		});

		intentGroups.forEach((group) => {
			const intentMatches = group.terms.some((term) => normalizedQuery.includes(normalize(term)));
			if (intentMatches && group.ids.includes(program.id)) score += 6;
		});

		if (normalizedQuery.includes(normalize(program.name))) score += 5;
		return score;
	}

	function readSaved() {
		try {
			const saved = JSON.parse(localStorage.getItem('erty-library') || '[]');
			return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : [];
		} catch {
			return [];
		}
	}

	function saveProduct(id) {
		const button = grid.querySelector(`[data-save="${CSS.escape(id)}"]`);
		const saved = readSaved();
		if (saved.includes(id)) {
			button.textContent = 'Saqlangan';
			button.setAttribute('aria-pressed', 'true');
			return;
		}
		try {
			localStorage.setItem('erty-library', JSON.stringify([...saved, id]));
			button.textContent = 'Saqlangan';
			button.setAttribute('aria-pressed', 'true');
		} catch {
			button.textContent = 'Saqlab bo‘lmadi';
		}
	}

	function renderRecommendations(query) {
		const matches = programs
			.map((program) => ({ program, score: scoreProgram(program, query) }))
			.filter((item) => item.score >= 4)
			.sort((left, right) => right.score - left.score || Number(right.program.rating) - Number(left.program.rating))
			.slice(0, 3);

		grid.replaceChildren();
		document.getElementById('needResultsTitle').textContent = `Mos tavsiyalar: “${query}”`;
		document.getElementById('needResultsCount').textContent = matches.length ? `${matches.length} ta mos mahsulot` : '';
		results.hidden = false;

		if (!matches.length) {
			const message = document.createElement('p');
			message.className = 'need-result-empty';
			message.textContent = 'Aniq mos mahsulot topilmadi. Boshqacha yozib ko‘ring: masalan, “poyga”, “rasm tahrirlash” yoki “ovozli chat”.';
			grid.append(message);
			return;
		}

		matches.forEach(({ program, score }, index) => {
			const card = document.createElement('article');
			card.className = 'need-result';
			const image = document.createElement('img');
			image.src = program.image;
			image.alt = '';
			image.loading = 'lazy';
			const info = document.createElement('div');
			info.className = 'need-result-main';
			const name = document.createElement('strong');
			name.textContent = program.name;
			const meta = document.createElement('span');
			meta.textContent = `${program.category} · ${program.rating} ★ · ${program.price}`;
			info.append(name, meta);
			const actions = document.createElement('div');
			actions.className = 'need-result-actions';
			const details = document.createElement('a');
			details.className = 'need-details';
			details.href = `single.html?id=${encodeURIComponent(program.id)}`;
			details.textContent = 'Batafsil';
			const save = document.createElement('button');
			save.type = 'button';
			save.dataset.save = program.id;
			save.textContent = readSaved().includes(program.id) ? 'Saqlangan' : 'Kutubxonaga';
			save.setAttribute('aria-pressed', String(readSaved().includes(program.id)));
			save.addEventListener('click', () => saveProduct(program.id));
			actions.append(details, save);
			card.append(image, info, actions);
			grid.append(card);
			card.style.setProperty('--recommendation-order', String(index + 1));
			card.dataset.matchScore = String(score);
		});
	}

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const query = input.value.trim();
		if (query) renderRecommendations(query);
	});

	document.querySelectorAll('[data-need-example]').forEach((button) => {
		button.addEventListener('click', () => {
			input.value = button.dataset.needExample;
			renderRecommendations(input.value);
		});
	});
})();
