import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';
import { Feed } from 'feed';
import { DEFAULT_CONFIG } from '../src/constants';
import { parseContent } from '../src/utils/contentParser';

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

      const parsed = parseContent(file, content);
      results.push({
        slug,
        frontmatter: parsed.frontmatter,
        content: parsed.content,
        path: filePath
      });
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
    fs.cpSync(CONTENT_DIR, distContentDir, { 
      recursive: true,
      filter: (src, dest) => {
        const basename = path.basename(src);
        if (basename.startsWith('.')) return false;
        
        const stat = fs.statSync(src);
        if (stat.isDirectory()) return true;
        
        const ext = path.extname(src).toLowerCase();
        // Exclude markdown and other content files that are compiled into JSON
        if (['.md', '.adoc', '.rst'].includes(ext)) {
          return false;
        }
        return true;
      }
    });
  }

  // 3. Generate Config
  console.log('Generating site configuration...');
  let config = DEFAULT_CONFIG;
  if (fs.existsSync(CONFIG_FILE)) {
    config = { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) };
    console.log(`Loaded custom config from ${CONFIG_FILE}`);
  }
  fs.writeFileSync(path.join(apiDir, 'config.json'), JSON.stringify(config));
  console.log('Config generated successfully.');

  // 3.5 Copy Favicon to root for better compatibility
  if (config.favicon && config.favicon.startsWith('/content/')) {
    const faviconRelPath = config.favicon.replace(/^\/content\//, '');
    const faviconSrc = path.join(CONTENT_DIR, faviconRelPath);
    if (fs.existsSync(faviconSrc)) {
      console.log(`Copying favicon from ${faviconSrc} to root...`);
      fs.copyFileSync(faviconSrc, path.join(DIST_DIR, 'favicon.ico'));
    }
  }

  // 3. Generate Posts
  console.log('Processing blog posts...');
  const allPosts = readContent(POSTS_DIR);
  const posts = allPosts.filter(p => p.frontmatter && (p.frontmatter as any).title && !(p.frontmatter as any).draft);
  console.log(`Found ${posts.length} active posts.`);
  posts.sort((a, b) => {
    const dateA = new Date((a.frontmatter as any).date || 0).getTime();
    const dateB = new Date((b.frontmatter as any).date || 0).getTime();
    return dateB - dateA;
  });
  const postsForList = posts.map(({ path, content, ...rest }) => rest);
  fs.writeFileSync(path.join(apiDir, 'posts.json'), JSON.stringify(postsForList));

  // Write individual posts
  posts.forEach(post => {
    const postPath = path.join(apiDir, 'posts', `${post.slug}.json`);
    const postDir = path.dirname(postPath);
    if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
    const { path: _, ...postData } = post;
    fs.writeFileSync(postPath, JSON.stringify(postData));
    console.log(`Generated post: ${post.slug}`);
  });

  // 4. Generate Pages
  console.log('Processing standalone pages...');
  const allPages = readContent(PAGES_DIR);
  const pages = allPages.filter(p => p.frontmatter && (p.frontmatter as any).title && !(p.frontmatter as any).draft);
  console.log(`Found ${pages.length} active pages.`);
  const pagesForList = pages.map(({ path, content, ...rest }) => rest);
  fs.writeFileSync(path.join(apiDir, 'pages.json'), JSON.stringify(pagesForList));

  // Write individual pages
  pages.forEach(page => {
    const pagePath = path.join(apiDir, 'pages', `${page.slug}.json`);
    const pageDir = path.dirname(pagePath);
    if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
    const { path: _, ...pageData } = page;
    fs.writeFileSync(pagePath, JSON.stringify(pageData));
    console.log(`Generated page: ${page.slug}`);
  });

  // 5. Generate RSS
  console.log('Generating RSS feed...');
  const siteUrl = process.env.SITE_URL || 'https://ais-pre-2ub25xtho557ltxwu2ba2q-26762680254.us-east1.run.app'; // Fallback
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
      name: config.author || 'GemBrutalCMS',
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
          name: config.author || 'GemBrutalCMS',
          link: siteUrl,
        },
      ],
      date: new Date(fm.date || Date.now()),
      image: fm.image,
    });
  });
  fs.writeFileSync(path.join(DIST_DIR, 'rss.xml'), feed.atom1());

  // 6. Generate Route Structure (Copy index.html)
  console.log('Generating static route structure...');
  let indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
  
  // Inject default site title and description into the base index.html
  indexHtml = indexHtml.replace(
    /<title>.*?<\/title>/,
    `<title>${config.siteName}</title>`
  );
  
  if (!indexHtml.includes('name="description"')) {
    indexHtml = indexHtml.replace(
      '</head>',
      `  <meta name="description" content="${config.heroDescription}" />\n  <meta name="author" content="${config.author}" />\n  </head>`
    );
  } else {
    indexHtml = indexHtml.replace(
      '</head>',
      `  <meta name="author" content="${config.author}" />\n  </head>`
    );
    indexHtml = indexHtml.replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${config.heroDescription}" />`
    );
  }

  // Update the main index.html in dist
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);

  interface RouteConfig {
    path: string;
    title: string;
    description?: string;
  }

  const routes: RouteConfig[] = [
    { path: '/blog', title: `Blog | ${config.siteName}` },
    { path: '/profile', title: `Profile | ${config.siteName}` },
    ...(process.env.VITE_DISABLE_ADMIN === 'false' ? [{ path: '/admin', title: `Admin | ${config.siteName}` }] : []),
    ...posts.map(p => ({ 
      path: `/blog/${p.slug}`, 
      title: `${(p.frontmatter as any).title} | ${config.siteName}`,
      description: (p.frontmatter as any).description 
    })),
    ...pages.map(p => ({ 
      path: `/p/${p.slug}`, 
      title: `${(p.frontmatter as any).title} | ${config.siteName}`,
      description: (p.frontmatter as any).description
    }))
  ];

  routes.forEach(route => {
    const routeDir = path.join(DIST_DIR, route.path);
    if (!fs.existsSync(routeDir)) fs.mkdirSync(routeDir, { recursive: true });
    
    let routeHtml = indexHtml.replace(
      /<title>.*?<\/title>/,
      `<title>${route.title}</title>`
    );

    if (route.description) {
      routeHtml = routeHtml.replace(
        /<meta name="description" content=".*?" \/>/,
        `<meta name="description" content="${route.description}" />`
      );
    }

    fs.writeFileSync(path.join(routeDir, 'index.html'), routeHtml);
    console.log(`Created static route: ${route.path}`);
  });

  // 7. Generate StaticMCP
  console.log('Generating StaticMCP files...');
  const mcpDir = DIST_DIR;
  const mcpResourcesDir = path.join(mcpDir, 'resources');
  const mcpToolsDir = path.join(mcpDir, 'tools');
  
  if (!fs.existsSync(mcpResourcesDir)) fs.mkdirSync(mcpResourcesDir, { recursive: true });
  if (!fs.existsSync(mcpToolsDir)) fs.mkdirSync(mcpToolsDir, { recursive: true });

  function encodeStaticMcpFilename(title: string): string {
    const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const safe = normalized.toLowerCase().replace(/[^a-z0-9\-_]/g, '_').replace(/\s+/g, '_');
    if (safe.length <= 200) return safe;
    const hash = crypto.createHash('md5').update(title).digest('hex').substring(0, 16);
    return safe.substring(0, 183) + '_' + hash;
  }

  const mcpResources: any[] = [];
  
  // Add posts as resources
  posts.forEach(post => {
    const uri = `blog://${post.slug}`;
    const uriPath = uri.split('://')[1];
    const parts = uriPath.split('/');
    const encodedParts = parts.map(encodeStaticMcpFilename);
    const encodedPath = encodedParts.join('/');
    
    const resourcePath = path.join(mcpResourcesDir, `${encodedPath}.json`);
    const resourceDir = path.dirname(resourcePath);
    if (!fs.existsSync(resourceDir)) fs.mkdirSync(resourceDir, { recursive: true });
    
    mcpResources.push({
      uri,
      name: (post.frontmatter as any).title || post.slug,
      description: (post.frontmatter as any).description || `Blog post: ${(post.frontmatter as any).title}`,
      mimeType: "text/markdown"
    });
    
    fs.writeFileSync(resourcePath, JSON.stringify({
      uri,
      mimeType: "text/markdown",
      text: post.content
    }, null, 2));
  });

  // Add pages as resources
  pages.forEach(page => {
    const uri = `page://${page.slug}`;
    const uriPath = uri.split('://')[1];
    const parts = uriPath.split('/');
    const encodedParts = parts.map(encodeStaticMcpFilename);
    const encodedPath = encodedParts.join('/');
    
    const resourcePath = path.join(mcpResourcesDir, `${encodedPath}.json`);
    const resourceDir = path.dirname(resourcePath);
    if (!fs.existsSync(resourceDir)) fs.mkdirSync(resourceDir, { recursive: true });
    
    mcpResources.push({
      uri,
      name: (page.frontmatter as any).title || page.slug,
      description: (page.frontmatter as any).description || `Page: ${(page.frontmatter as any).title}`,
      mimeType: "text/markdown"
    });
    
    fs.writeFileSync(resourcePath, JSON.stringify({
      uri,
      mimeType: "text/markdown",
      text: page.content
    }, null, 2));
  });

  const mcpTools = [
    {
      name: "get_post",
      description: "Get the content of a specific blog post by slug",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string", description: "The slug of the post (e.g. 'welcome')" }
        },
        required: ["slug"]
      }
    },
    {
      name: "list_posts",
      description: "List all available blog posts",
      inputSchema: {
        type: "object",
        properties: {
          category: { type: "string", description: "Category to list, usually 'all'" }
        },
        required: ["category"]
      }
    }
  ];

  // Generate tool responses
  const getPostToolDir = path.join(mcpToolsDir, 'get_post');
  if (!fs.existsSync(getPostToolDir)) fs.mkdirSync(getPostToolDir, { recursive: true });
  
  posts.forEach(post => {
    const encodedSlug = encodeStaticMcpFilename(post.slug);
    const toolResponsePath = path.join(getPostToolDir, `${encodedSlug}.json`);
    fs.writeFileSync(toolResponsePath, JSON.stringify({
      content: [
        {
          type: "text",
          text: post.content
        }
      ]
    }, null, 2));
  });

  const listPostsToolDir = path.join(mcpToolsDir, 'list_posts');
  if (!fs.existsSync(listPostsToolDir)) fs.mkdirSync(listPostsToolDir, { recursive: true });
  
  const allPostsList = posts.map(p => ({
    slug: p.slug,
    title: (p.frontmatter as any).title,
    description: (p.frontmatter as any).description
  }));
  
  fs.writeFileSync(path.join(listPostsToolDir, 'all.json'), JSON.stringify({
    content: [
      {
        type: "text",
        text: JSON.stringify(allPostsList, null, 2)
      }
    ]
  }, null, 2));

  // Write mcp.json
  const mcpManifest = {
    protocolVersion: new Date().toISOString().split('T')[0],
    serverInfo: {
      name: config.siteName || "StaticMCP Server",
      version: "1.0.0"
    },
    capabilities: {
      resources: mcpResources,
      tools: mcpTools
    }
  };
  
  fs.writeFileSync(path.join(mcpDir, 'mcp.json'), JSON.stringify(mcpManifest, null, 2));

  console.log('Static generation complete!');
}

generate().catch(console.error);
