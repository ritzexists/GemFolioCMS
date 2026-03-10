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

// Helper to read content
// Supports .md, .adoc, and .rst files.
const readContent = (dir: string) => {
  const files = fs.readdirSync(dir).filter(file => file.endsWith('.md') || file.endsWith('.adoc') || file.endsWith('.rst'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    
    if (file.endsWith('.md')) {
      const { data, content: body } = matter(content);
      return {
        slug: file.replace('.md', ''),
        frontmatter: data,
        content: body,
        path: path.join(dir, file)
      };
    } else {
      // TODO: Implement frontmatter parsing for AsciiDoc and reStructuredText
      return {
        slug: file.replace(/\.(adoc|rst)$/, ''),
        frontmatter: {}, 
        content: content,
        path: path.join(dir, file)
      };
    }
  });
};

// API Routes

// Get Site Config
app.get('/api/config', (req, res) => {
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

// Update Site Config
app.post('/api/config', (req, res) => {
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

// Get all posts
app.get('/api/posts', (req, res) => {
  try {
    const posts = readContent(POSTS_DIR);
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

// RSS/Atom Feed
app.get('/rss.xml', (req, res) => {
  try {
    const posts = readContent(POSTS_DIR);
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

// Get single post
app.get('/api/posts/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const filePath = path.join(POSTS_DIR, `${path.basename(slug)}.md`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    res.json({ slug, frontmatter: data, content: body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Get all pages
app.get('/api/pages', (req, res) => {
  try {
    const pages = readContent(PAGES_DIR);
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// Get single page
app.get('/api/pages/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const filePath = path.join(PAGES_DIR, `${path.basename(slug)}.md`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Page not found' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data, content: body } = matter(content);
    res.json({ slug, frontmatter: data, content: body });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// Save post/page (Admin)
app.post('/api/content', (req, res) => {
  // Check if admin is disabled via env var (simulated config)
  if (process.env.DISABLE_ADMIN === 'true') {
    return res.status(403).json({ error: 'Admin dashboard is disabled' });
  }

  try {
    const { type, slug, frontmatter, content, originalSlug } = req.body;
    const dir = type === 'page' ? PAGES_DIR : POSTS_DIR;
    
    // If slug changed, delete old file
    if (originalSlug && originalSlug !== slug) {
      const oldPath = path.join(dir, `${originalSlug}.md`);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const filePath = path.join(dir, `${path.basename(slug)}.md`);
    const fileContent = matter.stringify(content, frontmatter);
    
    fs.writeFileSync(filePath, fileContent);
    res.json({ success: true, slug });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Delete post/page (Admin)
app.delete('/api/content/:type/:slug', async (req, res) => {
  if (process.env.DISABLE_ADMIN === 'true') {
    return res.status(403).json({ error: 'Admin dashboard is disabled' });
  }

  try {
    const { type, slug } = req.params;
    console.log(`[DELETE] Request received for type: ${type}, slug: ${slug}`);
    
    const dir = type === 'page' ? PAGES_DIR : POSTS_DIR;
    const filePath = path.join(dir, `${path.basename(slug)}.md`);
    console.log(`[DELETE] Attempting to delete file: ${filePath}`);

    try {
      await fs.promises.access(filePath);
      await fs.promises.unlink(filePath);
      console.log(`[DELETE] Successfully deleted: ${filePath}`);
      res.json({ success: true });
    } catch (err: any) {
      console.error(`[DELETE] Error deleting file: ${err.message}`);
      if (err.code === 'ENOENT') {
        res.status(404).json({ error: 'File not found' });
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Import external URL
app.post('/api/import', async (req, res) => {
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
