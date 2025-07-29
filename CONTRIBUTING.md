# Contributing to GPTImage

Thank you for your interest in contributing to GPTImage! This document provides guidelines and information for contributors.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/GPTImage.git
   cd GPTImage
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Fill in your Azure OpenAI credentials
   ```

## 🛠️ Development Workflow

### Before You Start
- Check existing [issues](https://github.com/yourusername/GPTImage/issues) to see if your idea is already being worked on
- Create a new issue to discuss major changes before implementing
- Make sure you understand the [architecture](./ARCHITECTURE.md)

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow our coding standards**:
   - Use TypeScript for type safety
   - Follow Next.js best practices
   - Use Tailwind CSS for styling
   - Follow atomic design principles (atoms → molecules → organisms)
   - Add proper error handling
   - Include accessibility features (ARIA labels, keyboard navigation)

3. **Test your changes**:
   ```bash
   npm run dev
   # Test all affected features manually
   # Test on different screen sizes
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

### Commit Message Convention
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or fixing tests
- `chore:` - Maintenance tasks

## 🎯 Areas for Contribution

### High Priority
- [ ] Unit and integration tests
- [ ] Error handling improvements
- [ ] Performance optimizations
- [ ] Accessibility enhancements
- [ ] Mobile responsiveness
- [ ] Internationalization (i18n)

### Features
- [ ] Additional image formats support
- [ ] Advanced mask editing tools
- [ ] Image filters and effects
- [ ] Batch operations
- [ ] User accounts and history
- [ ] Social sharing features

### Technical Improvements
- [ ] Component library expansion
- [ ] State management optimization
- [ ] API rate limiting
- [ ] Caching strategies
- [ ] Database integration
- [ ] Deployment automation

## 📝 Code Style Guidelines

### TypeScript
```typescript
// Use interfaces for object types
interface ImageGenerationRequest {
  description: string;
  numberOfImages: number;
  size?: string;
}

// Use proper error handling
try {
  const result = await generateImage(request);
  return result;
} catch (error) {
  console.error('Image generation failed:', error);
  throw new Error('Failed to generate image');
}
```

### React Components
```typescript
// Use proper prop typing
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

// Use accessible components
export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};
```

### CSS/Tailwind
```typescript
// Use semantic class names and responsive design
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* Content */}
    </div>
  </div>
</div>
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Logo generation with different descriptions
- [ ] Multi-image upload and analysis
- [ ] Image editing with and without masks
- [ ] Iterative editing workflow
- [ ] PowerPoint generation and download
- [ ] Navigation between pages
- [ ] Mobile responsiveness
- [ ] Accessibility with screen readers

### Automated Testing (Coming Soon)
We're planning to add:
- Unit tests with Jest
- Component tests with React Testing Library
- E2E tests with Playwright
- API tests

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior**
4. **Actual behavior**
5. **Environment details**:
   - Browser and version
   - Operating system
   - Node.js version
   - Any relevant error messages or console logs

## 💡 Feature Requests

For feature requests, please provide:

1. **Problem description** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Alternative solutions** - Any other approaches considered?
4. **Use cases** - When would this be useful?

## 📚 Documentation

Help us keep documentation up to date:

- Update README.md for user-facing changes
- Update ARCHITECTURE.md for technical changes
- Add inline code comments for complex logic
- Update API documentation for new endpoints

## 🔄 Pull Request Process

1. **Update documentation** if needed
2. **Test thoroughly** on different devices/browsers
3. **Create a pull request** with:
   - Clear title and description
   - Link to related issues
   - Screenshots for UI changes
   - Testing notes

4. **Respond to feedback** promptly
5. **Squash commits** if requested before merging

## 🤝 Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and different perspectives
- Focus on constructive feedback
- Help others learn and grow

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or inflammatory comments
- Personal attacks
- Publishing private information

## 📞 Getting Help

- **General questions**: Create a [discussion](https://github.com/yourusername/GPTImage/discussions)
- **Bug reports**: Create an [issue](https://github.com/yourusername/GPTImage/issues)
- **Security issues**: Email directly (don't create public issues)

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special badges for consistent contributors

Thank you for making GPTImage better! 🎉
