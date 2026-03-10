# Contributing Guide

Thank you for your interest in contributing to the GemFolioCMS! We welcome bug reports, feature requests, and pull requests.

## Development Setup

1. **Fork and Clone**: Fork the repository to your GitHub account and clone it locally.
2. **Install Dependencies**: Run `npm install` to install all required packages.
3. **Start Dev Server**: Run `npm run dev` to start the local development server at `http://localhost:3000`.

## Architecture Overview

The project is built with **React** and **Vite**.

- **`src/main.tsx`**: The entry point. Sets up the router and providers.
- **`src/components/`**: Contains UI components.
  - `Terminal.tsx`: The complex terminal logic.
  - `Layout.tsx`: The main page wrapper (Header/Footer).
- **`src/pages/`**: Top-level page components.
  - `Admin.tsx`: The dashboard logic.
  - `Post.tsx`: Renders individual blog posts.
  - `Page.tsx`: Renders generic pages (like Works/Profile) based on JSON configuration.
- **`src/lib/`**: Utilities.
  - `logger.ts`: A centralized logging utility. Use this instead of `console.log`.

## Coding Standards

- **TypeScript**: We use TypeScript for type safety. Please ensure all new code is typed.
- **Tailwind CSS**: Use Tailwind utility classes for styling. Avoid custom CSS files unless necessary.
- **Logging**: Use the `logger` from `@/lib/logger` for any debug or info output.
  ```typescript
  import { logger } from '@/lib/logger';
  logger.info('Something happened', { data: 123 });
  ```
- **Comments**: Add JSDoc comments to complex functions and components.

## Submitting Changes

1. Create a new branch for your feature or fix: `git checkout -b feature/my-new-feature`.
2. Make your changes and commit them with clear messages.
3. Push your branch to your fork.
4. Open a Pull Request against the `main` branch of the original repository.

## Reporting Issues

If you find a bug, please open an issue on GitHub with:
- A clear description of the problem.
- Steps to reproduce.
- Expected vs. actual behavior.
