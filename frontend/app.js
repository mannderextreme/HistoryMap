/**
 * HistoryMaP Frontend Application
 * Handles interactive map and historical events display
 */

const API_BASE = 'http://localhost:5000/api';

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
        const events = await response.json();
        
        renderLocationCards(events);
    } catch (error) {
        console.error('Failed to load events:', error);
        // Fallback: display static cards with placeholder data
        const locations = [
            { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
            { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
            { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
            { name: 'New York, USA', lat: 40.7128, lng: -74.006 },
            { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050 }
        ];
        
        const mockEvents = locations.map(loc => ({
            location: loc,
            name: loc.name,
            periods: {
                ancient: { title: 'Ancient Period', facts: ['Historical fact'] },
                medieval: { title: 'Medieval Period', facts: ['Medieval fact'] },
                modern: { title: 'Modern Period', facts: ['Modern fact'] }
            }
        }));
        
        renderLocationCards(mockEvents);
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
                <span class="period-badge">Ancient</span>
                <span class="period-badge">Medieval</span>
                <span class="period-badge">Modern</span>
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
    loadPeriodDetails(index);
}

/**
 * Load and display period-specific content
 */
async function loadPeriodDetails(locationIndex) {
    const panel = document.getElementById('details-panel');
    if (!panel) return;
    
    try {
        // Use fallback data if API unavailable
        let events;
        try {
            const response = await fetch(`${API_BASE}/events`);
            events = await response.json();
        } catch (error) {
            // Load from local data as backup
            events = getLocalEvents();
        }
        
        if (locationIndex < events.length) {
            const event = events[locationIndex];
            displayEventDetails(event);
        }
    } catch (error) {
        console.error('Failed to load location:', error);
    }
}

/**
 * Display event details in panel
 */
function displayEventDetails(event) {
    const panelTitle = document.getElementById('panel-title');
    const periodTitle = document.getElementById('period-title');
    const factsList = document.getElementById('facts-list');
    
    if (!panelTitle || !periodTitle || !factsList) return;
    
    // Clear previous content
    factsList.innerHTML = '';
    
    // Display periods as tabs
    const periods = event.periods || {};
    
    Object.keys(periods).forEach((periodKey, index) => {
        const periodData = periods[periodKey];
        const btn = document.querySelector(`.tab-btn[data-period="${periodKey}"]`);
        
        if (btn && btn.dataset.period === periodKey) {
            btn.classList.add('active');
            
            // Create fact elements
            periodData.facts.forEach((fact, i) => {
        const li = document.createElement('li');
        li.textContent = `• ${fact}`;
        factsList.appendChild(li);
        });
        
            // Set current period content
            periodTitle.textContent = periodData.title;
            panelTitle.textContent = `${event.name} - ${periodKey.charAt(0).toUpperCase() + periodKey.slice(1)} Period`;
        }
    });
}

/**
 * Initialize tab button navigation
 */
function initTabNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active to clicked tab
            tab.classList.add('active');
            
            // Note: Full period switching would require API or local data access
            // Currently shows available periods in each location card
        });
    });
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
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
