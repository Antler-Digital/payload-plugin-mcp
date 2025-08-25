# Contributing to Payload Analytics Plugin

Thank you for considering contributing to the Payload Analytics Plugin! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/payload-plugin-analytics.git`
3. Install dependencies: `pnpm install`
4. Start the development server: `pnpm dev`

## Development Workflow

1. Create a new branch for your feature or bugfix: `git checkout -b feature-name`
2. Make your changes
3. Write or update tests as necessary
4. Run the tests: `pnpm test`
5. Ensure your code lints: `pnpm lint`
6. Commit your changes using conventional commits: `pnpm cz`
7. Push to your branch: `git push origin feature-name`
8. Submit a pull request to the main repository

## Pull Request Guidelines

- Include a clear description of the changes
- Reference any related issues
- Update documentation as necessary
- Add tests for new features
- Follow the existing code style
- Keep pull requests focused on a single concern

## Testing

- Run the test suite with `pnpm test`
- Add tests for new features or bug fixes
- Ensure all tests pass before submitting a pull request

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear and standardized commit messages.

Example commit types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

## Release Process

We use [Changesets](https://github.com/changesets/changesets) to manage versioning and releases.

1. Add a changeset for your changes: `pnpm changeset`
2. Follow the prompts to describe your changes
3. Commit the changeset file

## Questions or Need Help?

Feel free to open an issue with the "question" label if you have any questions about contributing.

Thank you for your contribution!
