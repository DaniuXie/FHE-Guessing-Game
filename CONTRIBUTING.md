# Contributing to FHE Guessing Game

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🌟 Ways to Contribute

- 🐛 Report bugs
- ✨ Suggest new features
- 📖 Improve documentation
- 🔧 Submit code improvements
- 🧪 Add tests
- 🌍 Translate to other languages

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/fhe-guessing-game.git
cd fhe-guessing-game
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Set Up Development Environment

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Copy environment variables
cp .env.example .env

# Run tests
npx hardhat test

# Start development server
cd frontend && npm run dev
```

## 📝 Code Guidelines

### Solidity (Smart Contracts)

- Use Solidity 0.8.24
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Add NatSpec comments for all functions
- Write unit tests for new functions

```solidity
/// @notice Brief description
/// @dev Detailed technical notes
/// @param paramName Description of parameter
/// @return Description of return value
function yourFunction(uint256 paramName) external returns (uint256) {
    // Implementation
}
```

### TypeScript/React (Frontend)

- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Add JSDoc comments for complex functions

```typescript
/**
 * Brief description
 * @param paramName - Description
 * @returns Description
 */
export function YourComponent({ paramName }: Props) {
    // Implementation
}
```

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Ensure responsive design (test on multiple screen sizes)
- Maintain consistent spacing and colors

## 🧪 Testing

### Smart Contracts

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/GuessGameFHE.test.js

# Check coverage
npx hardhat coverage
```

### Frontend

```bash
cd frontend

# Run unit tests (if available)
npm test

# Build production bundle
npm run build
```

## 📋 Pull Request Process

1. **Update Documentation**: Ensure README.md and code comments are updated
2. **Test Thoroughly**: All tests must pass
3. **Follow Commit Convention**:
   ```
   feat: Add new feature
   fix: Fix bug
   docs: Update documentation
   style: Code style changes
   refactor: Code refactoring
   test: Add tests
   chore: Maintenance tasks
   ```

4. **Create Pull Request**:
   - Use a clear, descriptive title
   - Reference related issues
   - Provide detailed description of changes
   - Add screenshots for UI changes

5. **Code Review**:
   - Address reviewer feedback
   - Keep discussion professional
   - Be patient and respectful

## 🐛 Reporting Bugs

Use GitHub Issues with the following information:

- **Title**: Clear, concise description
- **Description**: 
  - What happened
  - What you expected
  - Steps to reproduce
- **Environment**: Browser, OS, network
- **Screenshots**: If applicable
- **Logs**: Console errors or transaction hashes

## 💡 Suggesting Features

For feature requests, please include:

- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Additional Context**: Screenshots, mockups, etc.

## 🔒 Security

For security vulnerabilities:

- **Do NOT** create public issues
- Email directly to: [your-security-email]
- Include detailed description and proof of concept
- Allow time for fix before disclosure

## 📜 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- No harassment or trolling
- Follow project guidelines

## 🎓 Learning Resources

### FHE & Zama
- [Zama Documentation](https://docs.zama.ai/)
- [FHEVM Overview](https://docs.zama.ai/fhevm)
- [FHE.org](https://fhe.org/)

### Solidity
- [Solidity Docs](https://docs.soliditylang.org/)
- [Hardhat Tutorial](https://hardhat.org/tutorial)

### React
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🏆 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/yourusername/fhe-guessing-game/discussions)
- Join [Zama Discord](https://discord.fhe.org)
- Check existing issues and PRs

---

Thank you for contributing to confidential computing on blockchain! 🎉






