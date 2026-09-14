import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote, Loader2 } from 'lucide-react';

const blogCategories = [
  'Insight', 'Newsletter', 'Tips', 'Success Stories', 'Culture', 'Technology',
  'Business', 'Design', 'Lifestyle', 'Education', 'Science', 'Career', 'Travel', 'Opinion'
];

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-2 bg-secondary/20 rounded-md border border-border">
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-primary text-primary-foreground' : ''}><Bold className="w-4 h-4" /></Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-primary text-primary-foreground' : ''}><Italic className="w-4 h-4" /></Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'bg-primary text-primary-foreground' : ''}><Strikethrough className="w-4 h-4" /></Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : ''}><Heading1 className="w-4 h-4" /></Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : ''}><Heading2 className="w-4 h-4" /></Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : ''}><List className="w-4 h-4" /></Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'bg-primary text-primary-foreground' : ''}><ListOrdered className="w-4 h-4" /></Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'bg-primary text-primary-foreground' : ''}><Quote className="w-4 h-4" /></Button>
    </div>
  );
};

export default function CreateBlog() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Insight');
  const [tags, setTags] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const contextValue = useContext(AuthContext);
  const { user = null } = contextValue || {};
  const navigate = useNavigate();

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start writing your awesome blog here...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[300px] p-4 bg-background/50 rounded-lg border border-border',
      },
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const htmlContent = editor.getHTML();
      // Simple slug generation
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(t => t !== '');

      const token = localStorage.getItem('accessToken');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const formData = new FormData();
      formData.append('title', title);
      formData.append('slug', slug);
      formData.append('content', htmlContent);
      formData.append('category', category);
      formData.append('tags', JSON.stringify(tagsArray));
      formData.append('coverImage', coverUrl);
      if (coverFile) formData.append('coverFile', coverFile);

      await axios.post('/api/blogs', formData, config);
      
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Error publishing blog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="write-page max-w-5xl mx-auto py-8">
      <div className="write-page-header">
        <span className="write-kicker">IDEAPRESS / STUDIO</span>
        <h1>Shape an idea into a story.</h1>
        <p>Choose a home for your thinking, then write something worth returning to.</p>
      </div>
      <Card className="write-card glass">
        <CardHeader className="write-card-header">
          <CardTitle>New story</CardTitle>
          <span className="write-card-status">Draft · Ready to publish</span>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="write-card-content space-y-6">
            {error && <div className="text-destructive font-medium p-3 bg-destructive/10 rounded-lg">{error}</div>}
            
            <div className="space-y-2 write-title-field">
              <label className="text-sm font-semibold">Title</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The amazing story of..."
                className="text-lg py-6 bg-background/50"
              />
            </div>
            
            <div className="write-meta-grid">
              <div className="space-y-2">
                <label htmlFor="blog-category" className="text-sm font-semibold">Category</label>
                <select id="blog-category" required value={category} onChange={(e) => setCategory(e.target.value)} className="write-select">
                  {blogCategories.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div className="space-y-2">
              <label className="text-sm font-semibold">Tags (comma separated)</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="React, Frontend, Web Dev"
                className="bg-background/50"
              />
              </div>
            </div>

            <div className="space-y-2 write-cover-field">
              <label className="text-sm font-semibold">Cover Image</label>
              <Input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="bg-background/50"
              />
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="bg-background/50"
              />
              <p className="text-xs text-muted-foreground">Use an image URL or upload a JPG, JPEG, or PNG file up to 5 MB.</p>
            </div>

            <div className="space-y-2 write-editor-field">
              <label className="text-sm font-semibold">Content</label>
              <MenuBar editor={editor} />
              <EditorContent editor={editor} />
            </div>
            
          </CardContent>
          <CardFooter className="write-card-footer">
            <span className="write-footer-note">Your story will appear in All Posts.</span>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto px-8 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Publish Blog'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
