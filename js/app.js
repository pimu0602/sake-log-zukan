(function () {
  'use strict';

  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const dialogRoot = document.getElementById('dialog-root');
  const { genres } = window.SAKE_CONFIG;
  const Render = window.SakeRender;
  const Storage = window.SakeStorage;
  let toastTimer = null;
  let searchTimer = null;

  function parseRoute() {
    const raw = location.hash.replace(/^#/, '') || 'home';
    const [name, query = ''] = raw.split('?');
    return { name, params: Object.fromEntries(new URLSearchParams(query)) };
  }

  function navigate(name, params = {}) {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '' && value != null)).toString();
    const target = `#${name}${query ? `?${query}` : ''}`;
    if (location.hash === target) renderApp();
    else location.hash = target;
  }

  function setRouteParams(patch) {
    const route = parseRoute();
    navigate(route.name, { ...route.params, ...patch });
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function renderApp() {
    const route = parseRoute();
    const records = Storage.load();
    let html = '';
    switch (route.name) {
      case 'genres': html = Render.genres(records); break;
      case 'collection': html = Render.collection(records, route.params); break;
      case 'form': html = Render.form(route.params.id ? Storage.find(route.params.id) : null, route.params.genre || ''); break;
      case 'detail': html = Render.detail(Storage.find(route.params.id)); break;
      case 'search': html = Render.search(records, route.params); break;
      case 'stats': html = Render.stats(records); break;
      default: html = Render.home(records); break;
    }
    app.innerHTML = html;
    app.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
    updateNav(route.name);
  }

  function updateNav(routeName) {
    document.querySelectorAll('.bottom-nav [data-route]').forEach((button) => {
      const key = button.dataset.route;
      const active = key === routeName || (key === 'genres' && routeName === 'collection');
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  }

  function splitTags(value) {
    return [...new Set(String(value || '').split(/[、,，]/).map((tag) => tag.trim().replace(/^#/, '')).filter(Boolean))];
  }

  function recordFromForm(form) {
    const data = new FormData(form);
    const genre = data.get('genre');
    const ratings = {};
    (genres[genre] || genres.other).ratings.forEach((label) => {
      const value = data.get(`rating_${label}`);
      if (value) ratings[label] = Number(value);
    });
    return {
      name: String(data.get('name') || '').trim(),
      maker: String(data.get('maker') || '').trim(),
      genre,
      subgenre: String(data.get('subgenre') || '').trim(),
      price: data.get('price') ? Number(data.get('price')) : '',
      volume: String(data.get('volume') || '').trim(),
      alcohol: data.get('alcohol') ? Number(data.get('alcohol')) : '',
      purchasePlace: String(data.get('purchasePlace') || '').trim(),
      date: data.get('date') || '',
      drinkStyle: data.get('drinkStyle') || '',
      snack: String(data.get('snack') || '').trim(),
      repurchase: data.get('repurchase') || '迷う',
      desire: Number(data.get('desire')) || 3,
      memo: String(data.get('memo') || '').trim(),
      tags: splitTags(data.get('tags')),
      ratings
    };
  }

  function copyText(record) {
    const genre = Render.genreOf(record.genre);
    const lines = [
      `【${record.name}】`,
      `ジャンル：${genre.label}${record.subgenre ? ` / ${record.subgenre}` : ''}`,
      record.maker ? `メーカー：${record.maker}` : '',
      record.alcohol !== '' ? `度数：${record.alcohol}%` : '',
      record.price !== '' ? `価格：${Number(record.price).toLocaleString()}円` : '',
      record.volume ? `容量：${record.volume}` : '',
      record.purchasePlace ? `購入場所：${record.purchasePlace}` : '',
      record.date ? `飲んだ日：${record.date.replaceAll('-', '/')}` : '',
      record.drinkStyle ? `飲み方：${record.drinkStyle}` : '',
      record.snack ? `合うつまみ：${record.snack}` : '',
      '', '評価：',
      ...Object.entries(record.ratings || {}).map(([label, value]) => `${label}：${value}`),
      '', `また飲みたい度：${record.desire || '-'}`,
      `また買う：${record.repurchase || '迷う'}`,
      record.tags && record.tags.length ? `タグ：${record.tags.join('、')}` : '',
      record.memo ? `\nメモ：\n${record.memo}` : ''
    ];
    return lines.filter((line, index) => line !== '' || lines[index - 1] !== '').join('\n').trim();
  }

  async function copyRecord(id) {
    const record = Storage.find(id);
    if (!record) return;
    const text = copyText(record);
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    showToast('コピーしました');
  }

  function openDeleteDialog(id) {
    const record = Storage.find(id);
    if (!record) return;
    dialogRoot.innerHTML = `<div class="dialog-backdrop" data-action="close-dialog"><div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
      <div class="dialog-icon">⌫</div><h2 id="dialog-title">この記録を削除しますか？</h2><p>「${Render.esc(record.name)}」を図鑑から削除します。この操作は元に戻せません。</p>
      <div><button class="button secondary" type="button" data-action="close-dialog">キャンセル</button><button class="button delete-button" type="button" data-action="confirm-delete" data-id="${Render.esc(id)}">削除する</button></div>
    </div></div>`;
    dialogRoot.querySelector('.dialog').addEventListener('click', (event) => event.stopPropagation());
    dialogRoot.querySelector('[data-action="confirm-delete"]').focus();
  }

  function updateFormGenre(select) {
    const genre = genres[select.value] || genres.other;
    const sub = document.getElementById('subgenre');
    const ratings = document.getElementById('genre-ratings');
    sub.innerHTML = genre.subs.map((value) => `<option>${Render.esc(value)}</option>`).join('');
    ratings.innerHTML = genre.ratings.map((label) => Render.ratingInput(label)).join('');
    const title = ratings.closest('.form-card').querySelector('h2');
    if (title) title.textContent = `${genre.label}の味わい`;
  }

  document.addEventListener('click', (event) => {
    const routeButton = event.target.closest('[data-route]');
    if (routeButton) {
      event.preventDefault();
      const params = routeButton.dataset.genre ? { genre: routeButton.dataset.genre } : {};
      navigate(routeButton.dataset.route, params);
      return;
    }

    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'open-genre') navigate('collection', { genre: target.dataset.genre });
    if (action === 'detail') navigate('detail', { id: target.dataset.id });
    if (action === 'edit') navigate('form', { id: target.dataset.id });
    if (action === 'copy') copyRecord(target.dataset.id);
    if (action === 'delete') openDeleteDialog(target.dataset.id);
    if (action === 'back') history.length > 1 ? history.back() : navigate('home');
    if (action === 'repurchase-list') navigate('collection', { repurchase: '1' });
    if (action === 'clear-repurchase') setRouteParams({ repurchase: '' });
    if (action === 'collection-sub') setRouteParams({ subgenre: target.dataset.sub });
    if (action === 'tag-search') navigate('search', { tag: target.dataset.tag });
    if (action === 'clear-search') navigate('search');
    if (action === 'close-dialog') dialogRoot.innerHTML = '';
    if (action === 'confirm-delete') {
      Storage.remove(target.dataset.id);
      dialogRoot.innerHTML = '';
      showToast('記録を削除しました');
      navigate('genres');
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (target.id === 'genre') updateFormGenre(target);
    if (target.id === 'collection-genre') navigate('collection', { genre: target.value });
    if (target.id === 'search-genre') navigate('search', { ...parseRoute().params, genre: target.value, subgenre: '' });
    if (target.id === 'search-sub') setRouteParams({ subgenre: target.value });
    if (target.id === 'search-tag') setRouteParams({ tag: target.value });
  });

  document.addEventListener('input', (event) => {
    if (event.target.id !== 'search-query') return;
    clearTimeout(searchTimer);
    const value = event.target.value;
    searchTimer = setTimeout(() => {
      const params = { ...parseRoute().params, query: value };
      const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
      history.replaceState(null, '', `#search${query ? `?${query}` : ''}`);
      const cursor = value.length;
      renderApp();
      const input = document.getElementById('search-query');
      if (input) { input.focus(); input.setSelectionRange(cursor, cursor); }
    }, 220);
  });

  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'record-form') return;
    event.preventDefault();
    const form = event.target;
    if (!form.reportValidity()) return;
    const data = recordFromForm(form);
    if (!data.name) {
      document.getElementById('name').focus();
      showToast('商品名を入力してください');
      return;
    }
    const record = form.dataset.id ? Storage.update(form.dataset.id, data) : Storage.create(data);
    showToast(form.dataset.id ? '変更を保存しました' : '図鑑に登録しました');
    navigate('detail', { id: record.id });
  });

  window.addEventListener('hashchange', renderApp);
  window.addEventListener('storage', renderApp);
  renderApp();
})();
