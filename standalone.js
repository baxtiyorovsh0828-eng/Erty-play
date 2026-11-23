(() => {
	const page = document.body.dataset.page;
	const programs = Array.isArray(window.ertyPrograms) ? window.ertyPrograms : [];
	const search = document.getElementById('catalogSearch');
	const genreFilters = document.getElementById('genreFilters');
	let activeGenre = 'all';

	function readSaved() {
		try {
			const saved = JSON.parse(localStorage.getItem('erty-library') || '[]');
			return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : [];
		} catch {
			return [];
		}
	}

	function writeSaved(saved) {
		try {
			localStorage.setItem('erty-library', JSON.stringify(saved));
			return true;
		} catch {
			return false;
		}
	}

	function setActiveNavigation() {
		const key = page === 'single' ? 'games' : page;
		const active = document.querySelector(`[data-nav="${key}"]`);
		active?.setAttribute('aria-current', 'page');
	}

	function createCard(program, isLibrary = false) {
		const article = document.createElement('article');
		article.className = 'store-card';
		const image = document.createElement('img');
		image.src = program.image;
		image.alt = '';
		image.loading = 'lazy';
		const body = document.createElement('div');
		const title = document.createElement('h2');
		title.textContent = program.name;
		const category = document.createElement('p');
		category.textContent = program.category;
		const description = document.createElement('p');
		description.className = 'card-description';
		description.textContent = program.description;
		const rating = document.createElement('p');
		rating.className = 'card-rating';
		rating.textContent = `${program.rating} ★ · ${program.price}`;
		body.append(title, category, description, rating);
		const actions = document.createElement('div');
		actions.className = 'card-actions';
		const details = document.createElement('a');
		details.href = `single.html?id=${encodeURIComponent(program.id)}`;
		details.className = 'primary';
		details.textContent = 'Batafsil';
		actions.append(details);

		if (isLibrary) {
			const remove = document.createElement('button');
			remove.type = 'button';
			remove.dataset.remove = program.id;
			remove.textContent = "O'chirish";
			actions.append(remove);
		} else {
			const add = document.createElement('button');
			add.type = 'button';
			add.dataset.save = program.id;
			const saved = readSaved().includes(program.id);
			add.textContent = saved ? 'Saqlangan' : "Kutubxonaga qo'shish";
			add.setAttribute('aria-pressed', String(saved));
			actions.append(add);
		}

		article.append(image, body, actions);
		return article;
	}

	function getPageProducts() {
		if (page === 'games') return programs.filter((item) => item.type === 'game');
		if (page === 'apps') return programs.filter((item) => item.type === 'app');
		return programs;
	}

	function renderCatalog() {
		const grid = document.getElementById('productGrid');
		if (!grid) return;
		const query = search.value.trim().toLocaleLowerCase('uz');
		const filtered = getPageProducts().filter((item) => {
			const matchesQuery = `${item.name} ${item.category} ${item.description}`.toLocaleLowerCase('uz').includes(query);
			const matchesGenre = activeGenre === 'all' || item.genre === activeGenre || (activeGenre === 'action' && item.genre === 'adventure');
			return matchesQuery && matchesGenre;
		});
		grid.replaceChildren(...filtered.map((item) => createCard(item)));
		document.getElementById('resultsCount').textContent = `${filtered.length} ta mahsulot`;
		document.getElementById('noResults').hidden = filtered.length > 0;
	}

	function renderLibrary() {
		const grid = document.getElementById('libraryGrid');
		if (!grid) return;
		const saved = readSaved();
		const items = programs.filter((item) => saved.includes(item.id));
		grid.replaceChildren(...items.map((item) => createCard(item, true)));
		document.getElementById('libraryCount').textContent = `${items.length} ta mahsulot`;
		document.getElementById('libraryEmpty').hidden = items.length > 0;
	}

	function renderDetail() {
		const root = document.getElementById('detailRoot');
		const item = programs.find((program) => program.id === new URLSearchParams(location.search).get('id'));
		if (!item) {
			const message = document.createElement('section');
			message.className = 'library-empty';
			message.textContent = 'Mahsulot topilmadi. Katalogdan boshqa mahsulot tanlang.';
			root.replaceChildren(message);
			return;
		}
		document.title = `${item.name} — ERTY Store`;
		const hero = document.createElement('section');
		hero.className = 'product-hero';
		const heroInner = document.createElement('div');
		heroInner.className = 'product-hero-inner';
		const icon = document.createElement('img');
		icon.className = 'product-icon';
		icon.src = item.image;
		icon.alt = '';
		const copy = document.createElement('div');
		copy.className = 'product-hero-copy';
		const eyebrow = document.createElement('p');
		eyebrow.className = 'eyebrow';
		eyebrow.textContent = 'ERTY STORE TAVSIYA QILADI';
		const title = document.createElement('h1');
		title.textContent = item.name;
		const category = document.createElement('p');
		category.className = 'product-hero-category';
		category.textContent = item.category;
		const rating = document.createElement('p');
		rating.className = 'product-hero-rating';
		rating.textContent = `${item.rating} ★ · ${item.type === 'game' ? "O'yin" : 'Ilova'} · ${item.price}`;
		const description = document.createElement('p');
		description.className = 'product-hero-description';
		description.textContent = item.description;
		const actions = document.createElement('div');
		actions.className = 'product-hero-actions';
		const official = document.createElement('a');
		official.className = 'product-download';
		official.href = item.downloadUrl;
		official.target = '_blank';
		official.rel = 'noopener noreferrer';
		official.textContent = item.type === 'game' ? "O'yinni yuklab olish" : 'Ilovani yuklab olish';
		const save = document.createElement('button');
		save.type = 'button';
		save.className = 'product-save';
		const status = document.createElement('p');
		status.className = 'product-status';
		status.setAttribute('role', 'status');
		status.setAttribute('aria-live', 'polite');
		function updateSaveButton() {
			const isSaved = readSaved().includes(item.id);
			save.textContent = isSaved ? 'Kutubxonada' : "Kutubxonaga qo'shish";
			save.setAttribute('aria-pressed', String(isSaved));
		}
		save.addEventListener('click', () => {
			const saved = readSaved();
			const next = saved.includes(item.id) ? saved.filter((id) => id !== item.id) : [...saved, item.id];
			const persisted = writeSaved(next);
			updateSaveButton();
			status.textContent = persisted ? 'Kutubxona yangilandi.' : 'Brauzerda saqlab bo‘lmadi.';
		});
		updateSaveButton();		
		actions.append(official, save);
		copy.append(eyebrow, title, category, rating, description, actions, status);
		heroInner.append(icon, copy);
		hero.append(heroInner);

		const content = document.createElement('section');
		content.className = 'product-detail-content';
		const gallery = document.createElement('div');
		gallery.className = 'product-gallery';
		const galleryHeading = document.createElement('div');
		galleryHeading.className = 'product-section-heading';
		const galleryTitle = document.createElement('h2');
		galleryTitle.textContent = 'Mahsulot rasmi';
		galleryHeading.append(galleryTitle);
		const galleryImage = document.createElement('img');
		galleryImage.className = 'product-gallery-image';
		galleryImage.src = item.image;
		galleryImage.alt = `${item.name} tasviri`;
		gallery.append(galleryHeading, galleryImage);

		const recommendations = document.createElement('aside');
		recommendations.className = 'product-recommendations';
		const recommendHeading = document.createElement('div');
		recommendHeading.className = 'product-section-heading';
		const recommendTitle = document.createElement('h2');
		recommendTitle.textContent = 'Sizga yoqishi mumkin';
		recommendHeading.append(recommendTitle);
		recommendations.append(recommendHeading);
		programs.filter((program) => program.id !== item.id && program.type === item.type).slice(0, 3).forEach((program) => {
			const link = document.createElement('a');
			link.className = 'product-recommendation';
			link.href = `single.html?id=${encodeURIComponent(program.id)}`;
			const image = document.createElement('img');
			image.src = program.image;
			image.alt = '';
			const text = document.createElement('span');
			const name = document.createElement('strong');
			name.textContent = program.name;
			const meta = document.createElement('small');
			meta.textContent = `${program.category} · ${program.rating} ★`;
			const price = document.createElement('span');
			price.className = 'product-recommendation-price';
			price.textContent = program.price;
			text.append(name, meta);
			link.append(image, text, price);
			recommendations.append(link);
		});
		content.append(gallery, recommendations);
		root.replaceChildren(hero, content);
	}

	function handleCardAction(event) {
		const save = event.target.closest('[data-save]');
		const remove = event.target.closest('[data-remove]');
		if (!save && !remove) return;
		const id = (save || remove).dataset.save || (save || remove).dataset.remove;
		const current = readSaved();
		const updated = remove ? current.filter((key) => key !== id) : [...new Set([...current, id])];
		writeSaved(updated);
		if (page === 'library') renderLibrary();
		else renderCatalog();
	}

	setActiveNavigation();
	if (page === 'games' || page === 'apps' || page === 'collections') {
		search?.addEventListener('input', renderCatalog);
		genreFilters?.addEventListener('click', (event) => {
			const button = event.target.closest('[data-genre]');
			if (!button) return;
			activeGenre = button.dataset.genre;
			genreFilters.querySelectorAll('[data-genre]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
			renderCatalog();
		});
		document.getElementById('productGrid').addEventListener('click', handleCardAction);
		renderCatalog();
	} else if (page === 'library') {
		document.getElementById('libraryGrid').addEventListener('click', handleCardAction);
		renderLibrary();
	} else if (page === 'single') {
		renderDetail();
	}
})();
