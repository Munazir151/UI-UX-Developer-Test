// RF Link Planner Application
// Main application logic with tower management, link creation, and Fresnel zone visualization

// ============================================================================
// Application State
// ============================================================================
const state = {
    mode: 'addTower', // 'addTower' or 'addLink'
    towers: [],
    links: [],
    selectedTowers: [],
    map: null,
    towerIdCounter: 1,
    linkIdCounter: 1,
    pendingTowerLocation: null,
    activeLinkForFresnel: null,
    confirmAction: null
};

// ============================================================================
// Constants
// ============================================================================
const SPEED_OF_LIGHT = 3e8; // m/s
const DEFAULT_FREQUENCY = 5.0; // GHz

// ============================================================================
// Map Initialization
// ============================================================================
function initializeMap() {
    // Initialize Leaflet map centered on a default location
    state.map = L.map('map').setView([40.7128, -74.0060], 10); // New York as default

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(state.map);

    // Add click handler for map
    state.map.on('click', handleMapClick);
}

// ============================================================================
// Event Handlers
// ============================================================================
function handleMapClick(e) {
    if (state.mode === 'addTower') {
        // Store location and show modal for tower configuration
        state.pendingTowerLocation = e.latlng;
        showTowerModal();
    }
}

function showTowerModal() {
    const modal = document.getElementById('towerModal');
    const nameInput = document.getElementById('towerName');
    const frequencyInput = document.getElementById('towerFrequency');
    
    nameInput.value = `Tower ${state.towerIdCounter}`;
    frequencyInput.value = DEFAULT_FREQUENCY;
    
    modal.classList.add('show');
    nameInput.focus();
}

function hideTowerModal() {
    const modal = document.getElementById('towerModal');
    modal.classList.remove('show');
    state.pendingTowerLocation = null;
}

function saveTower() {
    const name = document.getElementById('towerName').value;
    const frequency = parseFloat(document.getElementById('towerFrequency').value);
    
    if (!name || !frequency || frequency <= 0) {
        showNotification('Please enter a valid tower name and frequency.', 'error');
        return;
    }
    
    if (state.pendingTowerLocation) {
        addTower(state.pendingTowerLocation, name, frequency);
        hideTowerModal();
    }
}

function addTower(latlng, name, frequency) {
    const tower = {
        id: state.towerIdCounter++,
        name: name,
        frequency: frequency,
        lat: latlng.lat,
        lng: latlng.lng,
        marker: null
    };
    
    // Create marker
    const marker = L.marker([latlng.lat, latlng.lng], {
        icon: L.divIcon({
            className: 'tower-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(state.map);
    
    // Add popup
    marker.bindPopup(`<strong>${name}</strong><br>Frequency: ${frequency} GHz`);
    
    // Add click handler for link mode
    marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        if (state.mode === 'addLink') {
            handleTowerClickForLink(tower);
        }
    });
    
    tower.marker = marker;
    state.towers.push(tower);
    
    updateTowerList();
}

function handleTowerClickForLink(tower) {
    // Toggle selection
    const index = state.selectedTowers.findIndex(t => t.id === tower.id);
    
    if (index !== -1) {
        // Deselect
        state.selectedTowers.splice(index, 1);
        tower.marker.setIcon(L.divIcon({
            className: 'tower-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        }));
    } else {
        // Select
        state.selectedTowers.push(tower);
        tower.marker.setIcon(L.divIcon({
            className: 'tower-marker selected',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        }));
    }
    
    // If two towers selected, try to create link
    if (state.selectedTowers.length === 2) {
        const [tower1, tower2] = state.selectedTowers;
        
        // Check if frequencies match
        if (tower1.frequency !== tower2.frequency) {
            showNotification(`Cannot connect towers with different frequencies! (${tower1.frequency} GHz vs ${tower2.frequency} GHz)`, 'error');
            clearTowerSelection();
            return;
        }
        
        // Create link
        createLink(tower1, tower2);
        clearTowerSelection();
    }
    
    updateTowerList();
}

function clearTowerSelection() {
    state.selectedTowers.forEach(tower => {
        tower.marker.setIcon(L.divIcon({
            className: 'tower-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        }));
    });
    state.selectedTowers = [];
    updateTowerList();
}

function createLink(tower1, tower2) {
    // Check if link already exists
    const exists = state.links.some(link => 
        (link.tower1.id === tower1.id && link.tower2.id === tower2.id) ||
        (link.tower1.id === tower2.id && link.tower2.id === tower1.id)
    );
    
    if (exists) {
        showNotification('A link already exists between these towers.', 'error');
        return;
    }
    
    const link = {
        id: state.linkIdCounter++,
        tower1: tower1,
        tower2: tower2,
        frequency: tower1.frequency,
        polyline: null,
        fresnelZone: null
    };
    
    // Calculate distance
    const distance = calculateDistance(tower1.lat, tower1.lng, tower2.lat, tower2.lng);
    link.distance = distance;
    
    // Create polyline
    const polyline = L.polyline(
        [[tower1.lat, tower1.lng], [tower2.lat, tower2.lng]],
        {
            color: '#3b82f6', // --primary-color
            weight: 3,
            opacity: 0.7
        }
    ).addTo(state.map);
    
    // Add click handler to show Fresnel zone
    polyline.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        showFresnelZone(link);
    });
    
    link.polyline = polyline;
    state.links.push(link);
    
    updateLinkList();
}

function requestDeleteTower(towerId) {
    const tower = state.towers.find(t => t.id === towerId);
    if (!tower) return;

    showConfirmationModal(
        `Delete Tower: ${tower.name}?`,
        'This will also remove all connected links. This action cannot be undone.',
        () => {
            const towerItem = document.querySelector(`.tower-item[data-id="${towerId}"]`);
            if (towerItem) {
                towerItem.classList.add('list-item-exit');
                towerItem.addEventListener('animationend', () => {
                    performDeleteTower(towerId);
                }, { once: true });
            } else {
                performDeleteTower(towerId);
            }
        }
    );
}

function performDeleteTower(towerId) {
    const towerIndex = state.towers.findIndex(t => t.id === towerId);
    if (towerIndex === -1) return;
    const tower = state.towers[towerIndex];
    const linksToRemove = state.links.filter(link => link.tower1.id === towerId || link.tower2.id === towerId);
    linksToRemove.forEach(link => performDeleteLink(link.id));
    state.map.removeLayer(tower.marker);
    state.towers.splice(towerIndex, 1);
    updateTowerList();
    updateLinkList();
}

function deleteLink(linkId, skipConfirm = false) {
    const linkIndex = state.links.findIndex(l => l.id === linkId);
    if (linkIndex === -1) return;
    
    const link = state.links[linkIndex];
    
    // Remove polyline from map
    state.map.removeLayer(link.polyline);

    if (skipConfirm) {
        performDeleteLink(linkId);
        return;
    }

    showConfirmationModal(
        `Delete Link ${link.id}?`,
        `Are you sure you want to remove the link between ${link.tower1.name} and ${link.tower2.name}?`,
        () => {
            const linkItem = document.querySelector(`.link-item[data-id="${linkId}"]`);
            if (linkItem) {
                linkItem.classList.add('list-item-exit');
                linkItem.addEventListener('animationend', () => {
                    performDeleteLink(linkId);
                }, { once: true });
            } else {
                performDeleteLink(linkId);
            }
        }
    );
}

function performDeleteLink(linkId) {
    const linkIndex = state.links.findIndex(l => l.id === linkId);
    if (linkIndex === -1) return;
    const link = state.links[linkIndex];
    if (link.polyline) state.map.removeLayer(link.polyline);
    if (link.fresnelZone) state.map.removeLayer(link.fresnelZone);
    state.links.splice(linkIndex, 1);
    
    // Clear active Fresnel if this was it
    if (state.activeLinkForFresnel === linkId) {
        state.activeLinkForFresnel = null;
    }
    
    updateLinkList();
}

async function updateTowerFrequency(towerId, newFrequency) {
    const tower = state.towers.find(t => t.id === towerId);
    if (!tower) return;
    
    tower.frequency = parseFloat(newFrequency);
    
    // Update popup
    tower.marker.setPopupContent(`<strong>${tower.name}</strong><br>Frequency: ${tower.frequency} GHz`);
    
    // Check if any links need to be removed (frequency mismatch)
    const invalidLinks = state.links.filter(link => 
        (link.tower1.id === towerId || link.tower2.id === towerId) &&
        link.tower1.frequency !== link.tower2.frequency
    );
    
    if (invalidLinks.length > 0) { 
        const confirmed = await showConfirmationModal(
            'Frequency Mismatch',
            `Changing frequency will remove ${invalidLinks.length} link(s). Do you want to continue?`,
            () => invalidLinks.forEach(link => performDeleteLink(link.id)),
            true // Return promise
        );

        if (!confirmed) {
            // Revert if cancelled
            const originalFrequency = state.links.find(l => l.tower1.id === towerId || l.tower2.id === towerId)?.frequency || tower.frequency;
            tower.frequency = originalFrequency;
        }
    }
    
    updateTowerList(); // Update UI regardless
}

// ============================================================================
// Fresnel Zone Calculation and Visualization
// ============================================================================
function showFresnelZone(link) {
    // If the clicked link is already active, deactivate it (toggle off)
    if (state.activeLinkForFresnel === link.id) {
        deactivateActiveFresnelZone();
        return;
    }

    // If another link is active, deactivate it first
    if (state.activeLinkForFresnel !== null) {
        deactivateActiveFresnelZone();
    }

    state.activeLinkForFresnel = link.id;
    
    // Calculate Fresnel zone
    const wavelength = calculateWavelength(link.frequency);
    const distance = link.distance;
    
    // Calculate maximum Fresnel radius at the midpoint
    const d1 = distance / 2;
    const d2 = distance / 2;
    const maxRadius = calculateFresnelRadius(wavelength, d1, d2);
    
    // Create ellipse for Fresnel zone
    const center = [
        (link.tower1.lat + link.tower2.lat) / 2,
        (link.tower1.lng + link.tower2.lng) / 2
    ];
    
    // Calculate bearing for ellipse rotation
    const bearing = calculateBearing(
        link.tower1.lat, link.tower1.lng,
        link.tower2.lat, link.tower2.lng
    );
    
    // Create Fresnel zone polygon (approximating an ellipse)
    const fresnelZone = createEllipsePolygon(center, distance * 1000 / 2, maxRadius, bearing).addTo(state.map);
    
    link.polyline.setStyle({ color: '#16a34a' }); // --success-color
    link.fresnelZone = fresnelZone;
    
    // Show link info modal
    showLinkInfoModal(link, maxRadius);
    
    updateLinkList();
}

function showLinkInfoModal(link, fresnelRadius) {
    const modal = document.getElementById('linkModal');
    const infoDiv = document.getElementById('linkInfo');
    
    const wavelength = calculateWavelength(link.frequency);
    
    infoDiv.innerHTML = `
        <div class="link-details">
            <div><strong>Link:</strong> ${link.tower1.name} ↔ ${link.tower2.name}</div>
            <div><strong>Distance:</strong> ${(link.distance).toFixed(2)} km</div>
            <div><strong>Frequency:</strong> ${link.frequency} GHz</div>
            <div class="info-highlight"><strong>Wavelength:</strong> ${(wavelength * 1000).toFixed(2)} mm</div>
            <div class="info-highlight"><strong>Max Fresnel Radius:</strong> ${fresnelRadius.toFixed(2)} m</div>
            <div class="formula-box">
                <strong>Formula:</strong><br>
                r = √((λ × d₁ × d₂) / (d₁ + d₂))<br>
                <small>Where λ = c/f, c = 3×10⁸ m/s</small>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

function hideLinkModal() {
    const modal = document.getElementById('linkModal');
    modal.classList.remove('show');
}

function deactivateActiveFresnelZone() {
    const prevLink = state.links.find(l => l.id === state.activeLinkForFresnel);
    if (prevLink && prevLink.fresnelZone) {
        state.map.removeLayer(prevLink.fresnelZone);
        prevLink.polyline.setStyle({ color: '#3b82f6' }); // Revert color to primary
        prevLink.fresnelZone = null;
    }
    state.activeLinkForFresnel = null;
    updateLinkList();
}

// ============================================================================
// Calculation Functions
// ============================================================================
function calculateWavelength(frequencyGHz) {
    // Convert GHz to Hz
    const frequencyHz = frequencyGHz * 1e9;
    // Calculate wavelength: λ = c / f
    return SPEED_OF_LIGHT / frequencyHz;
}

function calculateFresnelRadius(wavelength, d1, d2) {
    // r = √((λ × d₁ × d₂) / (d₁ + d₂))
    // d1 and d2 are in meters
    const d1Meters = d1 * 1000;
    const d2Meters = d2 * 1000;
    const radius = Math.sqrt((wavelength * d1Meters * d2Meters) / (d1Meters + d2Meters));
    return radius;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateBearing(lat1, lon1, lat2, lon2) {
    // Correctly calculate the initial bearing from point 1 to point 2
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);
    const lonDiffRad = toRadians(lon2 - lon1);

    const y = Math.sin(lonDiffRad) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lonDiffRad);
    
    const bearing = Math.atan2(y, x);

    // Convert bearing from -180 to +180 range to 0 to 360 range
    // and return as degrees.
    return (toDegrees(bearing) + 360) % 360;
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

function createEllipsePolygon(center, semiMajor, semiMinor, bearing, points = 64) {
    const latlngs = [];
    const centerPt = state.map.latLngToLayerPoint(center);
    const bearingRad = toRadians(-bearing); // Convert bearing to radians for trig functions

    for (let i = 0; i < points; i++) {
        const angle = (i / points) * 2 * Math.PI;
        const x = semiMinor * Math.cos(angle);
        const y = semiMajor * Math.sin(angle);

        // Rotate the point
        const rotatedX = centerPt.x + x * Math.cos(bearingRad) - y * Math.sin(bearingRad);
        const rotatedY = centerPt.y + x * Math.sin(bearingRad) + y * Math.cos(bearingRad);

        latlngs.push(state.map.layerPointToLatLng([rotatedX, rotatedY]));
    }

    return L.polygon(latlngs, {
        color: '#16a34a', // --success-color
        fillColor: '#16a34a',
        fillOpacity: 0.15,
        weight: 2 });
}

// ============================================================================
// UI Confirmation Modal
// ============================================================================
function showConfirmationModal(title, message, onConfirm, returnPromise = false) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;

    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelConfirmBtn');

    modal.classList.add('show');

    const handleConfirm = () => {
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
        hideConfirmationModal();
        if (returnPromise) {
            state.confirmAction.resolve(true);
        }
    };

    const handleCancel = () => {
        hideConfirmationModal();
        if (returnPromise) {
            state.confirmAction.resolve(false);
        }
    };

    // Use .cloneNode(true) to remove old event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', handleConfirm);

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    newCancelBtn.addEventListener('click', handleCancel);

    // Handle promise resolution if needed
    if (returnPromise) {
        return new Promise(resolve => {
            state.confirmAction = { resolve };
        });
    }
}

function hideConfirmationModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.remove('show');
    state.confirmAction = null;
}

// ============================================================================
// UI Theme Management
// ============================================================================
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        document.documentElement.style.setProperty('--map-filter', 'brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7)');
    } else {
        document.body.classList.remove('dark-mode');
        document.documentElement.style.setProperty('--map-filter', 'none');
    }
    document.getElementById('themeToggle').checked = (theme === 'dark');
    localStorage.setItem('theme', theme);
}

// ============================================================================
// UI Notification System
// ============================================================================
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'error' 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
        : '';

    notification.innerHTML = `${icon}<span>${message}</span>`;
    
    container.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.5s ease forwards';
        notification.addEventListener('animationend', () => {
            notification.remove();
        });
    }, 3000);
}

// ============================================================================
// UI Update Functions
// ============================================================================
function updateTowerList() {
    const towerList = document.getElementById('towerList');
    
    if (state.towers.length === 0) {
        towerList.innerHTML = `
            <div class="empty-state-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <p>Your map is empty. Click on the map in "Add Tower" mode to place your first tower.</p>
            </div>
        `;
        return;
    }
    
    towerList.innerHTML = state.towers.map(tower => {
        const isSelected = state.selectedTowers.some(t => t.id === tower.id);
        return `
            <div class="tower-item list-item-enter ${isSelected ? 'selected' : ''}" data-id="${tower.id}">
                <div class="tower-header">
                    <span class="tower-name">🗼 ${tower.name}</span>
                    <div class="tower-controls">
                        <button class="btn btn-danger btn-small" onclick="requestDeleteTower(${tower.id})" title="Delete Tower">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="tower-details">
                    <div class="tower-detail">
                        <label>Frequency:</label>
                        <input 
                            type="number" 
                            step="0.1" 
                            min="0.1" 
                            value="${tower.frequency}" 
                            onchange="updateTowerFrequency(${tower.id}, this.value)"
                        /> GHz
                    </div>
                    <div class="tower-location">
                        📍 ${tower.lat.toFixed(4)}, ${tower.lng.toFixed(4)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateLinkList() {
    const linkList = document.getElementById('linkList');
    
    if (state.links.length === 0) {
        linkList.innerHTML = `
            <div class="empty-state-card">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>
                <p>No links created yet. Switch to "Add Link" mode and click two towers to connect them.</p>
            </div>
        `;
        return;
    }
    
    linkList.innerHTML = state.links.map(link => {
        const isActive = state.activeLinkForFresnel === link.id;
        return `
            <div class="link-item list-item-enter ${isActive ? 'fresnel-active' : ''}" data-id="${link.id}"
                 onclick="showFresnelZone(state.links.find(l => l.id === ${link.id}))">
                <div class="link-header">
                    <span class="link-name">🔗 Link ${link.id}</span>
                    <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); deleteLink(${link.id}, false)" title="Delete Link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                <div class="link-details">
                    <div>${link.tower1.name} ↔ ${link.tower2.name}</div>
                    <div>📏 Distance: ${link.distance.toFixed(2)} km</div>
                    <div>📡 Frequency: ${link.frequency} GHz</div>
                    ${isActive ? '<div style="color: #22c55e; font-weight: 600;">✓ Fresnel Zone Active</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function setMode(mode) {
    state.mode = mode;
    
    // Clear selections when switching modes
    clearTowerSelection();
    
    // Update UI
    const addTowerBtn = document.getElementById('addTowerBtn');
    const addLinkBtn = document.getElementById('addLinkBtn');
    const modeIndicator = document.getElementById('modeIndicator');
    
    if (mode === 'addTower') {
        addTowerBtn.classList.add('active');
        addLinkBtn.classList.remove('active');
        modeIndicator.textContent = 'Mode: Add Tower';
    } else {
        addTowerBtn.classList.remove('active');
        addLinkBtn.classList.add('active');
        modeIndicator.textContent = 'Mode: Add Link';
    }
}

// ============================================================================
// Event Listeners Setup
// ============================================================================
function setupEventListeners() {
    // Mode buttons
    document.getElementById('addTowerBtn').addEventListener('click', () => setMode('addTower'));
    document.getElementById('addLinkBtn').addEventListener('click', () => setMode('addLink'));
    
    // Tower modal
    document.getElementById('saveTowerBtn').addEventListener('click', saveTower);
    document.getElementById('cancelTowerBtn').addEventListener('click', hideTowerModal);
    
    // Link modal
    document.getElementById('closeLinkBtn').addEventListener('click', hideLinkModal);

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked ? 'dark' : 'light'));
    
    // Close modals on outside click
    document.getElementById('towerModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideTowerModal();
        }
    });
    
    document.getElementById('linkModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideLinkModal();
        }
    });

    document.getElementById('confirmModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideConfirmationModal();
        }
    });
    
    // Enter key on tower modal
    document.getElementById('towerFrequency').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveTower();
        }
    });
}

function setupResizer() {
    const resizer = document.getElementById('resizer');
    const sidebar = document.querySelector('.sidebar');

    let isResizing = false;
    let startX, startWidth;

    resizer.addEventListener('mousedown', function(e) {
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(document.defaultView.getComputedStyle(sidebar).width, 10);
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    function handleMouseMove(e) {
        if (!isResizing) return;
        const dx = e.clientX - startX;
        const newWidth = startWidth + dx;

        // Set constraints for sidebar width
        if (newWidth > 250 && newWidth < 600) {
            sidebar.style.width = newWidth + 'px';
            // Invalidate map size to force Leaflet to re-render correctly
            if (state.map) {
                state.map.invalidateSize();
            }
        }
    }

    function handleMouseUp() {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    setMode('addTower');
    setupResizer();

    // Initialize theme
    const preferredTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(preferredTheme);
    
    console.log('RF Link Planner initialized successfully!');
});

// Make functions globally accessible for inline event handlers
window.requestDeleteTower = requestDeleteTower;
window.deleteLink = function(linkId, skipConfirm = false) {
    const link = state.links.find(l => l.id === linkId);
    if (!link) return;
    if (skipConfirm) {
        performDeleteLink(linkId);
        return;
    }
    showConfirmationModal(
        `Delete Link ${link.id}?`,
        `Are you sure you want to remove the link between ${link.tower1.name} and ${link.tower2.name}?`,
        () => performDeleteLink(linkId)
    );
};
window.updateTowerFrequency = updateTowerFrequency;
window.showFresnelZone = showFresnelZone;
window.state = state;
