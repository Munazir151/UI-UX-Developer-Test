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
    activeLinkForFresnel: null
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
        alert('Please enter valid tower details');
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
            alert(`Cannot connect towers with different frequencies!\n${tower1.name}: ${tower1.frequency} GHz\n${tower2.name}: ${tower2.frequency} GHz`);
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
        alert('Link already exists between these towers!');
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
            color: '#22c55e',
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

function deleteTower(towerId) {
    // Find and remove tower
    const towerIndex = state.towers.findIndex(t => t.id === towerId);
    if (towerIndex === -1) return;
    
    const tower = state.towers[towerIndex];
    
    // Remove associated links
    const linksToRemove = state.links.filter(link => 
        link.tower1.id === towerId || link.tower2.id === towerId
    );
    
    linksToRemove.forEach(link => {
        deleteLink(link.id);
    });
    
    // Remove marker from map
    state.map.removeLayer(tower.marker);
    
    // Remove from state
    state.towers.splice(towerIndex, 1);
    
    updateTowerList();
}

function deleteLink(linkId) {
    const linkIndex = state.links.findIndex(l => l.id === linkId);
    if (linkIndex === -1) return;
    
    const link = state.links[linkIndex];
    
    // Remove polyline from map
    state.map.removeLayer(link.polyline);
    
    // Remove Fresnel zone if exists
    if (link.fresnelZone) {
        state.map.removeLayer(link.fresnelZone);
    }
    
    // Remove from state
    state.links.splice(linkIndex, 1);
    
    // Clear active Fresnel if this was it
    if (state.activeLinkForFresnel === linkId) {
        state.activeLinkForFresnel = null;
    }
    
    updateLinkList();
}

function updateTowerFrequency(towerId, newFrequency) {
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
        const confirmDelete = confirm(`Changing frequency will remove ${invalidLinks.length} link(s) due to frequency mismatch. Continue?`);
        if (confirmDelete) {
            invalidLinks.forEach(link => deleteLink(link.id));
        }
    }
    
    updateTowerList();
}

// ============================================================================
// Fresnel Zone Calculation and Visualization
// ============================================================================
async function showFresnelZone(link) {
    // Clear previous Fresnel zone
    if (state.activeLinkForFresnel) {
        const prevLink = state.links.find(l => l.id === state.activeLinkForFresnel);
        if (prevLink && prevLink.fresnelZone) {
            state.map.removeLayer(prevLink.fresnelZone);
            prevLink.fresnelZone = null;
        }
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
    
    // Create Fresnel zone ellipse
    const fresnelZone = L.ellipse(center, {
        semiMajor: distance * 1000 / 2, // Convert to meters
        semiMinor: maxRadius,
        tilt: bearing,
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 0.15,
        weight: 2,
        opacity: 0.5
    }).addTo(state.map);
    
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
            <div><strong>Wavelength:</strong> ${(wavelength * 1000).toFixed(2)} mm</div>
            <div><strong>Max Fresnel Radius:</strong> ${fresnelRadius.toFixed(2)} m</div>
            <div style="margin-top: 1rem; padding: 0.75rem; background: #f0fdf4; border-radius: 6px; border: 1px solid #22c55e;">
                <strong>Fresnel Zone Formula:</strong><br>
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
    const dLon = toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
    const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
              Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);
    
    const bearing = Math.atan2(y, x);
    return toDegrees(bearing);
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

// ============================================================================
// UI Update Functions
// ============================================================================
function updateTowerList() {
    const towerList = document.getElementById('towerList');
    
    if (state.towers.length === 0) {
        towerList.innerHTML = '<p class="empty-state">Click on the map to add towers</p>';
        return;
    }
    
    towerList.innerHTML = state.towers.map(tower => {
        const isSelected = state.selectedTowers.some(t => t.id === tower.id);
        return `
            <div class="tower-item ${isSelected ? 'selected' : ''}">
                <div class="tower-header">
                    <span class="tower-name">🗼 ${tower.name}</span>
                    <div class="tower-controls">
                        <button class="btn btn-danger btn-small" onclick="deleteTower(${tower.id})">
                            🗑️ Delete
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
        linkList.innerHTML = '<p class="empty-state">Connect towers with matching frequencies</p>';
        return;
    }
    
    linkList.innerHTML = state.links.map(link => {
        const isActive = state.activeLinkForFresnel === link.id;
        return `
            <div class="link-item ${isActive ? 'fresnel-active' : ''}" onclick="showFresnelZone(state.links.find(l => l.id === ${link.id}))">
                <div class="link-header">
                    <span class="link-name">🔗 Link ${link.id}</span>
                    <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); deleteLink(${link.id})">
                        🗑️
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
    
    // Enter key on tower modal
    document.getElementById('towerFrequency').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveTower();
        }
    });
}

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    setupEventListeners();
    setMode('addTower');
    
    console.log('RF Link Planner initialized successfully!');
});

// Make functions globally accessible for inline event handlers
window.deleteTower = deleteTower;
window.deleteLink = deleteLink;
window.updateTowerFrequency = updateTowerFrequency;
window.showFresnelZone = showFresnelZone;
window.state = state;
