import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Plus, Trash, RefreshCw, Eye, Edit, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useSiteConfig } from '@/context/SiteConfigContext';
import { logger } from '@/lib/logger';

interface ContentItem {
  slug: string;
  frontmatter: any;
  content: string;
  path?: string;
}

/**
 * Admin Dashboard Component
 * 
 * Provides a comprehensive interface for managing site content and configuration.
 * 
 * Features:
 * - Create, edit, and delete blog posts and pages
 * - Real-time markdown preview with syntax highlighting
 * - Site-wide configuration settings (title, footer, etc.)
 * - Content import from external URLs
 * - Advanced JSON editor for frontmatter manipulation
 */
export default function Admin() {
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [pages, setPages] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [contentType, setContentType] = useState<'post' | 'page' | 'settings'>('post');
  const [message, setMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isJsonOpen, setIsJsonOpen] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  const { config, refreshConfig } = useSiteConfig();
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const { register: registerSettings, handleSubmit: handleSubmitSettings, setValue: setValueSettings } = useForm();

  /**
   * Fetches all posts and pages from the API.
   */
  const loadContent = () => {
    logger.debug('Loading admin content...');
    fetch('/api/posts').then(res => res.json()).then(setPosts);
    fetch('/api/pages').then(res => res.json()).then(setPages);
    setSelectedForDeletion(new Set());
  };

  useEffect(() => {
    loadContent();
  }, []);

  // Update settings form when config changes or when switching to settings tab
  useEffect(() => {
    if (contentType === 'settings') {
      setValueSettings('siteName', config.siteName);
      setValueSettings('footerText', config.footerText);
      setValueSettings('heroTitle', config.heroTitle);
      setValueSettings('heroDescription', config.heroDescription);
    }
  }, [config, contentType, setValueSettings]);

  const [jsonText, setJsonText] = useState("");

  // When selecting an item, populate form
  useEffect(() => {
    if (contentType === 'settings') return;

    if (selectedItem) {
      setValue('slug', selectedItem.slug);
      setValue('content', selectedItem.content);
      // Flatten frontmatter for form
      Object.entries(selectedItem.frontmatter).forEach(([key, val]) => {
        setValue(`frontmatter.${key}`, val);
      });
      setJsonText(JSON.stringify(selectedItem.frontmatter, null, 2));
    } else {
      reset();
      const initialDate = new Date().toISOString().split('T')[0];
      setValue('frontmatter.date', initialDate);
      setJsonText(JSON.stringify({ date: initialDate }, null, 2));
    }
  }, [selectedItem, setValue, reset, contentType]);

  // Update JSON text when frontmatter changes via other inputs
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // If a specific field changes (e.g. frontmatter.title), update the JSON view
      if (name && name.startsWith('frontmatter.') && name !== 'frontmatter') {
        const currentFrontmatter =  watch('frontmatter');
        setJsonText(JSON.stringify(currentFrontmatter, null, 2));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      setValue('frontmatter', parsed);
    } catch (err) {
      // Invalid JSON, don't update form yet
    }
  };

  /**
   * Handles saving a post or page.
   */
  const onSubmit = async (data: any) => {
    try {
      logger.info(`Saving content: ${data.slug}`);
      const payload = {
        type: contentType,
        slug: data.slug,
        originalSlug: selectedItem?.slug,
        content: data.content,
        frontmatter: {
          ...(selectedItem?.frontmatter || {}), // Preserve existing keys like 'layout' and 'items'
          ...data.frontmatter,
          // Ensure tags is array if string
          tags: typeof data.frontmatter.tags === 'string' 
            ? (data.frontmatter.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean)
            : data.frontmatter.tags
        }
      };

      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage("SAVED SUCCESSFULLY");
        loadContent();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("ERROR SAVING");
        logger.error("Failed to save content");
      }
    } catch (e) {
      setMessage("ERROR SAVING");
      logger.error("Exception saving content", e);
    }
  };

  /**
   * Handles saving site configuration settings.
   */
  const onSettingsSubmit = async (data: any) => {
    try {
      logger.info("Saving site settings");
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setMessage("SETTINGS SAVED");
        refreshConfig();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("ERROR SAVING SETTINGS");
      }
    } catch (e) {
      setMessage("ERROR SAVING SETTINGS");
      logger.error("Exception saving settings", e);
    }
  };

  const [importUrl, setImportUrl] = useState("");

  /**
   * Imports content from an external URL.
   * Parses the HTML to extract title, description, and content.
   */
  const handleImport = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    logger.info(`Importing content from ${importUrl}`);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      });
      const data = await res.json();
      
      if (data.content) {
        // Reset to new entry mode
        setSelectedItem(null);
        reset();
        
        // Populate with imported data
        setValue('content', data.content);
        setValue('frontmatter.title', data.title);
        
        if (data.description) {
          setValue('frontmatter.description', data.description);
        }
        
        if (data.tags && Array.isArray(data.tags)) {
          setValue('frontmatter.tags', data.tags.join(', '));
        }
        
        // Generate slug from title
        const slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        setValue('slug', slug);
        
        // Set date
        const today = new Date().toISOString().split('T')[0];
        setValue('frontmatter.date', today);
        
        // Update JSON view
        setJsonText(JSON.stringify({ 
          title: data.title, 
          date: today,
          description: data.description || '',
          tags: data.tags || []
        }, null, 2));

        setMessage("IMPORTED SUCCESSFULLY");
        setImportUrl("");
      }
    } catch (e) {
      setMessage("IMPORT FAILED");
      logger.error("Import failed", e);
    }
    setIsImporting(false);
  };

  /**
   * Deletes selected items.
   */
  const handleDelete = async () => {
    if (selectedForDeletion.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedForDeletion.size} items?`)) return;

    logger.info(`Deleting ${selectedForDeletion.size} items`);
    try {
      const deletePromises = Array.from(selectedForDeletion).map(slug => 
        fetch(`/api/content/${contentType}/${slug}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
      );

      await Promise.all(deletePromises);
      setMessage("DELETED SUCCESSFULLY");
      loadContent();
      setSelectedItem(null);
      reset();
    } catch (e) {
      setMessage("ERROR DELETING");
      logger.error("Delete failed", e);
    }
  };

  const toggleSelection = (slug: string) => {
    const newSelection = new Set(selectedForDeletion);
    if (newSelection.has(slug)) {
      newSelection.delete(slug);
    } else {
      newSelection.add(slug);
    }
    setSelectedForDeletion(newSelection);
  };

  const currentContent = watch('content');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">
      {/* Sidebar List */}
      <div className="lg:col-span-3 neobrutal-box p-4 overflow-y-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neon-pink">CONTENT</h2>
          <div className="flex gap-2">
            {selectedForDeletion.size > 0 && contentType !== 'settings' && (
              <button 
                onClick={handleDelete}
                className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                title="Delete Selected"
              >
                <Trash size={16} />
              </button>
            )}
            {contentType !== 'settings' && (
              <button 
                onClick={() => { setSelectedItem(null); reset(); }}
                className="bg-neon-green text-void p-1 rounded hover:bg-white transition-colors"
                title="New Entry"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {contentType !== 'settings' && (
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Search content..." 
              className="w-full bg-black/30 border border-white/20 p-2 text-sm text-white focus:border-neon-pink outline-none placeholder:text-white/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => { setContentType('post'); setSelectedForDeletion(new Set()); }}
            className={cn("flex-1 text-xs font-bold py-1 border border-white/20", contentType === 'post' && "bg-neon-pink text-void border-neon-pink")}
          >
            POSTS
          </button>
          <button 
            onClick={() => { setContentType('page'); setSelectedForDeletion(new Set()); }}
            className={cn("flex-1 text-xs font-bold py-1 border border-white/20", contentType === 'page' && "bg-neon-pink text-void border-neon-pink")}
          >
            PAGES
          </button>
          <button 
            onClick={() => { setContentType('settings'); setSelectedItem(null); }}
            className={cn("flex-1 text-xs font-bold py-1 border border-white/20", contentType === 'settings' && "bg-neon-pink text-void border-neon-pink")}
          >
            <Settings size={14} className="mx-auto" />
          </button>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto">
          {contentType === 'settings' ? (
             <div className="text-sm text-white/50 p-2 text-center">
               Global site configuration
             </div>
          ) : (
            (contentType === 'post' ? posts : pages)
              .filter(item => 
                !searchQuery || 
                item.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.frontmatter.title && item.frontmatter.title.toLowerCase().includes(searchQuery.toLowerCase()))
              )
              .map(item => (
              <div 
                key={item.slug}
                className={cn(
                  "flex items-center gap-2 p-2 border border-white/10 hover:bg-white/5 text-sm",
                  selectedItem?.slug === item.slug && "border-neon-green text-neon-green bg-white/5"
                )}
              >
                <input 
                  type="checkbox"
                  checked={selectedForDeletion.has(item.slug)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelection(item.slug);
                  }}
                  className="accent-neon-pink w-4 h-4 cursor-pointer"
                />
                <div 
                  className="flex-1 truncate cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  {item.frontmatter.title || item.slug}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="lg:col-span-9 flex flex-col h-full">
        {contentType === 'settings' ? (
          <form onSubmit={handleSubmitSettings(onSettingsSubmit)} className="flex flex-col h-full gap-4">
             <div className="neobrutal-box p-4 flex justify-between items-center bg-void z-10 gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <span className="font-bold text-neon-green whitespace-nowrap">
                    SITE SETTINGS
                  </span>
                  {message && <span className="text-neon-pink animate-pulse text-sm whitespace-nowrap">[{message}]</span>}
                </div>
                <button type="submit" className="neobrutal-button text-xs py-1 flex items-center gap-2">
                  <Save size={14} />
                  SAVE SETTINGS
                </button>
             </div>

             <div className="neobrutal-box p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-neon-pink">Site Name</label>
                  <input {...registerSettings('siteName')} className="neobrutal-input w-full" />
                  <p className="text-xs text-white/50">Displayed in the header and browser title.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neon-pink">Footer Text</label>
                  <input {...registerSettings('footerText')} className="neobrutal-input w-full" />
                  <p className="text-xs text-white/50">Displayed at the bottom of every page.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neon-pink">Hero Title</label>
                  <textarea {...registerSettings('heroTitle')} className="neobrutal-input w-full h-24 font-mono" />
                  <p className="text-xs text-white/50">Main title on the homepage. Use newlines for line breaks.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neon-pink">Hero Description</label>
                  <textarea {...registerSettings('heroDescription')} className="neobrutal-input w-full h-24" />
                  <p className="text-xs text-white/50">Subtitle text on the homepage.</p>
                </div>
             </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full gap-4">
            {/* Toolbar */}
            <div className="neobrutal-box p-4 flex justify-between items-center bg-void z-10 gap-4">
              <div className="flex items-center gap-4 flex-1">
                <span className="font-bold text-neon-green whitespace-nowrap">
                  {selectedItem ? `EDITING: ${selectedItem.slug}` : 'NEW ENTRY'}
                </span>
                {message && <span className="text-neon-pink animate-pulse text-sm whitespace-nowrap">[{message}]</span>}
              </div>
              
              <div className="flex gap-2 items-center">
                <button 
                  type="button"
                  onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
                  className="neobrutal-button text-xs py-1 flex items-center gap-2"
                >
                  {viewMode === 'edit' ? <Eye size={14} /> : <Edit size={14} />}
                  {viewMode === 'edit' ? 'PREVIEW' : 'EDIT'}
                </button>
                
                <div className="flex items-center gap-1 border border-white/20 p-1">
                  <input 
                    type="text" 
                    placeholder="https://..." 
                    className="bg-transparent border-none outline-none text-xs w-32 md:w-48 px-1 text-white"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={handleImport}
                    className="bg-neon-pink text-void text-[10px] font-bold px-2 py-1 hover:bg-white transition-colors disabled:opacity-50"
                    disabled={isImporting || !importUrl}
                  >
                    {isImporting ? <RefreshCw size={12} className="animate-spin" /> : 'IMPORT'}
                  </button>
                </div>

                <button type="submit" className="neobrutal-button text-xs py-1 flex items-center gap-2">
                  <Save size={14} />
                  SAVE
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase">Slug</label>
                <input {...register('slug', { required: true })} className="neobrutal-input" placeholder="my-post-slug" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase">Title</label>
                <input {...register('frontmatter.title', { required: true })} className="neobrutal-input" placeholder="Post Title" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase">Date</label>
                <input type="date" {...register('frontmatter.date')} className="neobrutal-input" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/50 uppercase">Tags (comma separated)</label>
                <input {...register('frontmatter.tags')} className="neobrutal-input" placeholder="react, design, void" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-white/50 uppercase">Description</label>
                <input {...register('frontmatter.description')} className="neobrutal-input" placeholder="Short description for SEO/Previews" />
              </div>

              {/* Advanced Frontmatter Editor */}
              <div className="col-span-2 space-y-1 border-t border-white/10 pt-4 mt-2">
                <div 
                  className="flex justify-between items-center mb-2 cursor-pointer hover:bg-white/5 p-1 rounded"
                  onClick={() => setIsJsonOpen(!isJsonOpen)}
                >
                  <div className="flex items-center gap-2">
                    {isJsonOpen ? <ChevronDown size={14} className="text-neon-pink" /> : <ChevronRight size={14} className="text-neon-pink" />}
                    <label className="text-xs text-neon-pink font-bold uppercase cursor-pointer">Advanced Data (JSON)</label>
                  </div>
                  <span className="text-[10px] text-white/50">Edit items, profile data, layout settings</span>
                </div>
                
                {isJsonOpen && (
                  <textarea 
                    className="neobrutal-input font-mono text-xs h-64"
                    placeholder='{ "items": [...] }'
                    value={jsonText}
                    onChange={handleJsonChange}
                  />
                )}
              </div>
            </div>

            {/* Markdown Editor / Preview */}
            <div className="flex-1 neobrutal-box p-0 overflow-hidden flex flex-col min-h-[400px]">
              <div className="bg-neon-pink text-void px-4 py-1 text-xs font-bold uppercase flex justify-between items-center">
                <span>{viewMode === 'edit' ? 'Markdown Content' : 'Preview'}</span>
              </div>
              
              {viewMode === 'edit' ? (
                <textarea 
                  {...register('content', { required: true })} 
                  className="flex-1 w-full bg-void p-4 font-mono text-sm resize-none focus:outline-none text-white/90"
                  placeholder="# Start writing..."
                />
              ) : (
                <div className="flex-1 w-full bg-void p-4 overflow-y-auto markdown-body prose prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:text-neon-green prose-p:text-white/90 prose-p:leading-relaxed prose-strong:text-neon-pink prose-strong:font-black max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-4xl md:text-5xl font-black text-neon-green mb-6 border-b-4 border-neon-pink pb-2 inline-block" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-3xl md:text-4xl font-black text-neon-green mt-12 mb-6 flex items-center gap-2 before:content-['#'] before:text-neon-pink" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-2xl md:text-3xl font-bold text-white mt-8 mb-4 border-l-4 border-neon-green pl-4" {...props} />,
                      a: ({node, ...props}) => (
                        <a 
                          className="text-neon-pink font-bold border-b-2 border-neon-pink hover:bg-neon-pink hover:text-void transition-all no-underline px-1 -mx-1" 
                          {...props} 
                        />
                      ),
                      ul: ({node, ...props}) => <ul className="space-y-2 my-6 list-none pl-0" {...props} />,
                      ol: ({node, ...props}) => <ol className="space-y-2 my-6 list-decimal list-inside marker:text-neon-pink marker:font-bold" {...props} />,
                      li: ({node, ...props}) => (
                        <li className="flex gap-3 items-start" {...props}>
                          <span className="text-neon-pink font-bold mt-1.5 text-xs">►</span>
                          <span>{props.children}</span>
                        </li>
                      ),
                      hr: ({node, ...props}) => <hr className="border-t-4 border-dashed border-white/20 my-12" {...props} />,
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="neobrutal-box border-neon-green shadow-[4px_4px_0px_0px_var(--color-neon-green)] my-8 overflow-hidden">
                            <div className="bg-neon-green text-void px-4 py-1 text-xs font-bold uppercase flex justify-between items-center border-b-2 border-neon-green">
                              <span>{match[1]}</span>
                              <span>TERMINAL_EXEC</span>
                            </div>
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ margin: 0, borderRadius: 0, background: '#09090b', padding: '1.5rem' }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-white/10 text-neon-pink px-1.5 py-0.5 rounded text-sm font-mono border border-white/20" {...props}>
                            {children}
                          </code>
                        );
                      },
                      img: ({node, ...props}) => (
                        <figure className="my-10">
                          <div className="neobrutal-box p-2 bg-white/5">
                            <img {...props} className="w-full h-auto block grayscale hover:grayscale-0 transition-all duration-500" />
                          </div>
                          {props.title && <figcaption className="text-center text-xs font-mono text-neon-pink mt-2 uppercase tracking-widest">// {props.title}</figcaption>}
                        </figure>
                      ),
                      blockquote: ({node, ...props}) => (
                        <blockquote className="relative border-l-8 border-neon-pink bg-white/5 p-6 my-10 italic text-xl text-white/90" {...props}>
                          <span className="absolute -top-4 left-4 text-6xl text-neon-pink/20 font-serif leading-none">"</span>
                          <div className="relative z-10">
                            {props.children}
                          </div>
                        </blockquote>
                      )
                    }}
                  >
                    {currentContent || ''}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
