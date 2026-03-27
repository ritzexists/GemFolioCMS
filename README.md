# GemFolioCMS

A femme maximalist neobrutalist static-site-generator-style CMS with markdown file backing, admin dashboard, and terminal aesthetics. Built with React, Vite, and Tailwind CSS.

## Features

- **Neobrutalist Design**: Bold colors, sharp edges, and high contrast with a femme maximalist touch.
- **Interactive Terminal**: A functional CLI for navigation, searching posts, and fun easter eggs.
- **Admin Dashboard**: Manage posts, pages, and site configuration directly from the browser.
- **Subfolder-based Content**: Automatically organizes posts and pages into subfolders (e.g., `/content/posts/slug/index.md`) for better asset management.
- **Integrated Media Upload**: Upload images and files directly from the editor into the post's dedicated folder.
- **Enhanced File Manager**: Custom modals for file operations and multi-select support for moving or deleting files.
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
   git clone https://github.com/yourusername/gemfolio-cms.git
   cd gemfolio-cms
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

### Local Image & Media Support
GemFolioCMS uses a subfolder-per-post structure to make media management easy.

1. When you create a new post with slug `my-post`, it lives at `./content/posts/my-post/index.md`.
2. Use the **MEDIA** button in the Admin Editor to upload files.
3. Files are saved to the post's subfolder and automatically inserted into your Markdown.
4. You can also manually place images in the subfolder and reference them: `![Alt Text](./my-image.png)`.
5. The development server and static generator will automatically resolve these paths.

## Documentation

- [User Guide](USER_GUIDE.md): How to use the website and admin panel.
- [Contributing Guide](CONTRIBUTING.md): How to contribute to the project.

## License

MIT
