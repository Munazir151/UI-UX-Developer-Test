# 📡 RF Outdoor Link Planner

A web-based tool for planning point-to-point RF (Radio Frequency) links between towers on an interactive map with Fresnel zone visualization.

![RF Link Planner](https://img.shields.io/badge/Status-Production-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🌟 Features

- **Interactive Map Interface**: Click to place RF towers on an OpenStreetMap
- **Tower Management**: Add, configure, and delete towers with custom frequencies
- **Point-to-Point Links**: Connect towers with matching frequencies
- **Fresnel Zone Visualization**: Calculate and display the first Fresnel zone for any link
- **Frequency Validation**: Prevents connecting towers with mismatched frequencies
- **Responsive Design**: Works seamlessly on desktop and tablet devices
- **Real-time Calculations**: Distance, wavelength, and Fresnel radius computed on-the-fly

## 🚀 Live Demo

[View Live Demo](https://ui-ux-developer-test.vercel.app/)

## 📋 Table of Contents

- [How It Works](#how-it-works)
- [Technical Implementation](#technical-implementation)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Design Decisions](#design-decisions)
- [Technologies Used](#technologies-used)
- [Deployment](#deployment)
- [Future Enhancements](#future-enhancements)

## 🎯 How It Works

### 1. Adding Towers
- Click on the map in "Add Tower Mode"
- Configure tower name and frequency (in GHz)
- Towers appear as markers on the map

### 2. Creating Links
- Switch to "Add Link Mode"
- Click on two towers with **matching frequencies**
- A green line appears connecting the towers
- Distance is automatically calculated

### 3. Viewing Fresnel Zones
- Click on any link line
- The first Fresnel zone appears as an ellipse
- Modal shows detailed information including:
  - Link distance
  - Frequency and wavelength
  - Maximum Fresnel radius
  - Mathematical formula used

## 🔧 Technical Implementation

### Fresnel Zone Calculation

The application calculates the first Fresnel zone using the standard RF formula:

```
r = √((λ × d₁ × d₂) / (d₁ + d₂))
```

Where:
- **r** = radius of the first Fresnel zone at a point (meters)
- **λ** = wavelength of the signal (meters), calculated as λ = c / f
- **d₁** = distance from transmitter to the point (meters)
- **d₂** = distance from receiver to the point (meters)
- **c** = speed of light = 3 × 10⁸ m/s
- **f** = frequency in Hz (converted from GHz)

### Distance Calculation

Uses the Haversine formula to calculate accurate great-circle distances between tower coordinates:

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
```

## 🏁 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- No build tools or dependencies required - pure vanilla JavaScript!

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rf-link-planner.git
   cd rf-link-planner
   ```

2. **Open in browser**
   ```bash
   # Simply open index.html in your browser
   # Or use a local server:
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

That's it! No npm install, no build process needed.

## 📖 Usage Guide

### Basic Workflow

1. **Start in Add Tower Mode** (default)
   - Click anywhere on the map
   - Enter tower name and frequency
   - Click "Save"

2. **Add More Towers**
   - Repeat the process for additional towers
   - Use different frequencies if needed

3. **Create Links**
   - Click "Add Link Mode" button
   - Click first tower, then second tower
   - Link will only be created if frequencies match

4. **View Fresnel Zones**
   - Click on any green link line
   - An ellipse appears showing the Fresnel zone
   - Modal displays detailed calculations

5. **Manage Towers & Links**
   - Edit tower frequencies using the input fields
   - Delete towers or links using the delete buttons
   - System automatically removes invalid links when frequencies change

### Tips

- **Frequency Matching**: Only towers with identical frequencies can be linked
- **Tower Selection**: Selected towers are highlighted in orange/yellow
- **Link Information**: Hover over links to see connection details
- **Fresnel Zones**: The ellipse shows the clearance zone needed for optimal signal propagation

## 🎨 Design Decisions

### Architecture

**Vanilla JavaScript Approach**
- No framework dependencies (React, Vue, etc.)
- Pure JavaScript for maximum compatibility and performance
- Easy to understand and modify
- Minimal file size and fast loading

**State Management**
- Simple global state object for managing towers and links
- Event-driven updates to UI
- Clean separation between data and presentation

### UI/UX Choices

**Two-Mode System**
- Clear separation between adding towers and creating links
- Prevents accidental operations
- Visual feedback for current mode

**Sidebar Layout**
- Tower and link lists for easy management
- Real-time updates when changes occur
- Instructions panel for user guidance

**Modal Dialogs**
- Tower configuration modal for controlled data entry
- Link information modal for detailed calculations
- Non-intrusive and easy to dismiss

**Color Scheme**
- Blue primary color for professional appearance
- Green for successful connections and Fresnel zones
- Red for delete actions
- Semantic colors that match user expectations

### Technical Choices

**Leaflet.js for Mapping**
- Lightweight and fast
- Excellent documentation
- OpenStreetMap integration
- Custom marker and polyline support

**Simplified Fresnel Visualization**
- 2D ellipse representation (practical for web visualization)
- Maximum radius calculated at midpoint
- Does not account for terrain elevation (can be added later)
- Sufficient for link planning purposes

**Haversine Distance Formula**
- Accurate for Earth's curved surface
- Standard in geospatial calculations
- Suitable for the distances in RF planning

**Event-Driven Updates**
- UI updates automatically when data changes
- No manual refresh needed
- Efficient DOM manipulation

## 🛠 Technologies Used

- **HTML5**: Structure and semantics
- **CSS3**: Styling, animations, responsive layout
- **JavaScript (ES6+)**: Application logic and calculations
- **Leaflet.js**: Interactive mapping library
- **OpenStreetMap**: Map tile provider


## 🔮 Future Enhancements

### Potential Features

1. **Terrain Elevation Integration**
   - Fetch elevation data using Open-Elevation API
   - Display elevation profile along link path
   - Check for line-of-sight obstructions

2. **Link Budget Calculations**
   - Calculate path loss
   - Antenna gain considerations
   - Received signal strength estimates

3. **Export/Import**
   - Save tower and link configurations to JSON
   - Import existing configurations
   - Export to PDF or image format

4. **Multiple Fresnel Zones**
   - Show 2nd and 3rd Fresnel zones
   - Configurable zone display options

5. **Advanced Tower Properties**
   - Antenna height above ground
   - Antenna type and gain
   - Transmit power settings

6. **Link Quality Indicators**
   - Color-coded links based on quality
   - Warning for potential issues
   - Optimization suggestions

7. **3D Visualization**
   - Three.js integration for 3D view
   - Terrain elevation rendering
   - Interactive 3D Fresnel zones

8. **Multi-User Collaboration**
   - Backend integration
   - Real-time collaborative editing
   - User accounts and saved projects

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Your Name**
- GitHub: [Munazir Ansari](https://github.com/Munazir151)
- Email: munazir9741@gmail.com

##  Acknowledgments

- OpenStreetMap contributors for map data
- Leaflet.js team for the excellent mapping library
- RF engineering community for formulas and best practices

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/Munazir151/rf-link-planner/issues) page
2. Create a new issue with detailed description
3. Reach out via email

---

Made with ❤️ for the RF planning community
