<div align="center">
  <img src="./content/assets/site-icon.svg" alt="GemFolioCMS Logo" width="200" />
  <h1>GemFolioCMS</h1>
  <p><em>A femme maximalist neobrutalist static-site-generator-style CMS for the end of the world.</em></p>
</div>

---

GemFolioCMS is a markdown-backed, flat-file CMS and static site generator built with React, Vite, and Tailwind CSS. It features a bold, high-contrast neobrutalist aesthetic that is as girly as I am. It includes a fully functional admin dashboard, an interactive terminal, and is ready for modern static hosting like GitHub Pages.

## ✨ Current Features

- **Femme Neobrutalist Design**: Bold yet ladylike colors, sharp edges, high contrast.
- **Admin Dashboard**: Manage posts, pages, and site configuration directly from the browser (`/admin`).
- **Dynamic Navigation**: The top navigation menu automatically filters and displays links based on the pages you actually have created (e.g., Recs, Talks, Works, Hubs, Profile).
- **Subfolder-based Content**: Automatically organizes posts and pages into subfolders (e.g., `/content/posts/slug/index.md`) for better asset management.
- **Integrated Media Upload**: Upload images and files directly from the editor into the post's dedicated folder.
- **Customizable Branding**: Upload your own Site Icon/Logo and Favicon directly through the Admin Settings page.
- **Markdown & Beyond**: Full markdown rendering with syntax highlighting, plus support for mathematical formulas (LaTeX via MathJax/KaTeX), AsciiDoc (`.adoc`), and reStructuredText (`.rst`).
- **Interactive Terminal**: A functional CLI for navigation, searching posts, and fun easter eggs.
- **Import Tool**: Import content from external URLs (Markdown, HTML) to quickly populate your blog.
- **SEO Optimized**: Built-in SEO support using `react-helmet-async` for dynamic meta tags, titles, and dynamic favicon injection.
- **RSS Feed Generation**: Automatically generates an `rss.xml` feed during the static build process.
- **Performance Optimized**: Implements Vite code-splitting (`manualChunks`) to ensure fast load times even with heavy dependencies like Babylon.js or Monaco Editor.

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Routing**: React Router DOM (v7)
- **State Management**: React Context API
- **Icons**: Lucide React & Custom SVGs
- **Markdown**: React Markdown, React Syntax Highlighter, remark-math, rehype-katex
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **SEO**: React Helmet Async

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
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

## ⚙️ Configuration & SEO

### Site Settings
You can configure the site's name, description, hero text, and upload custom logos/favicons directly via the **Admin Dashboard** (`/admin`) under the **Site Settings** tab. These changes are saved to `site-config.json` and persist across builds.

### SEO Component
This project includes a reusable `SEO` component located at `src/components/SEO.tsx`. It is integrated into the main `Layout.tsx` to provide default SEO tags and the configured favicon to all pages. 

To override SEO tags on a specific page:
```tsx
import SEO from '@/components/SEO';

// Inside your component
<SEO title="Specific Page Title" description="Custom description" canonical="https://example.com/page" />
```

## 📂 Project Structure

```
.
├── content/        # Your actual data (posts, pages, assets, config)
├── scripts/        # Build scripts (generate-static.ts)
├── src/
│   ├── components/ # Reusable UI components (Terminal, Layout, SEO, etc.)
│   ├── context/    # React Context providers (Theme, SiteConfig)
│   ├── lib/        # Utility functions and classes (Logger, utils)
│   ├── pages/      # Page components (Home, Blog, Admin, Profile, etc.)
│   ├── styles/     # Global styles and Tailwind configuration
│   └── main.tsx    # Application entry point
├── server.ts       # Express server for local development and API routes
└── vite.config.ts  # Vite configuration (handles code-splitting and base URLs)
```

## 🚢 Deployment

GemFolioCMS is designed to be exported as a static site and hosted anywhere (GitHub Pages, Vercel, Netlify).

### Building for Production

To generate a static site for production deployment, run:

```bash
npm run build
```

This command runs Vite's build process and then executes `scripts/generate-static.ts` to compile your markdown/JSON content into static HTML and generate the RSS feed. The final output is placed in the `dist/` directory.

### GitHub Pages (Subpath Deployment)

GemFolioCMS is fully configured for modern GitHub Actions-based deployment, including support for subpath hosting (e.g., `https://username.github.io/repo-name/`).

1. Ensure your Vite `base` is set correctly (this is handled automatically by `BASE_URL` in the provided GitHub Actions workflow).
2. Push to the `main` branch.
3. The GitHub Actions workflow will automatically build the site, resolve all asset paths correctly, and deploy to GitHub Pages.

### Admin Panel in Production
By default, the production build **disables** the admin panel for security and to ensure a clean static output. This is controlled by the `VITE_DISABLE_ADMIN` environment variable.

If you explicitly want to include the admin panel in your production build (e.g., behind your own authentication proxy), you can override this:

```bash
VITE_DISABLE_ADMIN=false npm run build
```

### Local Image & Media Support
GemFolioCMS uses a subfolder-per-post structure to make media management easy.

1. When you create a new post with slug `my-post`, it lives at `./content/posts/my-post/index.md`.
2. Use the **MEDIA** button in the Admin Editor to upload files.
3. Files are saved to the post's subfolder and automatically inserted into your Markdown.
4. You can also manually place images in the subfolder and reference them: `![Alt Text](./my-image.png)`.
5. The development server and static generator will automatically resolve these paths, even when deployed to a subpath.

## 📚 Documentation

- [User Guide](USER_GUIDE.md): How to use the website and admin panel.
- [Contributing Guide](CONTRIBUTING.md): How to contribute to the project.

## 📄 License

MIT
