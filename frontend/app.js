/**
 * HistoryMaP Frontend Application - FIXED VERSION
 * Handles interactive map and historical events display with proper period tab navigation
 */

const API_BASE = 'http://localhost:8000/api';

// State variables for period navigation
let currentLocationIndex = 0;
let currentPeriodKey = 'ancient';

// Event listeners setup
document.addEventListener('DOMContentLoaded', () => {
    initSearch();
    initMapGrid();
    initTabNavigation();
});

/**
 * Initialize search functionality
 */
function initSearch() {
    const searchInput = document.getElementById('search-input');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        // Filter location cards by name
        document.querySelectorAll('.location-card').forEach(card => {
            const cardName = card.querySelector('h3').textContent.toLowerCase();
            if (cardName.includes(query)) {
                card.style.display = 'block';
            } else if (!query) {
                card.style.display = 'block';
            }
        });
    });
}

/**
 * Initialize map grid with all locations
 */
async function initMapGrid() {
    try {
        const response = await fetch(`${API_BASE}/events`);
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const events = await response.json();
        
        renderLocationCards(events);
    } catch (error) {
        console.error('Failed to load events:', error);
        // Fallback: display static cards with actual data from memory files
        const locations = getLocalEvents();
        renderLocationCards(locations);
    }
}

/**
 * Render location cards in grid
 */
function renderLocationCards(events) {
    const grid = document.getElementById('world-grid');
    if (!grid) return;
    
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
    
    // Add click event listeners to new cards
    document.querySelectorAll('.location-card').forEach((card, index) => {
        card.addEventListener('click', () => selectLocation(index));
    });
}

/**
 * Select and display a location's details
 */
function selectLocation(index) {
    currentLocationIndex = index;
    
    // Remove active class from all cards
    document.querySelectorAll('.location-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to selected card
    const cards = document.querySelectorAll('.location-card');
    if (cards[index]) {
        cards[index].classList.add('active');
    }
    
    // Load and display period details
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
 * Get current event from either API or local data
 */
function getCurrentEvent() {
    const events = getLocalEvents();
    return events[currentLocationIndex];
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
    
    // Use periods from parameter if provided, otherwise use current location's periods
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
            // Get the period key from data attribute or use array index
            const periodKey = tab.dataset.period || ['ancient', 'medieval', 'modern'][index];
            
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Update current period and reload content
            currentPeriodKey = periodKey;
            loadAndDisplayPeriod();
        });
        
        // Keyboard navigation support (arrow keys)
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
