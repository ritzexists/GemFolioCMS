import matter from 'gray-matter';
import asciidoctor from 'asciidoctor';
import rst2html from 'rst2html';
import TurndownService from 'turndown';

const adoc = asciidoctor();

export const turndownService = new TurndownService({
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

// Add rule for RST directives (like code-block)
turndownService.addRule('rstDirectives', {
  filter: function (node) {
    return node.nodeName === 'DIV' && node.classList.contains('rst-directive');
  },
  replacement: function (content, node) {
    const text = node.textContent || '';
    // Basic heuristic: if it starts with a language name, extract it
    const match = text.match(/^([a-z0-9]+)([\s\S]*)$/i);
    if (match) {
      return '\n\n```' + match[1] + '\n' + match[2].trim() + '\n```\n\n';
    }
    return '\n\n```\n' + text.trim() + '\n```\n\n';
  }
});

/**
 * Parses a content file, extracting frontmatter and converting the body to Markdown.
 * Supports .md, .adoc, and .rst files.
 * 
 * @param file The filename (used to determine the extension)
 * @param rawContent The raw string content of the file
 * @returns An object containing the extracted frontmatter and the Markdown content
 */
export function parseContent(file: string, rawContent: string) {
  // Extract frontmatter using gray-matter (works for all text files with --- blocks)
  const { data, content: body } = matter(rawContent);
  let finalContent = body;

  try {
    if (file.endsWith('.adoc')) {
      const html = adoc.convert(body, { attributes: { showtitle: true } });
      finalContent = turndownService.turndown(html as string);
    } else if (file.endsWith('.rst')) {
      const html = rst2html(body);
      finalContent = turndownService.turndown(html as string);
    }
  } catch (error) {
    console.error(`Error parsing file ${file}:`, error);
    // Fallback to raw body if parsing fails
  }

  return {
    frontmatter: data || {},
    content: finalContent
  };
}
