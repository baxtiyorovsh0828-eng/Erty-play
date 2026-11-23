(() => {
	const catalog = Array.isArray(window.ertyPrograms) ? [...window.ertyPrograms] : [];
	const rows = document.getElementById('catalogRows');
	const dialog = document.getElementById('productDialog');
	const form = document.getElementById('productForm');
	const search = document.getElementById('adminSearch');
	const typeFilter = document.getElementById('typeFilter');
	const status = document.getElementById('adminStatus');
	const formError = document.getElementById('formError');
	const gate = document.getElementById('adminGate');
	const loginForm = document.getElementById('loginForm');
	const sessionKey = 'erty-admin-unlocked';
	const adminUsername = 'Admin';
	const adminPassword = 'Admin123';
	let editingId = null;

	function setUnlocked(unlocked) {
		gate.hidden = unlocked;
		document.getElementById('adminHeader').hidden = !unlocked;
		document.getElementById('adminApp').hidden = !unlocked;
		if (unlocked) sessionStorage.setItem(sessionKey, 'true');
		else sessionStorage.removeItem(sessionKey);
	}

	function initializeGate() {
		if (sessionStorage.getItem(sessionKey) === 'true') {
			setUnlocked(true);
			return;
		}

		gate.hidden = false;
		document.getElementById('adminHeader').hidden = true;
		document.getElementById('adminApp').hidden = true;
		loginForm.hidden = false;
	}

	loginForm.addEventListener('submit', (event) => {
		event.preventDefault();
		const username = loginForm.elements.namedItem('username').value.trim();
		const password = loginForm.elements.namedItem('password').value;
		const message = document.getElementById('loginStatus');
		message.textContent = '';
		if (username !== adminUsername || password !== adminPassword) {
			message.textContent = 'Login yoki parol noto‘g‘ri.';
			return;
		}
		loginForm.reset();
		setUnlocked(true);
		renderCatalog();
	});

	function persistCatalog() {
		try {
			localStorage.setItem('erty-catalog', JSON.stringify(catalog));
			window.ertyPrograms = [...catalog];
			return true;
		} catch {
			status.textContent = 'Saqlash amalga oshmadi. Brauzer xotirasi to‘la yoki bloklangan bo‘lishi mumkin.';
			return false;
		}
	}

	function updateStats() {
		document.getElementById('totalCount').textContent = String(catalog.length);
		document.getElementById('gameCount').textContent = String(catalog.filter((item) => item.type === 'game').length);
		document.getElementById('appCount').textContent = String(catalog.filter((item) => item.type === 'app').length);
	}

	function createCell(content) {
		const cell = document.createElement('td');
		if (content instanceof Node) cell.append(content);
		else cell.textContent = content;
		return cell;
	}

	function renderCatalog() {
		const query = search.value.trim().toLocaleLowerCase('uz');
		const type = typeFilter.value;
		const filtered = catalog.filter((item) => {
			const searchable = `${item.name} ${item.category} ${item.genre} ${item.type}`.toLocaleLowerCase('uz');
			return (!query || searchable.includes(query)) && (type === 'all' || item.type === type);
		});
		rows.replaceChildren();
		filtered.forEach((item) => {
			const row = document.createElement('tr');
			const product = document.createElement('div');
			product.className = 'product-cell';
			const image = document.createElement('img');
			image.src = item.image;
			image.alt = '';
			image.loading = 'lazy';
			const text = document.createElement('div');
			const name = document.createElement('strong');
			name.textContent = item.name;
			const id = document.createElement('span');
			id.textContent = item.id;
			text.append(name, id);
			product.append(image, text);
			row.append(createCell(product));
			const typeTag = document.createElement('span');
			typeTag.className = `type-tag ${item.type}`;
			typeTag.textContent = item.type === 'game' ? "O'yin" : 'Ilova';
			row.append(createCell(typeTag), createCell(item.category), createCell(`${item.rating} ★`), createCell(item.price));
			const actions = document.createElement('div');
			actions.className = 'row-actions';
			const edit = document.createElement('button');
			edit.type = 'button';
			edit.textContent = 'Tahrirlash';
			edit.addEventListener('click', () => openEditor(item));
			const remove = document.createElement('button');
			remove.type = 'button';
			remove.className = 'delete-button';
			remove.textContent = "O'chirish";
			remove.addEventListener('click', () => deleteProduct(item));
			actions.append(edit, remove);
			row.append(createCell(actions));
			rows.append(row);
		});
		document.getElementById('visibleCount').textContent = `${filtered.length} / ${catalog.length} ta mahsulot`;
		document.getElementById('emptyState').hidden = filtered.length > 0;
		updateStats();
	}

	function slugify(value) {
		return value.toLocaleLowerCase('uz')
			.replace(/[ʻʼ‘’']/g, '')
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	function openEditor(item = null) {
		editingId = item?.id || null;
		form.reset();
		formError.textContent = '';
		status.textContent = '';
		document.getElementById('formTitle').textContent = item ? 'Mahsulotni tahrirlash' : "Mahsulot qo'shish";
		if (item) {
			for (const key of ['name', 'type', 'category', 'genre', 'rating', 'price', 'image', 'downloadUrl', 'description']) {
				form.elements.namedItem(key).value = item[key] ?? '';
			}
			form.elements.namedItem('keywords').value = (item.keywords || []).join(', ');
		}
		dialog.showModal();
		form.elements.namedItem('name').focus();
	}

	function validWebAddress(value) {
		try {
			return ['http:', 'https:'].includes(new URL(value).protocol);
		} catch {
			return false;
		}
	}

	function saveProduct(event) {
		event.preventDefault();
		formError.textContent = '';
		if (!form.reportValidity()) return;
		const data = new FormData(form);
		const name = String(data.get('name')).trim();
		const type = String(data.get('type'));
		const image = String(data.get('image')).trim();
		const downloadUrl = String(data.get('downloadUrl')).trim();
		const rating = Number(data.get('rating'));
		if (!validWebAddress(image) || !validWebAddress(downloadUrl)) {
			formError.textContent = 'Rasm va rasmiy sahifa uchun http yoki https manzil kiriting.';
			return;
		}
		if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
			formError.textContent = "Baho 0 dan 5 gacha bo'lishi kerak.";
			return;
		}
		const id = editingId || slugify(name);
		if (!id) {
			formError.textContent = "Mahsulot nomidan ID yaratib bo'lmadi.";
			return;
		}
		if (!editingId && catalog.some((item) => item.id === id)) {
			formError.textContent = "Bu nomdagi mahsulot mavjud. Boshqa nom tanlang.";
			return;
		}
		const product = {
			id,
			name,
			type,
			category: String(data.get('category')).trim(),
			genre: type === 'app' ? 'app' : String(data.get('genre')),
			keywords: String(data.get('keywords')).split(',').map((word) => word.trim()).filter(Boolean),
			rating: rating.toFixed(1),
			price: String(data.get('price')),
			image,
			downloadUrl,
			description: String(data.get('description')).trim()
		};
		const index = catalog.findIndex((item) => item.id === id);
		if (index < 0) catalog.push(product);
		else catalog[index] = product;
		if (!persistCatalog()) return;
		renderCatalog();
		dialog.close();
		status.textContent = `“${name}” mahsulot ${index < 0 ? "qo'shildi" : "yangilandi"}.`;
	}

	function deleteProduct(item) {
		if (!window.confirm(`“${item.name}” mahsulotni katalogdan o'chirishmi?`)) return;
		const index = catalog.findIndex((product) => product.id === item.id);
		if (index < 0) return;
		catalog.splice(index, 1);
		if (!persistCatalog()) return;
		renderCatalog();
		status.textContent = `“${item.name}” katalogdan o'chirildi.`;
	}

	document.getElementById('addProduct').addEventListener('click', () => openEditor());
	document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
	document.getElementById('cancelDialog').addEventListener('click', () => dialog.close());
	document.getElementById('resetCatalog').addEventListener('click', () => {
		if (!window.confirm("Barcha katalog o'zgarishlarini bekor qilib, boshlang'ich mahsulotlarga qaytishmi?")) return;
		try {
			localStorage.removeItem('erty-catalog');
			location.reload();
		} catch {
			status.textContent = 'Boshlang‘ich katalogni tiklab bo‘lmadi.';
		}
	});
	search.addEventListener('input', renderCatalog);
	typeFilter.addEventListener('change', renderCatalog);
	form.addEventListener('submit', saveProduct);
	document.getElementById('lockAdmin').addEventListener('click', () => {
		setUnlocked(false);
		initializeGate();
	});
	renderCatalog();
	initializeGate();
})();
