# 🤝 Contributing to RF Link Planner

Thank you for your interest in contributing! This document provides guidelines for contributing to the RF Link Planner project.

## 📋 Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Feature Requests](#feature-requests)
- [Bug Reports](#bug-reports)

## 🤗 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior
- Harassment or discriminatory language
- Trolling or insulting comments
- Publishing others' private information
- Other unprofessional conduct

## 🚀 How to Contribute

### Ways to Contribute
1. **Report Bugs**: Found a bug? Let us know!
2. **Suggest Features**: Have an idea? We'd love to hear it
3. **Improve Documentation**: Help make docs clearer
4. **Fix Issues**: Browse open issues and submit fixes
5. **Add Features**: Implement new functionality
6. **Review Code**: Help review pull requests

## 💻 Development Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code recommended)
- Git for version control
- Basic knowledge of JavaScript, HTML, CSS

### Getting Started

1. **Fork the Repository**
   ```bash
   # Click "Fork" button on GitHub
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/rf-link-planner.git
   cd rf-link-planner
   ```

3. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Run Locally**
   ```bash
   python -m http.server 8000
   # Open http://localhost:8000
   ```

## 📝 Coding Standards

### JavaScript Style
- Use ES6+ features (const, let, arrow functions)
- Camel case for variables: `myVariable`
- Pascal case for constructors: `MyClass`
- Descriptive names: `calculateFresnelRadius` not `calcFR`
- Add comments for complex logic
- Keep functions small and focused

### Example
```javascript
// Good ✅
function calculateWavelength(frequencyGHz) {
    const frequencyHz = frequencyGHz * 1e9;
    const wavelength = SPEED_OF_LIGHT / frequencyHz;
    return wavelength;
}

// Avoid ❌
function calc(f) {
    return 3e8/(f*1e9);
}
```

### HTML Style
- Semantic HTML5 elements
- Descriptive IDs and classes
- Proper indentation (2 or 4 spaces)
- Accessibility attributes where needed

### CSS Style
- Use CSS custom properties for colors
- Mobile-first responsive design
- Consistent naming: BEM or similar
- Group related styles
- Comment major sections

## 🔧 File Structure

```
rf-link-planner/
├── index.html          # Main HTML - structure only
├── styles.css          # All styling
├── app.js             # All JavaScript logic
├── README.md          # Main documentation
├── DESIGN_DECISIONS.md # Design rationale
├── DEPLOYMENT.md      # Deployment guide
├── QUICKSTART.md      # Quick start guide
├── CONTRIBUTING.md    # This file
├── LICENSE            # MIT License
├── package.json       # Project metadata
└── vercel.json        # Deployment config
```

## 📤 Submitting Changes

### Pull Request Process

1. **Update Documentation**
   - Update README.md if needed
   - Add comments to new code
   - Update DESIGN_DECISIONS.md for major changes

2. **Test Your Changes**
   - [ ] Works in Chrome
   - [ ] Works in Firefox
   - [ ] Works in Safari/Edge
   - [ ] Responsive on mobile
   - [ ] No console errors
   - [ ] Existing features still work

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add wavelength calculator"
   # or
   git commit -m "fix: correct Fresnel zone formula"
   ```

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Fill in the template
   - Link related issues

### Commit Message Format

Use conventional commits:
```
type(scope): description

feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

Examples:
```
feat(fresnel): add 2nd Fresnel zone visualization
fix(tower): correct marker positioning on zoom
docs(readme): add installation instructions
style(css): improve button hover effects
```

## 💡 Feature Requests

### Before Requesting
1. Check existing issues
2. Search closed issues
3. Consider if it fits project scope

### When Requesting
Use the feature request template:

```markdown
**Is your feature related to a problem?**
Describe the problem clearly.

**Describe the solution you'd like**
What do you want to happen?

**Describe alternatives you've considered**
What other approaches did you think of?

**Additional context**
Screenshots, mockups, examples, etc.
```

## 🐛 Bug Reports

### Before Reporting
1. Check if already reported
2. Try to reproduce consistently
3. Test in different browsers

### When Reporting
Use the bug report template:

```markdown
**Describe the bug**
Clear description of what went wrong.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should have happened?

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g., Windows 10]
 - Browser: [e.g., Chrome 120]
 - Version: [e.g., 1.0.0]

**Additional context**
Console errors, network issues, etc.
```

## 🎯 Good First Issues

Looking to contribute but not sure where to start?

Look for issues tagged:
- `good first issue`
- `help wanted`
- `documentation`
- `beginner-friendly`

### Easy Contributions
- Fix typos in documentation
- Improve error messages
- Add input validation
- Enhance UI tooltips
- Add keyboard shortcuts
- Improve mobile responsiveness

### Medium Complexity
- Add tower export/import
- Implement local storage
- Add elevation API integration
- Create print/PDF feature
- Add dark mode

### Advanced
- 3D visualization
- Backend integration
- Real-time collaboration
- Advanced RF calculations

## 🧪 Testing Guidelines

### Manual Testing Checklist
- [ ] Add tower at various locations
- [ ] Create links with matching frequencies
- [ ] Try linking mismatched frequencies
- [ ] View Fresnel zones
- [ ] Edit tower frequencies
- [ ] Delete towers and links
- [ ] Switch between modes
- [ ] Test on mobile/tablet
- [ ] Check all modals work
- [ ] Verify calculations

### Browser Testing
Test in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📚 Resources

### Learning Resources
- [Leaflet.js Documentation](https://leafletjs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [RF Engineering Basics](https://en.wikipedia.org/wiki/Fresnel_zone)

### Similar Projects
Look at these for inspiration:
- Radio Mobile Online
- PathLoss by ARRL
- Airlink by Ubiquiti

## 🏆 Recognition

Contributors will be:
- Listed in README.md
- Credited in release notes
- Mentioned in project updates

## 📞 Questions?

- Open a discussion on GitHub
- Check existing issues
- Review documentation first

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🎉

Every contribution, no matter how small, makes this project better.
