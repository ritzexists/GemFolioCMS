# User Guide

Welcome to GemFolioCMS! This guide will help you navigate the site and use the admin features.

## Navigation

### Main Menu
The top navigation bar provides links to the main sections:
- **HOME**: The landing page with the interactive terminal.
- **BLOG**: A list of all blog posts.
- **TALKS**: A list of conference presentations.
- **WORKS**: A portfolio of projects (configurable).
- **ADMIN**: The content management dashboard.

### Terminal
The terminal on the home page is fully interactive. Click on it to focus, then type commands and press Enter.

**Available Commands:**
- `help`: Show a list of all commands.
- `ls`: List available pages.
- `cd [page]`: Navigate to a page (e.g., `cd blog`).
- `search [query]`: Search blog posts by title or description.
- `tags`: Show all blog tags as clickable buttons.
- `tag [name]`: Filter posts by a specific tag.
- `aesthetic`: Cycle through different color themes.
- `clear`: Clear the terminal screen.

**Tips:**
- You can click on tags displayed in the terminal to automatically run the `tag` command.
- Clicking on a post title in the search results will navigate you to that post.

## Admin Dashboard

The Admin Dashboard allows you to manage your content without touching code.

### Accessing Admin
Navigate to `/admin`. In a real deployment, you should secure this route.

> **Note:** For production static sites, the admin panel is disabled by default for security. To enable it in production, you must set `VITE_DISABLE_ADMIN=false` during the build process. See the README for details.

### Working with Media
GemFolioCMS makes it easy to manage images and files by creating a dedicated subfolder for every post and page.

**Using the Media Upload Button:**
1. In the Admin Editor, ensure you have entered a **Slug** for your post.
2. Click the **MEDIA** button in the toolbar.
3. Select one or more files to upload.
4. The files will be uploaded to the post's subfolder (e.g., `/content/posts/my-post/image.png`).
5. Markdown links will be automatically inserted into the editor at your cursor position.

**Manual Image Management:**
1. You can also use the **FILES** tab in the Admin sidebar to manually manage files.
2. Place images in the subfolder corresponding to your post's slug.
3. Reference them in Markdown using relative paths: `![Alt Text](./my-photo.jpg)`.
4. The preview window will resolve these paths so you can see your images while editing.

**Using External Images:**
Simply use the full URL:
```markdown
![External Image](https://example.com/image.png)
```

### Managing Files
- **Sidebar**: The left sidebar lists all Posts, Pages, and Files.
- **File Manager**: The **FILES** tab provides a full file browser for the `./content` directory.
- **Operations**: Use the **+** icon to create folders, or the **Upload** icon to upload files.
- **Multi-select**: Check the boxes next to files/folders to perform bulk **Move** or **Delete** operations.
- **Custom Modals**: All file operations use custom dialogs for a consistent experience.

### Managing Content
- **Sidebar**: Use the **Posts** or **Pages** tabs to manage your written content.
- **Creating New Content**: Click the **+** button in the sidebar header. A subfolder will be created automatically based on your slug.
- **Editing**: Click on any item in the list to load it into the editor.
- **Deleting**: Select items and click the **Trash** icon. This will delete the content file and its associated subfolder.

### The Editor
- **Metadata**: Edit the Slug, Title, Date, Tags, and Description at the top.
- **Markdown Editor**: Write your content in the large text area. It supports standard Markdown syntax.
- **Preview**: Click the **PREVIEW** button in the toolbar to see how your post will look with full styling.
- **Advanced Data**: Click "Advanced Data (JSON)" to edit the raw frontmatter JSON. This is useful for complex page layouts (like the Works page).

### Importing Content
You can import content from an external URL (e.g., a dev.to article or another blog).
1. Paste the URL into the input field in the toolbar.
2. Click **IMPORT**.
3. The system will attempt to scrape the title, description, tags, and content.

### Site Settings
Click the **Settings (Gear)** icon in the sidebar tabs to access global site configuration.
- **Site Name**: Changes the name displayed in the header.
- **Footer Text**: Updates the footer copyright/message.
- **Hero Title/Description**: Updates the text displayed on the Home page.

## Customizing Pages

The `Page` component supports a flexible grid layout defined in the frontmatter.

**Example Frontmatter for a Portfolio Page:**
```json
{
  "title": "My Works",
  "layout": "grid",
  "items": [
    {
      "title": "Project Alpha",
      "description": "A revolutionary app.",
      "link": "https://github.com/...",
      "image": "https://picsum.photos/..."
    },
    {
      "title": "Project Beta",
      "description": "Another cool thing.",
      "link": "https://..."
    }
  ]
}
```
