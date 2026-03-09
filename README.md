# Neobrutalism Portfolio & Blog

A modern, high-performance portfolio and blog template built with React, Vite, and Tailwind CSS. It features a distinct "neobrutalist" aesthetic, a built-in command-line terminal for navigation, and a comprehensive admin dashboard.

## Features

- **Neobrutalist Design**: Bold colors, sharp edges, and high contrast.
- **Interactive Terminal**: A functional CLI for navigation, searching posts, and fun easter eggs.
- **Admin Dashboard**: Manage posts, pages, and site configuration directly from the browser.
- **Markdown Support**: Full markdown rendering with syntax highlighting for code blocks.
- **Math Support**: Render mathematical formulas using LaTeX syntax (via MathJax/KaTeX).
- **AsciiDoc & reStructuredText**: Native support for `.adoc` and `.rst` content formats.
- **Dynamic Content**: Create custom pages with flexible layouts (grid, list, etc.), including a dedicated Presentations page for conference talks.
- **Theme System**: Toggle between different visual themes via the terminal.
- **Import Tool**: Import content from external URLs (Markdown, HTML) to quickly populate your blog.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Icons**: Lucide React
- **Markdown**: React Markdown, React Syntax Highlighter
- **Forms**: React Hook Form

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/neobrutal-portfolio.git
   cd neobrutal-portfolio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── components/     # Reusable UI components (Terminal, Layout, etc.)
├── context/        # React Context providers (Theme, SiteConfig)
├── lib/            # Utility functions and classes (Logger, utils)
├── pages/          # Page components (Home, Blog, Admin, etc.)
├── styles/         # Global styles and Tailwind configuration
└── main.tsx        # Application entry point
```

## Production Deployment

To generate a static site for production deployment, run the following command:

```bash
npm run build
```

The static files will be generated in the `dist/` directory.

### Disabling the Admin Panel
For a static website deployment where you don't want the admin interface exposed, you can disable it by setting an environment variable.

1. Create a `.env` file in the root directory (or set it in your deployment platform).
2. Add the following line:
   ```env
   VITE_DISABLE_ADMIN=true
   ```
3. Rebuild the application: `npm run build`.

The `/admin` route will no longer be accessible.

## Documentation

- [User Guide](USER_GUIDE.md): How to use the website and admin panel.
- [Contributing Guide](CONTRIBUTING.md): How to contribute to the project.

## License

MIT
