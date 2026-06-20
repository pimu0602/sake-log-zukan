(function () {
  'use strict';

  const genres = {
    beer: {
      label: 'ビール', icon: '🍺', color: '#e7a83c',
      subs: ['IPA', 'Hazy IPA', 'Pale Ale', 'Lager', 'Pilsner', 'Stout', 'White Beer', 'Fruit Beer', 'Other'],
      ratings: ['苦味', '香り', 'コク', 'キレ', '飲みやすさ', 'ホップ感', 'コスパ']
    },
    whisky: {
      label: 'ウイスキー', icon: '🥃', color: '#c5783a',
      subs: ['シングルモルト', 'ブレンデッド', 'バーボン', 'ライ', 'ジャパニーズ', 'アイリッシュ', 'スコッチ', 'その他'],
      ratings: ['香り', '甘み', 'スモーキーさ', '樽感', 'アルコール感', '余韻', 'ハイボール適性', 'コスパ']
    },
    shochu: {
      label: '焼酎', icon: '🍶', color: '#d6b879',
      subs: ['芋', '麦', '米', '黒糖', 'そば', '栗', 'その他'],
      ratings: ['香り', '甘み', 'キレ', 'クセ', '飲みやすさ', 'お湯割り適性', 'ソーダ割り適性', 'コスパ']
    },
    awamori: {
      label: '泡盛', icon: '🏺', color: '#b78b64',
      subs: ['一般酒', '古酒', '新酒', 'その他'],
      ratings: ['香り', 'まろやかさ', 'クセ', '度数の強さ', '余韻', 'ロック適性', '水割り適性', 'コスパ']
    },
    sake: {
      label: '日本酒', icon: '🌾', color: '#c5c7b2',
      subs: ['純米', '純米吟醸', '純米大吟醸', '吟醸', '大吟醸', '本醸造', 'にごり', 'その他'],
      ratings: ['香り', '甘み', '酸味', 'キレ', '米感', '飲みやすさ', '食中酒適性', 'コスパ']
    },
    wine: {
      label: 'ワイン', icon: '🍷', color: '#a94e5e',
      subs: ['赤', '白', 'ロゼ', 'スパークリング', 'オレンジ', 'その他'],
      ratings: ['香り', '渋み', '酸味', '甘み', '重さ', '飲みやすさ', '料理との相性', 'コスパ']
    },
    chuhai: {
      label: '缶チューハイ', icon: '🥫', color: '#79aeb2',
      subs: ['レモン', 'グレープフルーツ', '梅', '無糖', 'ハイボール系', 'その他'],
      ratings: ['甘さ', '炭酸感', '果汁感', 'アルコール感', '飲みやすさ', 'コスパ']
    },
    other: {
      label: 'その他', icon: '🍸', color: '#8c729c',
      subs: ['リキュール', 'ジン', 'ウォッカ', 'ラム', 'テキーラ', 'その他'],
      ratings: ['香り', '甘み', '飲みやすさ', '余韻', '個性', 'コスパ']
    }
  };

  window.SAKE_CONFIG = {
    genres,
    genreEntries: Object.entries(genres),
    drinkStyles: ['缶', '瓶', 'グラス', 'ストレート', 'ロック', '水割り', 'お湯割り', 'ソーダ割り', '冷酒', '常温', '燗', 'その他'],
    repurchaseOptions: ['はい', '迷う', 'いいえ'],
    storageKey: 'sake-log-zukan.records.v1'
  };
})();
