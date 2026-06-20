(function () {
  'use strict';

  const key = window.SAKE_CONFIG.storageKey;

  function load() {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn('保存データを読み込めませんでした。', error);
      return [];
    }
  }

  function persist(records) {
    localStorage.setItem(key, JSON.stringify(records));
    return records;
  }

  function create(data) {
    const records = load();
    const now = new Date().toISOString();
    const record = {
      ...data,
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: now,
      updatedAt: now
    };
    records.unshift(record);
    persist(records);
    return record;
  }

  function update(id, data) {
    const records = load();
    const index = records.findIndex((item) => item.id === id);
    if (index < 0) return null;
    records[index] = { ...records[index], ...data, id, updatedAt: new Date().toISOString() };
    persist(records);
    return records[index];
  }

  function remove(id) {
    const records = load();
    const next = records.filter((item) => item.id !== id);
    persist(next);
    return next.length !== records.length;
  }

  function find(id) {
    return load().find((item) => item.id === id) || null;
  }

  window.SakeStorage = { load, create, update, remove, find };
})();
