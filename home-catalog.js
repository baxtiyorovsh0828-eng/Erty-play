(() => {
	const programs = Array.isArray(window.ertyPrograms) ? window.ertyPrograms : [];
	const gamesGrid = document.getElementById('gamesGrid');
	const appsGrid = document.getElementById('appsGrid');
	if (!gamesGrid || !appsGrid || !window.ertyHomeCatalog) return;

	function createProductCard(program) {
		const product = document.createElement('article');
		product.className = 'product';
		product.dataset.product = '';
		product.dataset.key = program.id;
		product.dataset.category = program.genre;
		product.dataset.title = program.name;

		const image = document.createElement('img');
		image.className = 'art';
		image.src = program.image;
		image.alt = `${program.name} rasmi`;
		image.loading = 'lazy';

		const info = document.createElement('div');
		info.className = 'info';
		const title = document.createElement('h3');
		title.textContent = program.name;
		const category = document.createElement('span');
		category.className = 'category';
		category.textContent = program.category;
		const rating = document.createElement('span');
		rating.className = 'rating';
		const ratingValue = document.createElement('strong');
		ratingValue.textContent = program.rating;
		const price = document.createElement('span');
		price.textContent = program.price;
		rating.append(ratingValue, document.createTextNode(' ★ '), price);
		info.append(title, category, rating);

		const add = document.createElement('button');
		add.className = 'add';
		add.type = 'button';
		add.dataset.add = '';
		add.setAttribute('aria-label', `${program.name} kutubxonaga qo'shish`);
		add.setAttribute('aria-pressed', 'false');
		add.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>';

		add.addEventListener('click', (event) => {
			event.stopPropagation();
			window.ertyHomeCatalog.addToLibrary(product);
		});

		const details = document.createElement('a');
		details.className = 'product-details';
		details.href = `single.html?id=${encodeURIComponent(program.id)}`;
		details.textContent = 'Batafsil';
		product.addEventListener('click', (event) => {
			if (event.target.closest('button, a')) return;
			event.stopImmediatePropagation();
			window.location.href = details.href;
		});
		product.append(image, info, add, details);
		return product;
	}

	function renderGrid(grid, type, emptyMessage) {
		const empty = grid.querySelector('.empty');
		if (empty) empty.textContent = emptyMessage;
		const products = programs.filter((program) => program.type === type).map(createProductCard);
		grid.replaceChildren(...products, ...(empty ? [empty] : []));
	}

	renderGrid(gamesGrid, 'game', "Bu janr yoki qidiruv bo'yicha o'yin topilmadi.");
	renderGrid(appsGrid, 'app', "Bu qidiruv bo'yicha ilova topilmadi.");
	window.ertyHomeCatalog.refresh();
})();
