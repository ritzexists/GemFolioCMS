import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Plus, Trash, RefreshCw, Eye, Edit, ChevronDown, ChevronRight, Settings, Folder, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useSiteConfig } from '@/context/SiteConfigContext';
import { logger } from '@/lib/logger';
import Editor from '@monaco-editor/react';
import yaml from 'js-yaml';
import FileManager from '@/components/FileManager';

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
 * - Advanced YAML editor for frontmatter manipulation
 * - File manager for media and content
 */
export default function Admin() {
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [pages, setPages] = useState<ContentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [contentType, setContentType] = useState<'post' | 'page' | 'settings' | 'files'>('post');
  const [message, setMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isYamlOpen, setIsYamlOpen] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [editorLanguage, setEditorLanguage] = useState("markdown");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaButtonText, setMediaButtonText] = useState('MEDIA');
  
  const { config, refreshConfig } = useSiteConfig();
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const { register: registerSettings, handleSubmit: handleSubmitSettings, setValue: setValueSettings, getValues: getValuesSettings } = useForm();

  /**
   * Fetches all posts and pages from the API.
   * Resets selection state after loading.
   */
  const loadContent = async () => {
    logger.debug('Loading admin content...');
    const [postsData, pagesData] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}api/posts.json`).then(res => res.json()),
      fetch(`${import.meta.env.BASE_URL}api/pages.json`).then(res => res.json())
    ]);
    setPosts(postsData);
    setPages(pagesData);
    setSelectedForDeletion(new Set());
  };

  useEffect(() => {
    loadContent();
  }, []);

  // Update settings form when config changes or when switching to settings tab
  useEffect(() => {
    if (contentType === 'settings') {
      setValueSettings('siteName', config.siteName);
      setValueSettings('author', config.author);
      setValueSettings('footerText', config.footerText);
      setValueSettings('heroTitle', config.heroTitle);
      setValueSettings('heroDescription', config.heroDescription);
      setValueSettings('bannerMessage', config.bannerMessage);
      setValueSettings('bannerStart', config.bannerStart);
      setValueSettings('bannerEnd', config.bannerEnd);
      setValueSettings('favicon', config.favicon);
      setValueSettings('siteIcon', config.siteIcon);
    }
  }, [config, contentType, setValueSettings]);

  const [yamlText, setYamlText] = useState("");

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
      setYamlText(yaml.dump(selectedItem.frontmatter));
      
      // Try to determine language from path extension if available
      if (selectedItem.path) {
        if (selectedItem.path.endsWith('.adoc')) setEditorLanguage('asciidoc');
        else if (selectedItem.path.endsWith('.rst')) setEditorLanguage('restructuredtext');
        else if (selectedItem.path.endsWith('.json')) setEditorLanguage('json');
        else if (selectedItem.path.endsWith('.yaml') || selectedItem.path.endsWith('.yml')) setEditorLanguage('yaml');
        else setEditorLanguage('markdown');
      } else {
        setEditorLanguage('markdown');
      }
    } else {
      reset();
      const initialDate = new Date().toISOString().split('T')[0];
      setValue('frontmatter.date', initialDate);
      setYamlText(yaml.dump({ date: initialDate }));
      setEditorLanguage('markdown');
    }
  }, [selectedItem, setValue, reset, contentType]);

  // Update YAML text when frontmatter changes via other inputs
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // If a specific field changes (e.g. frontmatter.title), update the YAML view
      if (name && name.startsWith('frontmatter.') && name !== 'frontmatter') {
        const currentFrontmatter = watch('frontmatter');
        setYamlText(yaml.dump(currentFrontmatter));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleYamlChange = (value: string | undefined) => {
    const text = value || '';
    setYamlText(text);
    try {
      const parsed = yaml.load(text);
      if (typeof parsed === 'object' && parsed !== null) {
        setValue('frontmatter', parsed);
      }
    } catch (err) {
      // Invalid YAML, don't update form yet
    }
  };

  const handleContentChange = (value: string | undefined) => {
    setValue('content', value || '');
  };

  const handleEditorDidMount = (editor: any) => {
    setEditorInstance(editor);
  };

  const handleMediaUploadClick = () => {
    mediaInputRef.current?.click();
  };

  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const slug = watch('slug');
    if (!slug) {
      setMessage('Please enter a slug first to upload media');
      return;
    }

    const dir = `${contentType}s/${slug}`;
    
    const formData = new FormData();
    formData.append('dir', dir);
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('files', e.target.files[i]);
    }

    setIsUploadingMedia(true);
    setMediaButtonText('UPLOADING...');
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/files/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setMediaButtonText('UPLOADED ✓');
        setTimeout(() => setMediaButtonText('MEDIA'), 3000);
        
        // Insert into editor
        const files = Array.from(e.target.files);
        let insertText = '';
        files.forEach(file => {
          const isImage = file.name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
          const url = `/content/${dir}/${file.name}`;
          if (isImage) {
            insertText += `\n![${file.name}](${url})\n`;
          } else {
            insertText += `\n[${file.name}](${url})\n`;
          }
        });

        if (editorInstance) {
          const selection = editorInstance.getSelection();
          if (selection) {
            editorInstance.executeEdits('media-upload', [{
              range: selection,
              text: insertText,
              forceMoveMarkers: true
            }]);
          } else {
            const currentVal = editorInstance.getValue();
            editorInstance.setValue(currentVal + insertText);
          }
        } else {
          // Fallback if editor not mounted
          const currentVal = watch('content') || '';
          setValue('content', currentVal + insertText);
        }

      } else {
        setMediaButtonText('FAILED ✗');
        setTimeout(() => setMediaButtonText('MEDIA'), 3000);
      }
    } catch (e) {
      setMediaButtonText('ERROR ✗');
      setTimeout(() => setMediaButtonText('MEDIA'), 3000);
    }
    setIsUploadingMedia(false);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  /**
   * Handles saving a post or page.
   */
  /**
   * Handles form submission for saving a post or page.
   * Sends the payload to the server and refreshes the content list.
   * 
   * @param data - Form data containing slug, frontmatter, and content.
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

      const res = await fetch(`${import.meta.env.BASE_URL}api/content.json`, {
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
  /**
   * Handles form submission for updating site settings.
   * Sends the updated configuration to the server.
   * 
   * @param data - Form data containing site settings.
   */
  const onSettingsSubmit = async (data: any) => {
    try {
      logger.info("Saving site settings");
      const res = await fetch(`${import.meta.env.BASE_URL}api/config.json`, {
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

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'favicon' | 'siteIcon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('dir', 'assets');
    formData.append(type, file);

    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/settings/icons`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setMessage(`${type.toUpperCase()} UPLOADED`);
        const newPath = `/content/assets/${file.name}`;
        setValueSettings(type, newPath);
        
        // Save settings immediately to persist the new icon path
        const currentSettings = getValuesSettings();
        await onSettingsSubmit({ ...currentSettings, [type]: newPath });
      } else {
        setMessage(`ERROR UPLOADING ${type.toUpperCase()}`);
      }
    } catch (err) {
      setMessage(`ERROR UPLOADING ${type.toUpperCase()}`);
    }
  };

  const [importUrl, setImportUrl] = useState("");

  /**
   * Imports content from an external URL.
   * Parses the HTML to extract title, description, and content.
   */
  /**
   * Handles importing content from an external URL.
   * Prompts the user for a URL, sends it to the server for parsing,
   * and populates the editor with the extracted content.
   */
  const handleImport = async () => {
    if (!importUrl) return;
    setIsImporting(true);
    logger.info(`Importing content from ${importUrl}`);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/import.json`, {
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
        
        // Update YAML view
        setYamlText(yaml.dump({ 
          title: data.title, 
          date: today,
          description: data.description || '',
          tags: data.tags || []
        }));

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
   * Handles the deletion of selected content items.
   * Prompts for confirmation before sending delete requests to the server.
   */
  const handleDelete = async () => {
    if (selectedForDeletion.size === 0) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    logger.info(`Deleting ${selectedForDeletion.size} items`);
    try {
      const deletePromises = Array.from(selectedForDeletion).map(slug => 
        fetch(`${import.meta.env.BASE_URL}api/content/${contentType}/${slug}.json`, {
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

  /**
   * Toggles the selection state of a content item for bulk deletion.
   * 
   * @param slug - The slug of the item to toggle.
   */
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

  const handleEditFile = async (filePath: string) => {
    // filePath is like "posts/my-post.md" or "pages/about.md"
    const isPost = filePath.startsWith('posts/');
    const isPage = filePath.startsWith('pages/');
    
    if (isPost || isPage) {
      const type = isPost ? 'post' : 'page';
      let list = isPost ? posts : pages;
      
      // Find the item by path
      let item = list.find(i => i.path && i.path.replace(/\\/g, '/').endsWith(filePath));
      
      if (!item) {
        // Try reloading content
        const [postsData, pagesData] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}api/posts.json`).then(res => res.json()),
          fetch(`${import.meta.env.BASE_URL}api/pages.json`).then(res => res.json())
        ]);
        setPosts(postsData);
        setPages(pagesData);
        list = isPost ? postsData : pagesData;
        item = list.find((i: any) => i.path && i.path.replace(/\\/g, '/').endsWith(filePath));
      }
      
      if (item) {
        setContentType(type);
        setSelectedItem(item);
      } else {
        setMessage("Could not load file for editing");
        setTimeout(() => setMessage(""), 3000);
      }
    } else {
      setMessage("Only posts and pages can be edited here");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] relative">
      {showDeleteModal && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="neobrutal-box p-6 max-w-md w-full flex flex-col gap-4">
            <h3 className="text-neon-pink font-bold text-lg">CONFIRM DELETE</h3>
            <p className="text-white/80">Are you sure you want to delete {selectedForDeletion.size} items?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-white/20 hover:bg-white/10 text-sm font-bold"
              >
                CANCEL
              </button>
              <button 
                onClick={confirmDelete}
                className="neobrutal-button text-sm px-4 py-2"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar List */}
      <div className="lg:col-span-3 neobrutal-box p-4 h-[250px] shrink-0 min-h-[250px] lg:min-h-0 lg:h-full overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neon-pink">CONTENT</h2>
          <div className="flex gap-2">
            {selectedForDeletion.size > 0 && contentType !== 'settings' && contentType !== 'files' && (
              <button 
                onClick={handleDelete}
                className="bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                title="Delete Selected"
              >
                <Trash size={16} />
              </button>
            )}
            {contentType !== 'settings' && contentType !== 'files' && (
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
        {contentType !== 'settings' && contentType !== 'files' && (
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
            title="Settings"
          >
            <Settings size={14} className="mx-auto" />
          </button>
          <button 
            onClick={() => { setContentType('files'); setSelectedItem(null); }}
            className={cn("flex-1 text-xs font-bold py-1 border border-white/20", contentType === 'files' && "bg-neon-pink text-void border-neon-pink")}
            title="File Manager"
          >
            <Folder size={14} className="mx-auto" />
          </button>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto">
          {contentType === 'settings' ? (
             <div className="text-sm text-white/50 p-2 text-center">
               Global site configuration
             </div>
          ) : contentType === 'files' ? (
             <div className="text-sm text-white/50 p-2 text-center">
               Manage files and media
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
      <div className="lg:col-span-9 flex-1 min-h-0 flex flex-col h-full">
        {contentType === 'files' ? (
          <FileManager onEditFile={handleEditFile} onFileChange={loadContent} />
        ) : contentType === 'settings' ? (
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
                  <label className="text-sm font-bold text-neon-pink">Author</label>
                  <input {...registerSettings('author')} className="neobrutal-input w-full" />
                  <p className="text-xs text-white/50">Site-wide author for SEO and RSS metadata.</p>
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

                <div className="space-y-2">
                  <label className="text-sm font-bold text-neon-pink">Banner Message</label>
                  <input {...registerSettings('bannerMessage')} className="neobrutal-input w-full" placeholder="e.g. Sale ends soon!" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neon-pink">Banner Start</label>
                    <input type="datetime-local" {...registerSettings('bannerStart')} className="neobrutal-input w-full" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neon-pink">Banner End</label>
                    <input type="datetime-local" {...registerSettings('bannerEnd')} className="neobrutal-input w-full" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neon-pink">Paragraph Gap</label>
                    <input {...registerSettings('paragraphGap')} className="neobrutal-input w-full" placeholder="e.g. 1.5rem" />
                    <p className="text-[10px] text-white/50">CSS gap between article paragraphs</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-neon-pink">Max Image Size</label>
                    <input {...registerSettings('maxImageSize')} className="neobrutal-input w-full" placeholder="e.g. 800px" />
                    <p className="text-[10px] text-white/50">Maximum width of images in articles (click to zoom)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/10">
                   <div className="space-y-2">
                     <label className="text-sm font-bold text-neon-pink uppercase tracking-wider">Favicon</label>
                     <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded">
                       <div className="w-12 h-12 flex items-center justify-center bg-black border border-white/20 overflow-hidden">
                         {config.favicon ? (
                           <img src={config.favicon} alt="Favicon" className="max-w-full max-h-full object-contain" />
                         ) : (
                           <span className="text-[10px] text-white/30">NONE</span>
                         )}
                       </div>
                       <div className="flex-1 space-y-2">
                         <input 
                           type="file" 
                           accept=".ico,.png,.jpg,.jpeg,.svg" 
                           onChange={(e) => handleIconUpload(e, 'favicon')}
                           className="block w-full text-xs text-white/50 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-neon-pink file:text-void hover:file:bg-white cursor-pointer"
                         />
                         <p className="text-[10px] text-white/30">Recommended: 32x32px .ico or .png</p>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-sm font-bold text-neon-pink uppercase tracking-wider">Site Icon / Logo</label>
                     <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded">
                       <div className="w-12 h-12 flex items-center justify-center bg-black border border-white/20 overflow-hidden">
                         {config.siteIcon ? (
                           <img src={config.siteIcon} alt="Site Icon" className="max-w-full max-h-full object-contain" />
                         ) : (
                           <span className="text-[10px] text-white/30">NONE</span>
                         )}
                       </div>
                       <div className="flex-1 space-y-2">
                         <input 
                           type="file" 
                           accept=".png,.jpg,.jpeg,.svg" 
                           onChange={(e) => handleIconUpload(e, 'siteIcon')}
                           className="block w-full text-xs text-white/50 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-neon-pink file:text-void hover:file:bg-white cursor-pointer"
                         />
                         <p className="text-[10px] text-white/30">Recommended: 512x512px .png</p>
                       </div>
                     </div>
                   </div>
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
                  onClick={handleMediaUploadClick}
                  disabled={isUploadingMedia}
                  className="neobrutal-button text-xs py-1 flex items-center gap-2 whitespace-nowrap"
                  title="Upload media to this post's folder"
                >
                  <Upload size={14} />
                  {mediaButtonText}
                </button>
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  ref={mediaInputRef} 
                  onChange={handleMediaFileChange} 
                />
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
                  onClick={() => setIsYamlOpen(!isYamlOpen)}
                >
                  <div className="flex items-center gap-2">
                    {isYamlOpen ? <ChevronDown size={14} className="text-neon-pink" /> : <ChevronRight size={14} className="text-neon-pink" />}
                    <label className="text-xs text-neon-pink font-bold uppercase cursor-pointer">Advanced Data (YAML)</label>
                  </div>
                  <span className="text-[10px] text-white/50">Edit items, profile data, layout settings</span>
                </div>
                
                {isYamlOpen && (
                  <div className="h-64 neobrutal-box p-1">
                    <Editor
                      height="100%"
                      language="yaml"
                      theme="vs-dark"
                      value={yamlText}
                      onChange={handleYamlChange}
                      options={{
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        folding: true,
                        snippetSuggestions: 'inline',
                        tabSize: 2,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Content Editor / Preview */}
            <div className="flex-1 neobrutal-box p-0 overflow-hidden flex flex-col min-h-[400px]">
              <div className="bg-neon-pink text-void px-4 py-1 text-xs font-bold uppercase flex justify-between items-center">
                <span>{viewMode === 'edit' ? 'Content' : 'Preview'}</span>
              </div>
              
              {viewMode === 'edit' ? (
                <div className="flex-1 w-full bg-void p-1 relative">
                  <input type="hidden" {...register('content', { required: true })} />
                  <Editor
                    height="100%"
                    language={editorLanguage}
                    theme="vs-dark"
                    value={currentContent}
                    onChange={handleContentChange}
                    onMount={handleEditorDidMount}
                    options={{
                      minimap: { enabled: false },
                      wordWrap: 'on',
                      folding: true,
                      snippetSuggestions: 'inline',
                      tabSize: 2,
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 w-full bg-void p-4 overflow-y-auto markdown-body prose prose-invert prose-headings:font-black prose-headings:uppercase prose-headings:text-neon-green prose-p:text-white/90 prose-p:leading-relaxed prose-strong:text-neon-pink prose-strong:font-black max-w-none">
                  <MarkdownRenderer 
                    content={currentContent || ''} 
                    basePath={contentType === 'post' ? '/content/posts/' : '/content/pages/'} 
                  />
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
