import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Feed } from 'feed';

const DIST_DIR = path.join(process.cwd(), 'dist');
const CONTENT_DIR = path.join(process.cwd(), 'content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const PAGES_DIR = path.join(CONTENT_DIR, 'pages');
const CONFIG_FILE = path.join(process.cwd(), 'site-config.json');

const DEFAULT_CONFIG = {
  siteName: "GemBrutalCMS",
  footerText: "Constructed in the void",
  heroTitle: "REALITY\nIS\nOPTIONAL",
  heroDescription: "A static-site generator for the end of the world. Markdown-based, brutalist, and unapologetically loud."
};

const readContent = (dir: string) => {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(file => file.endsWith('.md') || file.endsWith('.adoc') || file.endsWith('.rst'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    if (file.endsWith('.md')) {
      const { data, content: body } = matter(content);
      return {
        slug: file.replace('.md', ''),
        frontmatter: data,
        content: body
      };
    } else {
      return {
        slug: file.replace(/\.(adoc|rst)$/, ''),
        frontmatter: {},
        content: content
      };
    }
  });
};

async function generate() {
  console.log('Starting static generation...');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('Dist directory does not exist. Run vite build first.');
    process.exit(1);
  }

  // 1. Create API directory
  const apiDir = path.join(DIST_DIR, 'api');
  if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });

  // 2. Generate Config
  let config = DEFAULT_CONFIG;
  if (fs.existsSync(CONFIG_FILE)) {
    config = { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) };
  }
  fs.writeFileSync(path.join(apiDir, 'config'), JSON.stringify(config));

  // 3. Generate Posts
  const posts = readContent(POSTS_DIR);
  posts.sort((a, b) => {
    const dateA = new Date((a.frontmatter as any).date || 0).getTime();
    const dateB = new Date((b.frontmatter as any).date || 0).getTime();
    return dateB - dateA;
  });
  fs.writeFileSync(path.join(apiDir, 'posts'), JSON.stringify(posts));

  // 4. Generate Pages
  const pages = readContent(PAGES_DIR);
  fs.writeFileSync(path.join(apiDir, 'pages'), JSON.stringify(pages));

  // 5. Generate RSS
  const siteUrl = 'https://ais-pre-2ub25xtho557ltxwu2ba2q-26762680254.us-east1.run.app'; // Fallback
  const feed = new Feed({
    title: config.siteName,
    description: config.heroDescription,
    id: siteUrl,
    link: siteUrl,
    language: 'en',
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    author: { name: 'GemBrutalCMS' },
  });

  posts.forEach(post => {
    const fm = post.frontmatter as any;
    feed.addItem({
      title: fm.title || post.slug,
      id: `${siteUrl}/blog/${post.slug}`,
      link: `${siteUrl}/blog/${post.slug}`,
      description: fm.description || post.content.substring(0, 200),
      content: post.content,
      date: new Date(fm.date || new Date()),
    });
  });
  fs.writeFileSync(path.join(DIST_DIR, 'rss.xml'), feed.atom1());

  // 6. Generate Route Structure (Copy index.html)
  const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');

  const routes = [
    '/blog',
    '/profile',
    '/admin',
    ...posts.map(p => `/blog/${p.slug}`),
    ...pages.map(p => `/p/${p.slug}`)
  ];

  routes.forEach(route => {
    const routeDir = path.join(DIST_DIR, route);
    if (!fs.existsSync(routeDir)) fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtml);
  });

  console.log('Static generation complete!');
}

generate().catch(console.error);
