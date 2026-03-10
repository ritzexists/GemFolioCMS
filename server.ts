import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import TurndownService from 'turndown';
import * as cheerio from 'cheerio';
import { Feed } from 'feed';
import { DEFAULT_CONFIG } from './src/constants';

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Ensure content directories exist
const CONTENT_DIR = path.join(process.cwd(), 'content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const PAGES_DIR = path.join(CONTENT_DIR, 'pages');
const CONFIG_FILE = path.join(process.cwd(), 'site-config.json');

// Serve content directory as static files
// This allows referencing local images in markdown via /content/path/to/image
app.use('/content', express.static(CONTENT_DIR));

[CONTENT_DIR, POSTS_DIR, PAGES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Helper function to recursively read content files from a directory.
 * It parses Markdown files with frontmatter and returns an array of content objects.
 * 
 * @param dir - The directory to read from.
 * @param baseDir - The base directory to calculate relative paths for slugs.
 * @returns Array of content objects containing slug, frontmatter, content, and file path.
 */
const readContent = (dir: string, baseDir: string = dir) => {
  let results: any[] = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      results = results.concat(readContent(filePath, baseDir));
    } else if (file.endsWith('.md') || file.endsWith('.adoc') || file.endsWith('.rst')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(baseDir, filePath);
      
      // Slug logic: 
      // 1. If file is named same as parent folder (e.g. hubs/hubs.md), slug is parent folder
      // 2. If file is named index.md, slug is parent folder
      // 3. Otherwise, slug is the relative path without extension
      let slug = relativePath.replace(/\.(md|adoc|rst)$/, '');
      const parts = slug.split(path.sep);
      if (parts.length > 1) {
        const fileName = parts[parts.length - 1];
        const parentDir = parts[parts.length - 2];
        if (fileName === parentDir || fileName === 'index') {
          slug = parts.slice(0, -1).join('/');
        }
      }
      // Ensure forward slashes for slugs
      slug = slug.replace(/\\/g, '/');

      if (file.endsWith('.md')) {
        const { data, content: body } = matter(content);
        results.push({
          slug,
          frontmatter: data || {},
          content: body,
          path: filePath
        });
      } else {
        results.push({
          slug,
          frontmatter: {}, 
          content: content,
          path: filePath
        });
      }
    }
  });
  
  return results;
};

// ============================================================================
// API Routes
// Note: All API routes use the .json extension to match the static file 
// generation output, preventing conflicts between files and directories.
// ============================================================================

/**
 * GET /api/config.json
 * Retrieves the site configuration. Merges user config with defaults.
 */
app.get('/api/config.json', (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      res.json({ ...DEFAULT_CONFIG, ...config });
    } else {
      res.json(DEFAULT_CONFIG);
    }
  } catch (error) {
    console.error('Error reading config:', error);
    res.json(DEFAULT_CONFIG);
  }
});

/**
 * POST /api/config.json
 * Updates the site configuration and saves it to site-config.json.
 * Requires admin access.
 */
app.post('/api/config.json', (req, res) => {
  if (process.env.DISABLE_ADMIN === 'true') {
    return res.status(403).json({ error: 'Admin dashboard is disabled' });
  }

  try {
    const newConfig = req.body;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    res.json({ success: true, config: newConfig });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ error: 'Failed to save config' });
  }
});

/**
 * GET /api/posts.json
 * Retrieves all blog posts, sorted by date in descending order.
 */
app.get('/api/posts.json', (req, res) => {
  try {
    const posts = readContent(POSTS_DIR)
      .filter(p => p.frontmatter && (p.frontmatter as any).title)
      .map(({ path, ...rest }) => rest);
    // Sort by date desc
    posts.sort((a, b) => {
      const dateA = new Date((a.frontmatter as any).date || 0).getTime();
      const dateB = new Date((b.frontmatter as any).date || 0).getTime();
      return dateB - dateA;
    });
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * GET /rss.xml
 * Generates an Atom feed for all blog posts.
 */
app.get('/rss.xml', (req, res) => {
  try {
    const posts = readContent(POSTS_DIR).filter(p => p.frontmatter && (p.frontmatter as any).title);
    posts.sort((a, b) => {
      const dateA = new Date((a.frontmatter as any).date || 0).getTime();
      const dateB = new Date((b.frontmatter as any).date || 0).getTime();
      return dateB - dateA;
    });

    const siteUrl = `${req.protocol}://${req.get('host')}`;
    
    const feed = new Feed({
      title: 'Blog Posts',
      description: 'Latest posts from our blog',
      id: siteUrl,
      link: siteUrl,
      language: 'en',
      favicon: `${siteUrl}/favicon.ico`,
      copyright: `All rights reserved ${new Date().getFullYear()}`,
      feedLinks: {
        rss: `${siteUrl}/rss.xml`,
        atom: `${siteUrl}/atom.xml`,
      },
      author: {
        name: 'GemBrutalCMS',
        link: siteUrl,
      },
    });

    posts.forEach(post => {
      const frontmatter = post.frontmatter as any;
      feed.addItem({
        title: frontmatter.title || post.slug,
        id: `${siteUrl}/blog/${post.slug}`,
        link: `${siteUrl}/blog/${post.slug}`,
        description: frontmatter.description || post.content.substring(0, 200) + '...',
        content: post.content,
        author: [
          {
            name: 'GemBrutalCMS',
            link: siteUrl,
          },
        ],
        date: new Date(frontmatter.date || Date.now()),
        image: frontmatter.image,
      });
    });

    // We serve Atom by default for better compatibility as requested
    res.set('Content-Type', 'application/atom+xml');
    res.send(feed.atom1());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate feed' });
  }
});

/**
 * GET /api/posts/:slug(*).json
 * Retrieves a single blog post by its slug.
 * Supports different file structures (e.g., slug.md, slug/slug.md, slug/index.md).
 */
app.get('/api/posts/:slug(*).json', (req, res) => {
  try {
    const { slug } = req.params;
    // Try different paths:
    // 1. slug.md
    // 2. slug/slug.md
    // 3. slug/index.md
    const possiblePaths = [
      path.join(POSTS_DIR, `${slug}.md`),
      path.join(POSTS_DIR, slug, `${path.basename(slug)}.md`),
      path.join(POSTS_DIR, slug, 'index.md')
    ];
    
    let filePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    res.json({ slug, frontmatter: data, content: body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

/**
 * GET /api/pages.json
 * Retrieves all standalone pages.
 */
app.get('/api/pages.json', (req, res) => {
  try {
    const pages = readContent(PAGES_DIR).map(({ path, ...rest }) => rest);
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

/**
 * GET /api/pages/:slug(*).json
 * Retrieves a single standalone page by its slug.
 */
app.get('/api/pages/:slug(*).json', (req, res) => {
  try {
    const { slug } = req.params;
    // Try different paths:
    // 1. slug.md
    // 2. slug/slug.md
    // 3. slug/index.md
    const possiblePaths = [
      path.join(PAGES_DIR, `${slug}.md`),
      path.join(PAGES_DIR, slug, `${path.basename(slug)}.md`),
      path.join(PAGES_DIR, slug, 'index.md')
    ];
    
    let filePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({ error: 'Page not found' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    res.json({ slug, frontmatter: data, content: body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

/**
 * POST /api/content.json
 * Saves a new or updated post/page. Handles file creation and renaming.
 * Requires admin access.
 */
app.post('/api/content.json', (req, res) => {
  // Check if admin is disabled via env var (simulated config)
  if (process.env.DISABLE_ADMIN === 'true') {
    return res.status(403).json({ error: 'Admin dashboard is disabled' });
  }

  try {
    const { type, slug, frontmatter, content, originalSlug } = req.body;
    const dir = type === 'page' ? PAGES_DIR : POSTS_DIR;
    
    // Helper to find the file path for a slug
    const findFilePath = (s: string) => {
      const possiblePaths = [
        path.join(dir, `${s}.md`),
        path.join(dir, s, `${path.basename(s)}.md`),
        path.join(dir, s, 'index.md')
      ];
      return possiblePaths.find(p => fs.existsSync(p));
    };

    // If slug changed, delete old file
    if (originalSlug && originalSlug !== slug) {
      const oldPath = findFilePath(originalSlug);
      if (oldPath && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Determine where to save
    let filePath = findFilePath(slug);
    if (!filePath) {
      // If it doesn't exist, default to slug.md at the top level of the dir
      // unless the slug contains slashes, then we might need to create dirs
      filePath = path.join(dir, `${slug}.md`);
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
    }

    const fileContent = matter.stringify(content, frontmatter);
    fs.writeFileSync(filePath, fileContent);
    res.json({ success: true, slug });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

/**
 * DELETE /api/content/:type/:slug(*).json
 * Deletes a specific post or page.
 * Requires admin access.
 */
app.delete('/api/content/:type/:slug(*).json', async (req, res) => {
  if (process.env.DISABLE_ADMIN === 'true') {
    return res.status(403).json({ error: 'Admin dashboard is disabled' });
  }

  try {
    const { type, slug } = req.params;
    console.log(`[DELETE] Request received for type: ${type}, slug: ${slug}`);
    
    const dir = type === 'page' ? PAGES_DIR : POSTS_DIR;
    
    const possiblePaths = [
      path.join(dir, `${slug}.md`),
      path.join(dir, slug, `${path.basename(slug)}.md`),
      path.join(dir, slug, 'index.md')
    ];
    
    const filePath = possiblePaths.find(p => fs.existsSync(p));

    if (!filePath) {
      console.log(`[DELETE] File not found for slug: ${slug}`);
      return res.status(404).json({ error: 'File not found' });
    }

    console.log(`[DELETE] Attempting to delete file: ${filePath}`);
    await fs.promises.unlink(filePath);
    console.log(`[DELETE] Successfully deleted: ${filePath}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

/**
 * POST /api/import.json
 * Imports content from an external URL, parses the HTML, and converts it to Markdown.
 * Requires admin access.
 */
app.post('/api/import.json', async (req, res) => {
   if (process.env.DISABLE_ADMIN === 'true') {
    return res.status(403).json({ error: 'Admin dashboard is disabled' });
  }

  try {
    const { url } = req.body;
    const response = await fetch(url);
    const html = await response.text();
    
    const $ = cheerio.load(html);
    
    // Extract Metadata
    const title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'Imported Article';
    
    const description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || '';
                        
    // Extract Tags
    let tags: string[] = [];
    const keywords = $('meta[name="keywords"]').attr('content');
    if (keywords) {
      tags = keywords.split(',').map(t => t.trim());
    }
    
    // Also check article:tag
    $('meta[property="article:tag"]').each((i, el) => {
      const tag = $(el).attr('content');
      if (tag && !tags.includes(tag)) tags.push(tag);
    });

    // Resolve relative URLs for images and links
    $('[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        try {
          $(el).attr('src', new URL(src, url).href);
        } catch (e) {}
      }
    });
    
    $('[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          $(el).attr('href', new URL(href, url).href);
        } catch (e) {}
      }
    });
    
    // Remove scripts, styles, etc.
    $('script').remove();
    $('style').remove();
    $('nav').remove();
    $('footer').remove();
    $('header').remove();
    $('iframe').remove();
    $('noscript').remove();
    
    // Try to find main content
    // Prioritize semantic tags, then common class names
    let contentHtml = '';
    const selectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      'body'
    ];
    
    for (const selector of selectors) {
      if ($(selector).length > 0) {
        contentHtml = $(selector).html() || '';
        break;
      }
    }
    
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*'
    });
    
    // Add rule to keep images
    turndownService.addRule('images', {
      filter: 'img',
      replacement: function (content, node) {
        const alt = (node as HTMLElement).getAttribute('alt') || '';
        const src = (node as HTMLElement).getAttribute('src') || '';
        const title = (node as HTMLElement).getAttribute('title') || '';
        return src ? `![${alt}](${src}${title ? ` "${title}"` : ''})` : '';
      }
    });

    // Add rule for code blocks to ensure language detection if possible
    turndownService.addRule('codeBlocks', {
      filter: ['pre'],
      replacement: function (content, node) {
        const codeElement = (node as HTMLElement).querySelector('code');
        let language = '';
        
        if (codeElement) {
          const className = codeElement.getAttribute('class') || '';
          const match = className.match(/language-(\w+)/);
          if (match) {
            language = match[1];
          }
        }
        
        return '\n\n```' + language + '\n' + (codeElement ? codeElement.textContent : node.textContent) + '\n```\n\n';
      }
    });

    const markdown = turndownService.turndown(contentHtml);
    
    res.json({ 
      title,
      description,
      tags,
      content: markdown 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to import URL' });
  }
});


// Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
