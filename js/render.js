(function () {
  'use strict';

  const config = window.SAKE_CONFIG;

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const genreOf = (key) => config.genres[key] || config.genres.other;
  const stars = (value) => `<span class="stars" aria-label="5点中${Number(value) || 0}点">${'★'.repeat(Number(value) || 0)}${'☆'.repeat(5 - (Number(value) || 0))}</span>`;
  const formatDate = (value) => value ? new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(`${value}T00:00:00`)) : '日付なし';

  function pageHead(eyebrow, title, description = '', back = '') {
    return `<div class="page-head">
      ${back ? `<button class="back-button" type="button" data-action="back" aria-label="前の画面へ">‹</button>` : ''}
      <div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1>${description ? `<p class="page-description">${esc(description)}</p>` : ''}</div>
    </div>`;
  }

  function genreCard(key, item, count = 0) {
    return `<button class="genre-card" type="button" data-action="open-genre" data-genre="${key}" style="--genre-color:${item.color}">
      <span class="genre-icon">${item.icon}</span>
      <span class="genre-copy"><strong>${esc(item.label)}</strong><small>${count} 本を収録</small></span>
      <span class="card-arrow">→</span>
    </button>`;
  }

  function drinkCard(record) {
    const genre = genreOf(record.genre);
    const tags = (record.tags || []).slice(0, 3);
    return `<article class="drink-card" data-id="${esc(record.id)}" style="--genre-color:${genre.color}">
      <button class="drink-card-main" type="button" data-action="detail" data-id="${esc(record.id)}">
        <span class="bottle-mark">${genre.icon}</span>
        <span class="drink-copy">
          <span class="card-kicker">${esc(genre.label)} / ${esc(record.subgenre || 'その他')}</span>
          <strong>${esc(record.name || '名称未設定')}</strong>
          <small>${esc(record.maker || 'メーカー未設定')} ・ ${formatDate(record.date)}</small>
        </span>
        <span class="desire-score"><small>また飲む</small><b>${Number(record.desire) || '-'}</b></span>
      </button>
      <div class="drink-card-foot">
        <div class="tag-row">${tags.length ? tags.map((tag) => `<button type="button" class="tag" data-action="tag-search" data-tag="${esc(tag)}">#${esc(tag)}</button>`).join('') : '<span class="muted">タグなし</span>'}</div>
        ${record.repurchase === 'はい' ? '<span class="buy-again">↻ また買う</span>' : ''}
      </div>
    </article>`;
  }

  function emptyState(title, message, canAdd = true) {
    return `<div class="empty-state"><div class="empty-bottle">♧</div><h2>${esc(title)}</h2><p>${esc(message)}</p>
      ${canAdd ? '<button class="button primary" type="button" data-route="form">最初の一本を登録</button>' : ''}</div>`;
  }

  function home(records) {
    const recent = records.slice().sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt))).slice(0, 3);
    const repurchase = records.filter((record) => record.repurchase === 'はい').length;
    return `<section class="view home-view">
      <div class="hero">
        <div class="hero-glow" aria-hidden="true"></div>
        <p class="hero-date">${new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())}</p>
        <h1>今日は何を<br><em>飲んだ？</em></h1>
        <p>今夜の一杯を、あなただけの図鑑へ。</p>
        <button class="button hero-button" type="button" data-route="form"><span>＋</span> 一杯を記録する</button>
        <div class="hero-stats"><div><b>${records.length}</b><span>図鑑の本数</span></div><i></i><div><b>${repurchase}</b><span>また買う</span></div></div>
      </div>

      <section class="content-section">
        <div class="section-title"><div><p class="eyebrow">SELECT A SHELF</p><h2>お酒の棚を選ぶ</h2></div><button type="button" data-route="genres">すべて見る →</button></div>
        <div class="genre-grid home-genres">${config.genreEntries.slice(0, 6).map(([key, item]) => genreCard(key, item, records.filter((r) => r.genre === key).length)).join('')}</div>
      </section>

      <section class="content-section recent-section">
        <div class="section-title"><div><p class="eyebrow">RECENT LOGS</p><h2>最近飲んだお酒</h2></div>${records.length ? '<button type="button" data-route="genres">図鑑へ →</button>' : ''}</div>
        <div class="card-list">${recent.length ? recent.map(drinkCard).join('') : emptyState('酒棚はまだ空です', '飲んだ一本を記録すると、ここから図鑑が育ちます。')}</div>
      </section>
    </section>`;
  }

  function genres(records) {
    return `<section class="view">
      ${pageHead('MY SAKE SHELVES', '図鑑をひらく', 'ジャンルごとの酒棚から、記録を眺められます。')}
      <div class="genre-grid all-genres">${config.genreEntries.map(([key, item]) => genreCard(key, item, records.filter((r) => r.genre === key).length)).join('')}</div>
      <button class="wide-filter" type="button" data-action="repurchase-list"><span>↻</span><span><strong>また買いたい酒リスト</strong><small>${records.filter((r) => r.repurchase === 'はい').length} 本をチェック済み</small></span><b>→</b></button>
    </section>`;
  }

  function collection(records, filters = {}) {
    const selected = filters.genre || '';
    const genre = selected ? genreOf(selected) : null;
    const subs = genre ? genre.subs : [];
    const filtered = records.filter((record) => {
      return (!selected || record.genre === selected) && (!filters.subgenre || record.subgenre === filters.subgenre) && (!filters.repurchase || record.repurchase === 'はい');
    });
    const title = filters.repurchase ? 'また買いたい酒' : genre ? `${genre.label}図鑑` : 'すべての図鑑';
    return `<section class="view">
      ${pageHead(genre ? `${genre.icon} ${genre.label.toUpperCase()} SHELF` : 'MY COLLECTION', title, `${filtered.length} 本のお酒を収録`, 'genres')}
      <div class="collection-toolbar">
        <label class="select-wrap"><span>ジャンル</span><select id="collection-genre" data-action="collection-genre">
          <option value="">すべて</option>${config.genreEntries.map(([key, item]) => `<option value="${key}" ${selected === key ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}
        </select></label>
        <button class="button compact" type="button" data-route="form" ${selected ? `data-genre="${selected}"` : ''}>＋ 登録</button>
      </div>
      ${subs.length ? `<div class="chip-scroller" aria-label="サブジャンル絞り込み"><button class="filter-chip ${!filters.subgenre ? 'active' : ''}" type="button" data-action="collection-sub" data-sub="">すべて</button>${subs.map((sub) => `<button class="filter-chip ${filters.subgenre === sub ? 'active' : ''}" type="button" data-action="collection-sub" data-sub="${esc(sub)}">${esc(sub)}</button>`).join('')}</div>` : ''}
      ${filters.repurchase ? '<div class="active-filter"><span>↻ また買う「はい」のみ</span><button type="button" data-action="clear-repurchase">解除</button></div>' : ''}
      <div class="card-list collection-list">${filtered.length ? filtered.map(drinkCard).join('') : emptyState('まだ登録がありません', 'この棚に、とっておきの一本を加えましょう。')}</div>
    </section>`;
  }

  function ratingInput(label, value = 0) {
    return `<fieldset class="rating-field"><legend>${esc(label)}</legend><div class="rating-buttons">
      ${[1,2,3,4,5].map((num) => `<label><input type="radio" name="rating_${esc(label)}" value="${num}" ${Number(value) === num ? 'checked' : ''}><span>${num}</span></label>`).join('')}
    </div></fieldset>`;
  }

  function form(record = null, presetGenre = '') {
    const data = record || {};
    const selectedGenre = data.genre || presetGenre || 'beer';
    const genre = genreOf(selectedGenre);
    const today = new Date().toISOString().slice(0, 10);
    return `<section class="view form-view">
      ${pageHead(record ? 'EDIT YOUR LOG' : 'ADD A NEW LOG', record ? '記録を編集' : '今夜の一杯を記録', 'わかるところだけで大丈夫。あとから編集できます。', 'home')}
      <form id="record-form" data-id="${esc(data.id || '')}" novalidate>
        <section class="form-card"><div class="form-section-head"><span>01</span><div><h2>基本情報</h2><p>お酒の名前と種類</p></div></div>
          <div class="field full"><label for="name">商品名 <em>必須</em></label><input id="name" name="name" required maxlength="80" value="${esc(data.name || '')}" placeholder="例：インドの青鬼"></div>
          <div class="field full"><label for="maker">メーカー / 蔵 / 蒸留所</label><input id="maker" name="maker" maxlength="80" value="${esc(data.maker || '')}" placeholder="例：ヤッホーブルーイング"></div>
          <div class="form-grid">
            <div class="field"><label for="genre">ジャンル <em>必須</em></label><select id="genre" name="genre" required>${config.genreEntries.map(([key, item]) => `<option value="${key}" ${selectedGenre === key ? 'selected' : ''}>${item.icon} ${esc(item.label)}</option>`).join('')}</select></div>
            <div class="field"><label for="subgenre">サブジャンル</label><select id="subgenre" name="subgenre">${genre.subs.map((sub) => `<option value="${esc(sub)}" ${data.subgenre === sub ? 'selected' : ''}>${esc(sub)}</option>`).join('')}</select></div>
          </div>
        </section>

        <section class="form-card"><div class="form-section-head"><span>02</span><div><h2>飲んだ記録</h2><p>いつ、どんなふうに</p></div></div>
          <div class="form-grid">
            <div class="field"><label for="date">飲んだ日</label><input id="date" name="date" type="date" value="${esc(data.date || today)}"></div>
            <div class="field"><label for="drinkStyle">飲み方</label><select id="drinkStyle" name="drinkStyle"><option value="">選択してください</option>${config.drinkStyles.map((style) => `<option ${data.drinkStyle === style ? 'selected' : ''}>${esc(style)}</option>`).join('')}</select></div>
            <div class="field"><label for="price">価格（円）</label><input id="price" name="price" type="number" inputmode="numeric" min="0" value="${esc(data.price || '')}" placeholder="320"></div>
            <div class="field"><label for="volume">容量</label><input id="volume" name="volume" maxlength="20" value="${esc(data.volume || '')}" placeholder="350ml"></div>
            <div class="field"><label for="alcohol">アルコール度数（%）</label><input id="alcohol" name="alcohol" type="number" inputmode="decimal" min="0" max="100" step="0.1" value="${esc(data.alcohol || '')}" placeholder="7"></div>
            <div class="field"><label for="purchasePlace">購入場所</label><input id="purchasePlace" name="purchasePlace" maxlength="80" value="${esc(data.purchasePlace || '')}" placeholder="近所のスーパー"></div>
          </div>
          <div class="field full"><label for="snack">合うつまみ</label><input id="snack" name="snack" maxlength="100" value="${esc(data.snack || '')}" placeholder="例：唐揚げ、燻製チーズ"></div>
        </section>

        <section class="form-card"><div class="form-section-head"><span>03</span><div><h2>${esc(genre.label)}の味わい</h2><p>1（控えめ）〜 5（強い・良い）</p></div></div>
          <div id="genre-ratings" class="ratings-form">${genre.ratings.map((label) => ratingInput(label, (data.ratings || {})[label])).join('')}</div>
        </section>

        <section class="form-card"><div class="form-section-head"><span>04</span><div><h2>お気に入り度</h2><p>また手に取りたい一本？</p></div></div>
          <fieldset class="choice-field"><legend>また買うか</legend><div class="segment-options">${config.repurchaseOptions.map((option) => `<label><input type="radio" name="repurchase" value="${option}" ${(data.repurchase || '迷う') === option ? 'checked' : ''}><span>${option}</span></label>`).join('')}</div></fieldset>
          <fieldset class="rating-field desire-field"><legend>また飲みたい度</legend><div class="big-star-rating">${[1,2,3,4,5].map((num) => `<label><input type="radio" name="desire" value="${num}" ${Number(data.desire || 3) === num ? 'checked' : ''}><span>★<small>${num}</small></span></label>`).join('')}</div></fieldset>
          <div class="field full"><label for="tags">タグ <small>「、」またはカンマ区切り</small></label><input id="tags" name="tags" value="${esc((data.tags || []).join('、'))}" placeholder="苦い、香り強い、常備したい"></div>
          <div class="field full"><label for="memo">メモ</label><textarea id="memo" name="memo" rows="5" maxlength="1000" placeholder="味や香り、飲んだときのことを自由に…">${esc(data.memo || '')}</textarea></div>
        </section>

        <div class="form-actions"><button class="button secondary" type="button" data-action="back">キャンセル</button><button class="button primary save-button" type="submit">${record ? '変更を保存' : '図鑑に登録する'}</button></div>
      </form>
    </section>`;
  }

  function detail(record) {
    if (!record) return `<section class="view">${emptyState('記録が見つかりません', '削除されたか、URLが正しくないようです。', false)}</section>`;
    const genre = genreOf(record.genre);
    const info = [
      ['メーカー / 蔵', record.maker], ['飲んだ日', formatDate(record.date)], ['価格', record.price ? `${Number(record.price).toLocaleString()}円` : ''],
      ['容量', record.volume], ['度数', record.alcohol ? `${record.alcohol}%` : ''], ['購入場所', record.purchasePlace],
      ['飲み方', record.drinkStyle], ['合うつまみ', record.snack]
    ].filter(([, value]) => value);
    return `<section class="view detail-view">
      <div class="detail-hero" style="--genre-color:${genre.color}">
        <button class="back-button light" type="button" data-action="back" aria-label="前の画面へ">‹</button>
        <div class="detail-symbol">${genre.icon}</div><p>${esc(genre.label)} / ${esc(record.subgenre || 'その他')}</p><h1>${esc(record.name)}</h1><span>${esc(record.maker || 'メーカー未設定')}</span>
      </div>
      <div class="detail-actions"><button class="button copy-button" type="button" data-action="copy" data-id="${esc(record.id)}">▣ メモをコピー</button><button class="icon-button" type="button" data-action="edit" data-id="${esc(record.id)}" aria-label="編集">✎</button><button class="icon-button danger" type="button" data-action="delete" data-id="${esc(record.id)}" aria-label="削除">⌫</button></div>
      <section class="detail-card"><div class="detail-section-title"><span>INFO</span><h2>基本情報</h2></div><dl class="info-grid">${info.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></section>
      <section class="detail-card"><div class="detail-section-title"><span>TASTING NOTES</span><h2>味わい評価</h2></div><div class="rating-results">${Object.entries(record.ratings || {}).map(([label, value]) => `<div><span>${esc(label)}</span>${stars(value)}<b>${Number(value) || '-'}</b></div>`).join('') || '<p class="muted">評価はまだありません。</p>'}</div></section>
      <section class="detail-card favorite-card"><div><small>また飲みたい度</small>${stars(record.desire)}<strong>${Number(record.desire) || '-'}</strong></div><div><small>また買う</small><strong class="repurchase-value">${esc(record.repurchase || '迷う')}</strong></div></section>
      ${record.tags && record.tags.length ? `<section class="detail-card"><div class="detail-section-title"><span>TAGS</span><h2>タグ</h2></div><div class="tag-row large">${record.tags.map((tag) => `<button type="button" class="tag" data-action="tag-search" data-tag="${esc(tag)}">#${esc(tag)}</button>`).join('')}</div></section>` : ''}
      ${record.memo ? `<section class="detail-card"><div class="detail-section-title"><span>MEMO</span><h2>飲んだメモ</h2></div><p class="memo-text">${esc(record.memo).replaceAll('\n', '<br>')}</p></section>` : ''}
    </section>`;
  }

  function search(records, filters = {}) {
    const query = (filters.query || '').toLowerCase().trim();
    const genre = filters.genre || '';
    const tag = filters.tag || '';
    const subs = genre ? genreOf(genre).subs : [];
    const results = records.filter((record) => {
      const haystack = [record.name, record.maker, record.purchasePlace, record.snack, record.memo, ...(record.tags || [])].join(' ').toLowerCase();
      return (!query || haystack.includes(query)) && (!genre || record.genre === genre) && (!filters.subgenre || record.subgenre === filters.subgenre) && (!tag || (record.tags || []).includes(tag));
    });
    const allTags = [...new Set(records.flatMap((record) => record.tags || []))].sort();
    return `<section class="view search-view">
      ${pageHead('SEARCH YOUR LOGS', '図鑑を検索', '名前、メーカー、メモ、タグから探せます。')}
      <div class="search-panel">
        <label class="search-box"><span>⌕</span><input id="search-query" type="search" value="${esc(filters.query || '')}" placeholder="お酒の名前やメモを検索" autocomplete="off"><button type="button" data-action="clear-search" aria-label="検索をクリア">×</button></label>
        <div class="search-filters">
          <label><span>ジャンル</span><select id="search-genre"><option value="">すべて</option>${config.genreEntries.map(([key, item]) => `<option value="${key}" ${genre === key ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select></label>
          <label><span>サブジャンル</span><select id="search-sub"><option value="">すべて</option>${subs.map((sub) => `<option ${filters.subgenre === sub ? 'selected' : ''}>${esc(sub)}</option>`).join('')}</select></label>
          <label><span>タグ</span><select id="search-tag"><option value="">すべて</option>${allTags.map((item) => `<option ${tag === item ? 'selected' : ''}>${esc(item)}</option>`).join('')}</select></label>
        </div>
      </div>
      <div class="result-heading"><h2>検索結果</h2><span>${results.length} 本</span></div>
      <div class="card-list">${results.length ? results.map(drinkCard).join('') : emptyState('見つかりませんでした', '条件を少し変えて、もう一度探してみてください。', false)}</div>
    </section>`;
  }

  function topCounts(values, limit = 5) {
    const counts = values.filter(Boolean).reduce((acc, value) => {
      value.split(/[、,，/]/).map((v) => v.trim()).filter(Boolean).forEach((v) => { acc[v] = (acc[v] || 0) + 1; });
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);
  }

  function ranking(records, getScore, emptyLabel) {
    const rows = records.map((record) => ({ record, score: Number(getScore(record)) || 0 })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
    return rows.length ? rows.map((item, index) => `<button type="button" class="rank-row" data-action="detail" data-id="${esc(item.record.id)}"><span class="rank-num">${index + 1}</span><span class="rank-icon">${genreOf(item.record.genre).icon}</span><span><strong>${esc(item.record.name)}</strong><small>${esc(genreOf(item.record.genre).label)}</small></span><b>${item.score}<small>/5</small></b></button>`).join('') : `<p class="muted centered">${esc(emptyLabel)}</p>`;
  }

  function stats(records) {
    const genreCounts = config.genreEntries.map(([key, item]) => ({ key, ...item, count: records.filter((record) => record.genre === key).length }));
    const maxCount = Math.max(...genreCounts.map((item) => item.count), 1);
    const repurchase = records.filter((record) => record.repurchase === 'はい').length;
    const stocked = records.filter((record) => (record.tags || []).includes('常備したい')).length;
    const tags = topCounts(records.flatMap((record) => record.tags || []));
    const snacks = topCounts(records.map((record) => record.snack));
    return `<section class="view stats-view">
      ${pageHead('MY DRINKING STATS', '酒棚の統計', 'これまでの一杯を、数字で振り返ります。')}
      <div class="summary-grid"><div class="summary-card featured"><small>総登録数</small><strong>${records.length}<em>本</em></strong><span>図鑑に収録中</span></div><div class="summary-card"><span>↻</span><small>また買う</small><strong>${repurchase}<em>本</em></strong></div><div class="summary-card"><span>☆</span><small>常備したい</small><strong>${stocked}<em>本</em></strong></div></div>
      <section class="stats-card"><div class="detail-section-title"><span>BY GENRE</span><h2>ジャンル別登録数</h2></div><div class="bar-chart">${genreCounts.map((item) => `<button type="button" data-action="open-genre" data-genre="${item.key}"><span class="bar-label"><i>${item.icon}</i>${esc(item.label)}</span><span class="bar-track"><i style="width:${item.count ? Math.max(8, item.count / maxCount * 100) : 0}%;--bar-color:${item.color}"></i></span><b>${item.count}</b></button>`).join('')}</div></section>
      <div class="stats-columns">
        <section class="stats-card"><div class="detail-section-title"><span>FAVORITES</span><h2>また飲みたい度</h2></div><div class="ranking">${ranking(records, (record) => record.desire, '評価するとランキングが表示されます。')}</div></section>
        <section class="stats-card"><div class="detail-section-title"><span>BEST VALUE</span><h2>コスパランキング</h2></div><div class="ranking">${ranking(records, (record) => (record.ratings || {})['コスパ'], 'コスパを評価すると表示されます。')}</div></section>
      </div>
      <div class="stats-columns">
        <section class="stats-card"><div class="detail-section-title"><span>POPULAR TAGS</span><h2>よく使うタグ</h2></div>${tags.length ? `<div class="cloud-list">${tags.map(([tag, count]) => `<button type="button" data-action="tag-search" data-tag="${esc(tag)}"><span>#${esc(tag)}</span><b>${count}</b></button>`).join('')}</div>` : '<p class="muted centered">タグを追加すると表示されます。</p>'}</section>
        <section class="stats-card"><div class="detail-section-title"><span>BEST PAIRINGS</span><h2>よく合わせるつまみ</h2></div>${snacks.length ? `<ol class="simple-ranking">${snacks.map(([snack, count]) => `<li><span>${esc(snack)}</span><b>${count}回</b></li>`).join('')}</ol>` : '<p class="muted centered">つまみを記録すると表示されます。</p>'}</section>
      </div>
    </section>`;
  }

  window.SakeRender = { esc, genreOf, drinkCard, ratingInput, home, genres, collection, form, detail, search, stats };
})();
