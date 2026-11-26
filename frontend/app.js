/*
 * HistoryMaP - application logic
 *
 * Data flow:
 *   /api/events (via the local proxy) -> normalize -> validate coords
 *   -> render markers + cards -> select event -> render panel
 *
 * The app never fabricates data. If the request fails, the UI shows an
 * honest error state with a Retry button. If Leaflet fails to load (e.g.
 * offline), the card grid still works - only the map itself is unavailable
 * and the UI says so.
 */
'use strict';

const API_BASE = (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http'))
    ? '/api'
    : 'http://localhost:5000/api';

const WORLD_CENTER = [22, 10];
const WORLD_ZOOM = 2;

const PERIODS = ['ancient', 'medieval', 'modern'];

/* ----------------------------------------------------------------
 * Pure helpers (also exported for headless testing)
 * ---------------------------------------------------------------- */

function normalizeEvent(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!name) return null;

    const loc = (raw.location && typeof raw.location === 'object') ? raw.location : {};
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
        && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

    const periods = {};
    const rawPeriods = (raw.periods && typeof raw.periods === 'object') ? raw.periods : {};
    for (const key of PERIODS) {
        const p = rawPeriods[key];
        if (!p || typeof p !== 'object') continue;
        const facts = Array.isArray(p.facts)
            ? p.facts.map((f) => String(f).trim()).filter(Boolean)
            : [];
        const title = typeof p.title === 'string' ? p.title.trim() : '';
        if (title || facts.length) periods[key] = { title, facts };
    }

    return { name, latitude: hasCoords ? lat : null, longitude: hasCoords ? lng : null, hasCoords, periods };
}

/* Accept the backend's array response or an { events: [...] } envelope. */
function parseEventsPayload(json) {
    const list = Array.isArray(json)
        ? json
        : (json && Array.isArray(json.events)) ? json.events : null;
    if (!list) return null;
    const normalized = [];
    for (const raw of list) {
        const ev = normalizeEvent(raw);
        if (ev) normalized.push(ev);
    }
    return normalized;
}

function pickInitialPeriod(periods, preferred) {
    if (!periods) return 'ancient';
    if (preferred && periods[preferred]) return preferred;
    if (periods.ancient) return 'ancient';
    return Object.keys(periods)[0] || 'ancient';
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

/* ----------------------------------------------------------------
 * App state
 * ---------------------------------------------------------------- */
let events = [];
let markers = [];
let selectedIndex = -1;
let currentPeriod = 'ancient';
let map = null;
let searchQuery = '';
let els = {};

/* ----------------------------------------------------------------
 * DOM setup
 * ---------------------------------------------------------------- */

function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined' && typeof window.fetch === 'function';
}

function cacheDom() {
    const byId = (id) => document.getElementById(id);
    els = {
        mapEl: byId('world-map'),
        status: byId('map-status'),
        statusMessage: byId('map-status-message'),
        retryBtn: byId('map-retry'),
        cards: byId('location-cards'),
        searchInput: byId('search-input'),
        panelTitle: byId('panel-title'),
        periodTitle: byId('period-title'),
        factsList: byId('facts-list'),
        tabButtons: Array.from(document.querySelectorAll('.tab-btn')),
    };
}

/* ----------------------------------------------------------------
 * Status overlay (loading / error / hidden)
 * ---------------------------------------------------------------- */

function setStatus(state, message) {
    const el = els.status;
    if (!el) return;
    el.classList.remove('map-status--loading', 'map-status--error', 'is-hidden');
    const msg = els.statusMessage;
    const retry = els.retryBtn;
    if (state === 'loading') {
        el.classList.add('map-status--loading');
        if (msg) msg.textContent = message || 'Loading events…';
        if (retry) retry.hidden = true;
    } else if (state === 'error') {
        el.classList.add('map-status--error');
        if (msg) msg.textContent = message || 'Something went wrong.';
        if (retry) retry.hidden = false;
    } else {
        el.classList.add('is-hidden');
        if (retry) retry.hidden = true;
    }
}

/* ----------------------------------------------------------------
 * Leaflet map
 * ---------------------------------------------------------------- */

function leafletAvailable() {
    return typeof L !== 'undefined' && L && typeof L.map === 'function';
}

function ensureMap() {
    if (map || !leafletAvailable()) return map;
    if (!els.mapEl) return null;
    map = L.map(els.mapEl, {
        center: WORLD_CENTER,
        zoom: WORLD_ZOOM,
        minZoom: 1,
        maxZoom: 10,
        worldCopyJump: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);
    return map;
}

function clearMarkers() {
    if (!map) return;
    for (const m of markers) map.removeLayer(m);
    markers = [];
}

function flyTo(latlng, zoom) {
    if (!map) return;
    try {
        map.setView(latlng, zoom || 5, { animate: true });
    } catch (_) {
        map.setView(latlng, zoom || 5);
    }
}

function addMarkers() {
    if (!map) return;
    clearMarkers();
    const coords = [];
    events.forEach((ev, i) => {
        if (!ev.hasCoords) return;
        const latlng = [ev.latitude, ev.longitude];
        const m = L.circleMarker(latlng, {
            radius: 7,
            color: '#e94560',
            fillColor: '#ff8da0',
            fillOpacity: 0.9,
            weight: 2,
        }).addTo(map);
        m.bindTooltip(escapeHtml(ev.name), { direction: 'top', offset: [0, -6], className: 'map-tooltip' });
        m.on('click', () => selectEvent(i));
        markers.push(m);
        coords.push(latlng);
    });
    if (coords.length) {
        try { map.fitBounds(L.latLngBounds(coords).pad(0.35)); } catch (_) { /* leave current view */ }
    }
}

/* ----------------------------------------------------------------
 * Data loading
 * ---------------------------------------------------------------- */

async function fetchEvents() {
    const res = await fetch(`${API_BASE}/events`, { cache: 'no-store' });
    if (!res.ok) {
        let detail = res.statusText;
        try {
            const body = await res.json();
            if (body && body.error) detail = body.error;
        } catch (_) { /* leave detail */ }
        throw new Error(`Request failed (${res.status})${detail ? `: ${detail}` : ''}`);
    }
    return res.json();
}

async function loadEvents() {
    setStatus('loading');
    clearPanel();
    els.cards.innerHTML = '';
    try {
        const json = await fetchEvents();
        const normalized = parseEventsPayload(json);
        if (!normalized) throw new Error('Unexpected response format from /api/events');
        events = normalized;

        renderCards();

        const mapReady = !!ensureMap();
        if (mapReady) {
            addMarkers();
            // Give the layout a beat before resizing so tiles render correctly.
            requestAnimationFrame(() => { if (map) map.invalidateSize(); });
            setStatus('hidden');
        } else {
            // Map unavailable (e.g. offline, CDN blocked) - cards still work.
            setStatus('error', 'Interactive map unavailable (the Leaflet map needs network access). Use the location cards below - they work offline.');
        }

        const firstVisible = events.findIndex((ev) => matchesSearch(ev));
        if (firstVisible >= 0) selectEvent(firstVisible, { fly: false });
    } catch (err) {
        events = [];
        clearMarkers();
        els.cards.innerHTML = '';
        renderEmptyCards();
        setStatus('error', err.message || 'Failed to load events.');
    }
}

/* ----------------------------------------------------------------
 * Cards
 * ---------------------------------------------------------------- */

function matchesSearch(ev) {
    if (!searchQuery) return true;
    return ev.name.toLowerCase().includes(searchQuery);
}

function renderCards() {
    const visible = events.map((ev, i) => ({ ev, i })).filter(({ ev }) => matchesSearch(ev));
    if (!visible.length) {
        renderEmptyCards();
        return;
    }
    els.cards.innerHTML = '';
    for (const { ev, i } of visible) {
        const hasCoords = ev.hasCoords;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'location-card' + (i === selectedIndex ? ' active' : '');
        card.dataset.index = String(i);
        card.setAttribute('aria-label', `${ev.name}${hasCoords ? '' : ' (no coordinates)'}`);

        const h3 = document.createElement('h3');
        h3.textContent = ev.name;
        card.appendChild(h3);

        const badges = document.createElement('div');
        badges.className = 'period-badges';
        for (const key of PERIODS) {
            if (ev.periods[key]) {
                const badge = document.createElement('span');
                badge.className = 'period-badge';
                badge.textContent = capitalize(key);
                badges.appendChild(badge);
            }
        }
        if (!badges.children.length) {
            const none = document.createElement('span');
            none.className = 'period-badge';
            none.textContent = 'No period data';
            badges.appendChild(none);
        }
        card.appendChild(badges);

        card.addEventListener('click', () => selectEvent(i));
        els.cards.appendChild(card);
    }
    syncActiveCard();
}

function renderEmptyCards() {
    els.cards.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'cards-empty';
    if (!events.length) {
        empty.textContent = 'No historical events are available. Try the Retry button above if the server was just started.';
    } else {
        empty.textContent = `No locations match “${searchQuery}”.`;
    }
    els.cards.appendChild(empty);
    if (!events.length) {
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'cards-empty__retry';
        retry.textContent = 'Retry';
        retry.addEventListener('click', loadEvents);
        els.cards.appendChild(retry);
    }
}

function syncActiveCard() {
    const cards = els.cards.querySelectorAll('.location-card');
    cards.forEach((card) => {
        card.classList.toggle('active', Number(card.dataset.index) === selectedIndex);
    });
}

/* ----------------------------------------------------------------
 * Selection + panel
 * ---------------------------------------------------------------- */

function resetPanel() {
    els.panelTitle.textContent = 'Select a location';
    els.periodTitle.textContent = loadingOrSelectText();
    els.factsList.innerHTML = '';
    for (const btn of els.tabButtons) {
        btn.classList.remove('active');
        btn.setAttribute('aria-current', 'false');
        btn.disabled = true;
    }
}

function loadingOrSelectText() {
    return events.length ? 'Click a marker or a card to view historical details.' : 'Waiting for events…';
}

function clearPanel() {
    resetPanel();
}

function renderPanel() {
    const ev = selectedIndex >= 0 ? events[selectedIndex] : null;
    if (!ev) {
        resetPanel();
        return;
    }
    els.panelTitle.textContent = ev.name;

    const periodKeys = PERIODS.filter((k) => ev.periods[k]);
    // currentPeriod must point at a period that exists for this event.
    if (!ev.periods[currentPeriod]) {
        currentPeriod = periodKeys[0] || currentPeriod;
    }
    for (const btn of els.tabButtons) {
        const key = btn.dataset.period;
        const available = !!ev.periods[key];
        btn.disabled = !available;
        const active = key === currentPeriod && available;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-current', active ? 'true' : 'false');
    }

    const period = ev.periods[currentPeriod];
    if (!period) {
        // No periods recorded for this event at all.
        els.periodTitle.textContent = 'No historical period data recorded for this location.';
        els.factsList.innerHTML = '';
        return;
    }

    els.periodTitle.textContent = period.title || `${capitalize(currentPeriod)} period`;
    els.factsList.innerHTML = '';
    for (const fact of period.facts) {
        const li = document.createElement('li');
        li.textContent = fact;
        els.factsList.appendChild(li);
    }
    if (!period.facts.length) {
        const li = document.createElement('li');
        li.textContent = 'No factual details recorded for this period.';
        els.factsList.appendChild(li);
    }
}

function selectEvent(index, opts = {}) {
    const { fly = true } = opts;
    if (index < 0 || index >= events.length) return;
    selectedIndex = index;
    const ev = events[index];
    currentPeriod = pickInitialPeriod(ev.periods, currentPeriod);

    renderPanel();
    syncActiveCard();

    if (fly && ev.hasCoords) flyTo([ev.latitude, ev.longitude], 5);

    const activeCard = els.cards.querySelector(`.location-card[data-index="${index}"]`);
    if (activeCard && typeof activeCard.scrollIntoView === 'function') {
        activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/* ----------------------------------------------------------------
 * Search
 * ---------------------------------------------------------------- */

function onSearchInput(value) {
    searchQuery = value.trim().toLowerCase();
    renderCards();
    // Keep the panel honest with the visible selection.
    const visible = events.map((ev, i) => ({ ev, i })).filter(({ ev }) => matchesSearch(ev));
    if (visible.length && selectedIndex >= 0 && !matchesSearch(events[selectedIndex])) {
        selectEvent(visible[0].i, { fly: false });
    }
}

/* ----------------------------------------------------------------
 * Init
 * ---------------------------------------------------------------- */

function init() {
    cacheDom();
    if (!els.mapEl || !els.cards || !els.searchInput || !els.panelTitle || !els.periodTitle || !els.factsList || !els.tabButtons.length) {
        console.error('HistoryMaP: required DOM elements are missing.');
        return;
    }

    if (els.retryBtn) els.retryBtn.addEventListener('click', loadEvents);
    els.searchInput.addEventListener('input', (e) => onSearchInput(e.target.value));

    for (const btn of els.tabButtons) {
        btn.addEventListener('click', () => {
            if (btn.disabled) return;
            currentPeriod = btn.dataset.period;
            renderPanel();
        });
    }

    // Keyboard: Escape clears search.
    els.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            els.searchInput.value = '';
            onSearchInput('');
        }
    });

    setStatus('loading');
    clearPanel();
    loadEvents();
}

if (isBrowser()) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}

/* Export for headless testing (no-ops in the browser). */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        normalizeEvent,
        parseEventsPayload,
        pickInitialPeriod,
        escapeHtml,
        capitalize,
        PERIODS,
    };
}
