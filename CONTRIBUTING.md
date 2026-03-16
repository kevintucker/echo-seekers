# Contributing to Echo Seekers

Thank you for your interest in contributing to Echo Seekers! This document provides guidelines and instructions for contributing to the project.

## 🌟 How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

**When reporting a bug, include:**
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser and version
- Screenshots or GIFs (if applicable)
- Console errors (if any)

### Suggesting Features

We welcome feature suggestions! Please:
- Check if the feature has already been suggested
- Provide a clear description of the feature
- Explain why this feature would be useful
- Include mockups or examples if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our code style
3. **Test thoroughly** - ensure nothing breaks
4. **Update documentation** if needed
5. **Commit with clear messages**
6. **Submit a pull request**

## 💻 Development Guidelines

### Code Style

- **Use ES6+ features** (const/let, arrow functions, classes)
- **No semicolons** (consistent with existing code)
- **2-space indentation**
- **Descriptive variable names** (avoid single letters except in loops)
- **Comment complex logic**
- **Keep functions focused** and single-purpose

### File Organization

- **One class per file** when possible
- **Import at the top** of files
- **Export at the bottom** of files
- **Group related functionality** together

### Naming Conventions

- **Classes**: PascalCase (`PlayerController`, `QuestSystem`)
- **Functions/Methods**: camelCase (`updateQuestProgress`, `showNotification`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PLAYERS`, `DEFAULT_SPEED`)
- **Files**: camelCase matching class name (`questSystem.js`, `playerController.js`)

### Three.js Best Practices

- **Dispose of geometries and materials** when removing objects
- **Reuse geometries** when creating multiple similar objects
- **Use buffer geometry** for better performance
- **Optimize shadow casting** (only enable when needed)
- **Pool objects** for frequently created/destroyed elements

### Performance Considerations

- **Avoid creating objects in update loops**
- **Use object pooling** for particles and effects
- **Throttle expensive operations**
- **Use LOD (Level of Detail)** for distant objects
- **Profile performance** before and after changes

## 🧪 Testing

Currently, testing is manual:
- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Check console for errors
- Verify all quest objectives work
- Test merchant interactions
- Ensure dragon mechanics function
- Validate UI responsiveness

## 📝 Commit Messages

Write clear, descriptive commit messages:

```
✅ Good:
- Add dragon feeding cooldown timer
- Fix quest completion notification bug
- Improve village path generation

❌ Bad:
- fix bug
- updates
- asdf
```

### Commit Message Format

```
<type>: <description>

[optional body]
[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## 🎨 Adding New Features

### Before Starting

1. **Check existing issues** and PRs
2. **Discuss major changes** in an issue first
3. **Plan the architecture** - how will it integrate?
4. **Consider performance** impact

### Feature Checklist

- [ ] Code follows project style
- [ ] Feature is fully functional
- [ ] No console errors
- [ ] Performance impact is acceptable
- [ ] Documentation updated
- [ ] Comments added for complex logic
- [ ] Works in multiple browsers
- [ ] Doesn't break existing features

## 🏗️ Architecture Guidelines

### Adding New Systems

When adding a new system (like QuestSystem, DragonManager):

1. **Create a new file** (`myNewSystem.js`)
2. **Export a class** with clear responsibilities
3. **Initialize in main.js** if needed globally
4. **Connect to existing systems** via dependency injection
5. **Update README** with new features

### UI Components

When adding UI:

1. **Add HTML structure** in `index.html`
2. **Style in the `<style>` section** (keep inline for now)
3. **Add JavaScript** in appropriate system file
4. **Follow existing UI patterns** for consistency
5. **Ensure mobile responsiveness**

### Game Objects

When adding 3D objects:

1. **Create in dedicated method** (e.g., `buildNewBuilding()`)
2. **Add to scene** and track references
3. **Position using world coordinates** (document locations)
4. **Add to relevant collections** (buildings, animatedParts, etc.)
5. **Dispose properly** when removed

## 🐛 Debugging Tips

- Use browser DevTools console
- Check Network tab for failed loads
- Use Three.js Inspector extension
- Add console.logs strategically
- Test with simplified versions first

## 📚 Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [ES6 Modules Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)

## 🤝 Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on the issue, not the person
- Assume good intentions
- Help others learn

## ❓ Questions?

- Open an issue with the `question` label
- Join discussions in the repository
- Check existing documentation first

## 🎉 Recognition

Contributors will be:
- Listed in the README
- Credited in release notes
- Appreciated greatly! 🙏

---

Thank you for contributing to Echo Seekers! Your efforts help make this game better for everyone. 🎮✨
