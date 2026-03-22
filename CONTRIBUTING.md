# Contributing to CodeTube

First off, thank you for considering contributing to CodeTube! 🎉 It's people like you that make CodeTube such a great tool for the coding community.

> 📖 **Quick Links**: [Code of Conduct](CODE_OF_CONDUCT.md) • [Issue Templates](.github/ISSUE_TEMPLATE) • [PR Template](.github/PULL_REQUEST_TEMPLATE.md)

---

## 🚀 Getting Started

### Development Environment Setup

#### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

#### 1. Fork & Clone

```bash
# Fork the repo on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/codetube.git
cd codetube
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed

# Start development server
npm run dev
```

The backend will be running at `http://localhost:3001`

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be running at `http://localhost:5173`

#### 4. Verify Everything Works

- ✅ Backend health check: http://localhost:3001/health
- ✅ Frontend loads without errors
- ✅ You can create an account and log in

---

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

### Frontend Tests

```bash
cd frontend
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

---

## 📝 Code Style Guidelines

We use a consistent code style across the project. Please follow these guidelines:

### TypeScript/JavaScript

- **Linting**: We use ESLint with TypeScript rules
  ```bash
  npm run lint        # Check for linting errors
  npm run lint:fix    # Fix auto-fixable errors
  ```

- **Formatting**: We use Prettier
  ```bash
  npm run format      # Format all files
  npm run format:check # Check formatting without modifying files
  ```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TutorialPlayer.tsx` |
| Hooks | camelCase with `use` prefix | `useProgress.ts` |
| Utilities | camelCase | `formatDuration.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_RECORDING_SIZE` |
| Types/Interfaces | PascalCase | `TutorialData` |
| Enums | PascalCase | `PlaybackState` |

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(recorder): add keyboard shortcut for pause
fix(player): resolve sync issue with voice narration
docs(api): update authentication endpoints
```

---

## 🔄 Pull Request Process

1. **Before Starting Work**
   - Check existing issues and PRs to avoid duplicates
   - For major changes, open an issue first to discuss your approach
   - Comment on an issue you'd like to work on so we can assign it to you

2. **Creating Your PR**
   - Create a new branch from `main`: `git checkout -b feature/your-feature-name`
   - Make focused, atomic commits
   - Ensure all tests pass
   - Update documentation if needed

3. **PR Requirements**
   - Fill out the PR template completely
   - Link any related issues: `Fixes #123`
   - Ensure CI checks pass
   - Request review from maintainers

4. **Review Process**
   - Address review comments promptly
   - Maintainers will merge once approved
   - Your contribution will be acknowledged in our changelog!

---

## 🐛 Reporting Bugs

Found a bug? Please use our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md):

1. Go to [Issues](https://github.com/yourusername/codetube/issues)
2. Click "New Issue"
3. Select "Bug Report"
4. Fill in as much detail as possible

**A good bug report includes:**
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Environment details (OS, browser, versions)

---

## 💡 Suggesting Features

Have an idea? Use our [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md):

1. Go to [Issues](https://github.com/yourusername/codetube/issues)
2. Click "New Issue"
3. Select "Feature Request"
4. Describe your idea in detail

---

## 🏷️ Issue Labels

We use labels to organize issues:

| Label | Description |
|-------|-------------|
| `good first issue` | Great for newcomers |
| `help wanted` | Extra attention needed |
| `bug` | Something isn't working |
| `enhancement` | New feature or request |
| `documentation` | Documentation improvements |
| `performance` | Performance-related |
| `refactor` | Code restructuring |

---

## 🌟 Recognition

Contributors will be:
- Listed in our [Contributors](https://github.com/yourusername/codetube/graphs/contributors) page
- Mentioned in release notes for significant contributions
- Added to our hall of fame (coming soon!)

---

## ❓ Questions?

- 💬 Join our [Discord](https://discord.gg/codetube) for real-time help
- 📧 Email: contributors@codetube.dev
- 🐦 Twitter: [@CodeTube](https://twitter.com/codetube)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

**Thank you for making CodeTube better!** 🚀
