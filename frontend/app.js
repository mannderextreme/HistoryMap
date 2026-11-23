/**
 * HistoryMaP Frontend Application - MAP VERSION
 * Enhanced with Leaflet.js world map and historical events display
 */

const API_BASE = 'http://localhost:8000/api';

// State variables
let currentLocationIndex = 0;
let currentPeriodKey = 'ancient';
let map, mapMarker, mapBounds;
let locations = [];
let isMapView = true; // Start in map view by default

// Event listeners setup
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initMap();
    initTabNavigation();
    loadAndDisplayPeriod();
});

/**
 * Initialize search functionality
 */
function initSearch() {
    const searchInput = document.getElementById('search-input');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.toLowerCase();
        
        if (!query) {
            // Show all locations on clear
            await displayAllLocations();
            return;
        }
        
        // Filter locations by name
        const filtered = locations.filter(loc => 
            loc.name.toLowerCase().includes(query)
        );
        
        if (filtered.length > 0) {
            // Center map on first match and show in cards too
            updateMapView(filtered[0], filtered);
            displayLocationCards(filtered);
        } else {
            document.getElementById('facts-list').innerHTML = 
                '<li class="no-results">No locations found matching "' + escapeHtml(query) + '"</li>';
            document.querySelectorAll('.location-card').forEach(card => {
                card.style.display = 'none';
            });
        }
    });
}

/**
 * Initialize Leaflet map
 */
function initMap() {
    try {
        // Check if window.L is available (Leaflet loaded)
        if (!window.L) {
            console.error('Leaflet.js not loaded');
            showGridFallback();
            return;
        }
        
        // Create map centered on world
        const defaultCenter = [48, 10];
        const defaultZoom = 3;
        
        map = L.map('world-map', {
            center: defaultCenter,
            zoom: defaultZoom,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: false,
            dragging: true,
            attributionControl: true
        });
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Set initial bounds to show all locations
        updateMapView(getLocalEvents()[0], getLocalEvents());
        
    } catch (error) {
        console.error('Failed to initialize map:', error);
        showGridFallback();
    }
}

/**
 * Update map view with location markers
 */
async function updateMapView(location, allLocations) {
    if (!map) {
        console.warn('Map not initialized');
        return;
    }
    
    // Clear existing marker
    if (mapMarker) {
        map.removeLayer(mapMarker);
    }
    
    const locData = location || getLocalEvents()[0] || {};
    const lat = locData.location?.latitude || 48;
    const lng = locData.location?.longitude || 10;
    
    // Add marker with location info
    mapMarker = L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b>${escapeHtml(locData.name)}</b><br>Historical events explorer`)
        .openPopup();
    
    // Fly to location
    map.flyTo([lat, lng], 6, {
        animate: true,
        duration: 1.5
    });
    
    // Store locations for card display fallback
    locations = allLocations || getLocalEvents();
    
    // Display cards below map (optional)
    displayLocationCards(locations);
}

/**
 * Display all locations on map when search is cleared
 */
async function displayAllLocations() {
    if (!map) return;
    
    locations = await fetchLocationsFromAPI();
    const event = getCurrentEvent();
    
    // Clear marker and fly to selected location
    if (mapMarker) {
        map.removeLayer(mapMarker);
        mapMarker = null;
    }
    
    mapBounds = L.latLngBounds(locations.map(loc => loc.location));
    map.fitBounds(mapBounds, { padding: [50, 50] });
    
    // Add markers for all locations
    locations.forEach((loc, index) => {
        const marker = L.marker([loc.location.latitude, loc.location.longitude])
            .addTo(map)
            .bindPopup(`
                <b>${escapeHtml(loc.name)}</b><br>
                Click to select this location.
            `)
            .on('click', () => {
                map.flyTo([loc.location.latitude, loc.location.longitude], 6);
                currentLocationIndex = index;
                loadAndDisplayPeriod();
            });
    });
}

/**
 * Show grid fallback if map fails to initialize
 */
function showGridFallback() {
    const mapContainer = document.getElementById('world-map');
    const cardsContainer = document.getElementById('location-cards');
    
    if (mapContainer) {
        mapContainer.innerHTML = '<div class="world-grid" id="world-grid"></div>';
    }
    
    if (cardsContainer) {
        cardsContainer.id = 'world-grid';
        // Use original grid rendering
        const events = getLocalEvents();
        renderLocationCards(events);
    }
}

/**
 * Fetch locations from API with geographical data
 */
async function fetchLocationsFromAPI() {
    try {
        const response = await fetch(`${API_BASE}/events`);
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const events = await response.json();
        return extractLocationData(events);
    } catch (error) {
        console.error('API fallback:', error);
        return getLocalEvents();
    }
}

/**
 * Extract geographical data from API response
 */
function extractLocationData(events) {
    // Map API response to location objects with coordinates
    return events.map(event => ({
        name: event.name,
        location: event.location || { latitude: 48, longitude: 10 },
        periods: event.periods || {}
    }));
}

/**
 * Render original grid cards as fallback
 */
function renderLocationCards(events) {
    const grid = document.getElementById('world-grid') || 
                   document.getElementById('location-cards');
    
    if (!grid) return;
    
    // Hide map section when in grid view
    const mapContainer = document.getElementById('world-map');
    if (mapContainer && map) {
        map.remove();
        map = null;
    }
    
    grid.innerHTML = events.map((event, index) => `
        <div class="location-card" data-index="${index}" onclick="selectLocation(${index})">
            <h3>${escapeHtml(event.name)}</h3>
            <div class="period-badges">
                <span class="period-badge">${getPeriodTitle('ancient')}</span>
                <span class="period-badge">${getPeriodTitle('medieval')}</span>
                <span class="period-badge">${getPeriodTitle('modern')}</span>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.location-card').forEach((card, index) => {
        card.addEventListener('click', () => selectLocation(index));
    });
}

/**
 * Display location cards below map
 */
function displayLocationCards(locationsToDisplay) {
    const cardsContainer = document.getElementById('world-grid') || 
                          document.getElementById('location-cards');
    
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = locationsToDisplay.map((event, index) => `
        <div class="location-card" data-index="${index}" onclick="selectLocation(${index})">
            <h3>${escapeHtml(event.name)}</h3>
            <div class="period-badges">
                <span class="period-badge">${getPeriodTitle('ancient')}</span>
                <span class="period-badge">${getPeriodTitle('medieval')}</span>
                <span class="period-badge">${getPeriodTitle('modern')}</span>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.location-card').forEach((card, index) => {
        card.addEventListener('click', () => selectLocation(index));
    });
}

/**
 * Select and display a location's details
 */
function selectLocation(index) {
    currentLocationIndex = index;
    
    // Remove active class from all cards (if in grid view)
    document.querySelectorAll('.location-card').forEach(card => {
        card.classList.remove('active');
    });
    
    const cards = document.querySelectorAll('.location-card');
    if (cards[index]) {
        cards[index].classList.add('active');
    }
    
    // If in map view, fly to selected location
    if (map) {
        const event = getCurrentEvent();
        if (event && event.location) {
            map.flyTo([event.location.latitude, event.location.longitude], 8);
        }
    }
    
    loadAndDisplayPeriod();
}

/**
 * Get local event data as fallback
 */
function getLocalEvents() {
    return [
        {
            name: 'London, UK',
            location: { latitude: 51.5074, longitude: -0.1278 },
            periods: {
                ancient: { title: 'Ancient Rome in Britain', facts: [
                    'In 43 AD, the Roman Empire conquered Britain under Emperor Claudius.',
                    'Londinium was founded by the Romans and became one of their major cities.',
                    'The London Wall built by Romans defined the city limits for over 1500 years.'
                ]},
                medieval: { title: 'Medieval Period', facts: [
                    'In 676, the Danes made peace with the English kingdom.',
                    'The Anglo-Saxon kings consolidated power in London during the 8th-9th centuries.',
                    'William the Conqueror was crowned King of England at Westminster Abbey in 1066.'
                ]},
                modern: { title: 'Modern Times', facts: [
                    'The Great Exhibition opened in Hyde Park in 1851, showcasing industrial innovation.',
                    'London hosted the first modern Olympic Games in 1908.',
                    'In 2012, London became the first city to host the Summer Olympics twice.'
                ]}
            }
        },
        {
            name: 'Paris, France',
            location: { latitude: 48.8566, longitude: 2.3522 },
            periods: {
                ancient: { title: 'Gaul and Rome', facts: [
                    'Paris was originally called Lutetia by the Romans.',
                    'It was founded around 250 BC and became a major Roman trading center.',
                    'The city was conquered by Julius Caesar in 52 BC.'
                ]},
                medieval: { title: 'Medieval to Renaissance', facts: [
                    'In 843, the Treaty of Verdun established West Francia with Paris as capital.',
                    'Philip Augustus built a ring wall around Paris in the 12th century.',
                    'The Hundred Years\' War (1337-1453) saw major conflicts centered on French territory.'
                ]},
                modern: { title: 'Modern France', facts: [
                    'The French Revolution began in Paris in 1789, ending the monarchy.',
                    'Napoleon Bonaparte crowned himself Emperor in Notre-Dame Cathedral in 1804.',
                    'Paris hosted a pivotal role in WWI and WWII as capital of France.'
                ]}
            }
        },
        {
            name: 'Tokyo, Japan',
            location: { latitude: 35.6762, longitude: 139.6503 },
            periods: {
                ancient: { title: 'Ancient History', facts: [
                    'The area was originally part of the ancient province of Musashi.',
                    'In 1457, Ashikaga Yoshitane established Edo as a castle town.',
                    'The name \'Tokyo\' means \'Eastern Capital\' and was adopted in 1868.'
                ]},
                medieval: { title: 'Edo Period', facts: [
                    'In 1603, Tokugawa Ieyasu became Shogun and established the Edo domain.',
                    'Tokyo became the de facto capital under Tokugawa rule in 1868.',
                    "Japan implemented sakoku (closed country) policy with few foreign interactions."
                ]},
                modern: { title: 'Modern Japan', facts: [
                    'Tokyo suffered massive destruction during WWII bombings and the 1945 atomic attacks.',
                    'In 1964, Tokyo hosted the Summer Olympics, signaling Japan\'s post-war recovery.',
                    "Japan became a technological powerhouse in the late 20th century."
                ]}
            }
        },
        {
            name: 'New York, USA',
            location: { latitude: 40.7128, longitude: -74.006 },
            periods: {
                ancient: { title: 'Indigenous Peoples', facts: [
                    "The area was inhabited by the Lenape people, part of Algonquian-speaking tribes.",
                    'The Native Americans called this region \'Mannahatta\' meaning \'island of many hills\'.',
                    'These indigenous peoples lived there for thousands of years before European contact.'
                ]},
                medieval: { title: 'European Colonization', facts: [
                    'In 1624, Dutch settlers established a trading post at Manhattan.',
                    'New Amsterdam was chartered in 1625 as part of New Netherland.',
                    "The British captured the colony in 1664 and renamed it New York."
                ]},
                modern: { title: 'Modern America', facts: [
                    'In 1790, New York City became the first permanent capital of the United States.',
                    'The Statue of Liberty was dedicated in 1886 as a symbol of freedom.',
                    "New York's Stock Exchange has been central to global finance since 1792."
                ]}
            }
        },
        {
            name: 'Berlin, Germany',
            location: { latitude: 52.5200, longitude: 13.4050 },
            periods: {
                ancient: { title: 'Ancient Settlements', facts: [
                    'The area was inhabited by Slavic peoples and Celtic tribes before Roman times.',
                    "During the 1st century AD, the Romans reached parts of northern Germany.",
                    "Berlin's location on the Spree River made it strategically important."
                ]},
                medieval: { title: 'Medieval Berlin', facts: [
                    'In 1237, Holy Roman Emperor Frederick II incorporated Brandenburg as a principality.',
                    'Berlin and Cölln merged in 1871 to form the modern city.',
                    'Prussia rose to prominence with Berlin as its capital during the medieval period.'
                ]},
                modern: { title: 'Modern Germany', facts: [
                    'In 1945, Soviet forces captured Berlin at the end of WWII.',
                    "The city was divided into East and West from 1949 to 1989 during the Cold War.",
                    'The Berlin Wall fell in 1989, symbolizing the end of division and beginning reunification.'
                ]}
            }
        }
    ];
}

/**
 * Get period title from event data or local fallback
 */
function getPeriodTitle(periodKey) {
    const event = getCurrentEvent();
    if (event && event.periods && event.periods[periodKey]) {
        return event.periods[periodKey].title;
    }
    const titles = {
        ancient: 'Ancient Period',
        medieval: 'Medieval Period',
        modern: 'Modern Period'
    };
    return titles[periodKey] || periodKey.charAt(0).toUpperCase() + periodKey.slice(1);
}

/**
 * Get current event from local data
 */
function getCurrentEvent() {
    return getLocalEvents()[currentLocationIndex];
}

/**
 * Load and display current period details
 */
function loadAndDisplayPeriod() {
    const event = getCurrentEvent();
    if (!event) return;
    
    displayPeriodContent(event.periods || {}, currentPeriodKey);
}

/**
 * Display event details in panel for a specific period
 */
function displayPeriodContent(periods, periodKey) {
    const panel = document.getElementById('details-panel');
    if (!panel) return;
    
    const eventPeriods = periods || getCurrentEvent().periods;
    
    const panelTitle = document.getElementById('panel-title');
    const periodTitle = document.getElementById('period-title');
    const factsList = document.getElementById('facts-list');
    
    if (!panelTitle || !periodTitle || !factsList) return;
    
    // Clear previous content
    factsList.innerHTML = '';
    
    // Handle both single period and multiple periods
    let data = eventPeriods[periodKey];
    
    if (data && typeof data === 'object' && Array.isArray(data.facts)) {
        panelTitle.textContent = `${getCurrentEvent().name}`;
        periodTitle.textContent = getPeriodTitle(periodKey);
        
        // Create fact elements
        data.facts.forEach((fact) => {
            const li = document.createElement('li');
            li.textContent = '• ' + fact;
            factsList.appendChild(li);
        });
    } else {
        console.warn('Period data not found for:', periodKey);
    }
}

/**
 * Initialize tab button navigation with keyboard support
 */
function initTabNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    
    // Set initial active tab
    if (tabs.length > 0) {
        tabs[0].classList.add('active');
    }
    
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            const periodKey = tab.dataset.period || ['ancient', 'medieval', 'modern'][index];
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            currentPeriodKey = periodKey;
            loadAndDisplayPeriod();
        });
        
        tab.addEventListener('keydown', (e) => {
            const keyIndex = index;
            
            switch(e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    const nextTab = tabs[(keyIndex + 1) % tabs.length];
                    if (nextTab) nextTab.click();
                    break;
                
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    const prevTab = tabs[(keyIndex - 1 + tabs.length) % tabs.length];
                    if (prevTab) prevTab.click();
                    break;
                    
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    tab.click();
                    break;
            }
        });
    });
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
