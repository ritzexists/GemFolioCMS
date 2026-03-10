import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Feed } from 'feed';
import { DEFAULT_CONFIG } from '../src/constants';

const DIST_DIR = path.join(process.cwd(), 'dist');
const CONTENT_DIR = path.join(process.cwd(), 'content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const PAGES_DIR = path.join(CONTENT_DIR, 'pages');
const CONFIG_FILE = path.join(process.cwd(), 'site-config.json');

const readContent = (dir: string, baseDir: string = dir) => {
  let results: any[] = [];
  if (!fs.existsSync(dir)) return results;
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
        if (data && Object.keys(data).length > 0) {
          results.push({
            slug,
            frontmatter: data,
            content: body,
            path: filePath
          });
        }
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

async function generate() {
  console.log('Starting static generation...');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('Dist directory does not exist. Run vite build first.');
    process.exit(1);
  }

  // 1. Create API directory
  const apiDir = path.join(DIST_DIR, 'api');
  if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });

  // 2. Copy Content Directory (for images)
  // This ensures that local images referenced in markdown are available in the static build
  const distContentDir = path.join(DIST_DIR, 'content');
  if (fs.existsSync(CONTENT_DIR)) {
    console.log('Copying content directory to dist...');
    fs.cpSync(CONTENT_DIR, distContentDir, { recursive: true });
  }

  // 3. Generate Config
  let config = DEFAULT_CONFIG;
  if (fs.existsSync(CONFIG_FILE)) {
    config = { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) };
  }
  fs.writeFileSync(path.join(apiDir, 'config.json'), JSON.stringify(config));

  // 3. Generate Posts
  const posts = readContent(POSTS_DIR).filter(p => p.frontmatter && (p.frontmatter as any).title);
  posts.sort((a, b) => {
    const dateA = new Date((a.frontmatter as any).date || 0).getTime();
    const dateB = new Date((b.frontmatter as any).date || 0).getTime();
    return dateB - dateA;
  });
  fs.writeFileSync(path.join(apiDir, 'posts.json'), JSON.stringify(posts));

  // Write individual posts
  posts.forEach(post => {
    const postPath = path.join(apiDir, 'posts', `${post.slug}.json`);
    const postDir = path.dirname(postPath);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
    fs.writeFileSync(postPath, JSON.stringify(post));
  });

  // 4. Generate Pages
  const pages = readContent(PAGES_DIR);
  fs.writeFileSync(path.join(apiDir, 'pages.json'), JSON.stringify(pages));

  // Write individual pages
  pages.forEach(page => {
    const pagePath = path.join(apiDir, 'pages', `${page.slug}.json`);
    const pageDir = path.dirname(pagePath);
    if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(pagePath, JSON.stringify(page));
  });

  // 5. Generate RSS
  const siteUrl = 'https://ais-pre-2ub25xtho557ltxwu2ba2q-26762680254.us-east1.run.app'; // Fallback
  const feed = new Feed({
    title: config.siteName || 'Blog Posts',
    description: config.heroDescription || 'Latest posts from our blog',
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
    const fm = post.frontmatter as any;
    feed.addItem({
      title: fm.title || post.slug,
      id: `${siteUrl}/blog/${post.slug}`,
      link: `${siteUrl}/blog/${post.slug}`,
      description: fm.description || post.content.substring(0, 200) + '...',
      content: post.content,
      author: [
        {
          name: 'GemBrutalCMS',
          link: siteUrl,
        },
      ],
      date: new Date(fm.date || Date.now()),
      image: fm.image,
    });
  });
  fs.writeFileSync(path.join(DIST_DIR, 'rss.xml'), feed.atom1());

  // 6. Generate Route Structure (Copy index.html)
  const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');

  const routes = [
    '/blog',
    '/profile',
    ...(process.env.VITE_DISABLE_ADMIN === 'true' ? [] : ['/admin']),
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
