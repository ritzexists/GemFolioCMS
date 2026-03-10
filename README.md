# Neobrutalism Portfolio & Blog Template

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
- **SEO Features**: Built-in SEO support using `react-helmet-async` for dynamic meta tags and titles.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Icons**: Lucide React
- **Markdown**: React Markdown, React Syntax Highlighter
- **Forms**: React Hook Form
- **SEO**: React Helmet Async

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/neobrutalism-template.git
   cd neobrutalism-template
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

## SEO Configuration

This project includes a reusable `SEO` component located at `src/components/SEO.tsx`. It uses `react-helmet-async` to manage document head tags dynamically.

To use it in a page:

```tsx
import SEO from '@/components/SEO';

// Inside your component
<SEO title="Page Title" description="Page description" canonical="https://example.com/page" />
```

The `SEO` component automatically handles the site title suffix and provides default meta descriptions if none are provided.

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

### Admin Panel in Production
By default, the production build disables the admin panel for security and to ensure a clean static output. This is controlled by the `VITE_DISABLE_ADMIN` environment variable, which is set to `true` automatically during the `npm run build` process.

If you explicitly want to include the admin panel in your production build, you can override this by setting the variable to `false`:

```bash
VITE_DISABLE_ADMIN=false npm run build
```

### Local Image Support
You can store images directly in the `./content` directory and reference them in your Markdown files using relative paths.

1. Place your images in `./content/posts/` or `./content/pages/`.
2. Reference them in Markdown: `![Alt Text](./my-image.png)`.
3. The development server and static generator will automatically resolve these paths and include the images in the build.

## Documentation

- [User Guide](USER_GUIDE.md): How to use the website and admin panel.
- [Contributing Guide](CONTRIBUTING.md): How to contribute to the project.

## License

MIT
