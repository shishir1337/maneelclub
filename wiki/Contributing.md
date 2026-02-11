# Contributing Guidelines

Thank you for your interest in contributing to Maneel Club! This document provides guidelines and instructions for contributing.

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/shishir1337/maneelclub/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing feature requests
2. Create a new issue with:
   - Clear feature description
   - Use case and benefits
   - Proposed implementation (if you have ideas)

### Code Contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit with clear messages
5. Push to your fork
6. Open a Pull Request

---

## 📝 Development Setup

### Prerequisites

- Node.js >= 20.19.0
- pnpm (recommended) or npm
- PostgreSQL >= 14
- Git

### Setup Steps

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/maneelclub.git
   cd maneelclub
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set Up Database**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

---

## 💻 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types
- Use proper type definitions
- Follow existing code style

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Follow ESLint configuration
- Format code with Prettier

### Component Structure

```typescript
// Imports
import { ... } from "..."

// Types
interface ComponentProps {
  // ...
}

// Component
export function Component({ ... }: ComponentProps) {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
  return (...)
}
```

### File Naming

- Components: `kebab-case.tsx` (e.g., `product-card.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-price.ts`)
- Types: `types.ts` or `index.ts`

---

## 🧪 Testing

### Before Submitting

- [ ] Code follows style guidelines
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Tested in development environment
- [ ] Tested on different screen sizes (if UI changes)

### Testing Checklist

- Test new features thoroughly
- Test edge cases
- Test error handling
- Test responsive design (if UI changes)

---

## 📦 Pull Request Process

### PR Checklist

- [ ] Code is properly formatted
- [ ] No console.logs or debug code
- [ ] Comments added for complex logic
- [ ] Documentation updated (if needed)
- [ ] Tests pass (if applicable)
- [ ] No breaking changes (or documented)

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots here
```

### Review Process

1. PR will be reviewed by maintainers
2. Address any feedback
3. Once approved, PR will be merged

---

## 🏗️ Project Structure

### Key Directories

- `src/app/` - Next.js pages and routes
- `src/components/` - React components
- `src/actions/` - Server actions
- `src/lib/` - Utility functions
- `src/schemas/` - Zod validation schemas
- `prisma/` - Database schema and migrations

### Adding New Features

1. **New Page/Route**
   - Add to `src/app/`
   - Follow Next.js App Router conventions

2. **New Component**
   - Add to `src/components/`
   - Create reusable UI components in `src/components/ui/`

3. **New Server Action**
   - Add to `src/actions/`
   - Use `"use server"` directive
   - Add proper error handling

4. **Database Changes**
   - Create migration: `pnpm db:migrate`
   - Update Prisma schema
   - Update types if needed

---

## 🐛 Bug Fixes

### Bug Fix Guidelines

1. Identify the root cause
2. Write a minimal fix
3. Test the fix thoroughly
4. Add comments if the fix is non-obvious
5. Update tests if applicable

---

## 📚 Documentation

### Updating Documentation

- Update README.md for major changes
- Update wiki pages if needed
- Add JSDoc comments for complex functions
- Update type definitions

### Code Comments

- Add comments for complex logic
- Explain "why" not "what"
- Use clear, concise language

---

## 🔒 Security

### Security Guidelines

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate and sanitize user input
- Follow authentication best practices
- Report security issues privately

---

## 📋 Commit Messages

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```
feat(products): add product variant support

fix(auth): resolve session expiration issue

docs(readme): update installation instructions
```

---

## 🎯 Areas for Contribution

### High Priority

- Performance optimizations
- Accessibility improvements
- Test coverage
- Documentation improvements
- Bug fixes

### Feature Ideas

- Additional payment methods
- Email notifications
- Advanced search/filtering
- Product reviews/ratings
- Wishlist functionality

---

## ❓ Questions?

- Open an issue for questions
- Contact maintainer: mdshishirahmed811@gmail.com
- Check existing documentation

---

## 🙏 Thank You!

Your contributions make Maneel Club better for everyone. We appreciate your time and effort!

---

*Last updated: February 2026*
