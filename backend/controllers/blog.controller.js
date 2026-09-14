import Blog from '../models/Blog.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';

// @desc    Get all blogs
// @route   GET /api/blogs
// @access  Public
export const getBlogs = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Tag filtering
    const filter = {};
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }
    
    // Search by title
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const count = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter)
      .populate('author', 'name avatar')
      .populate('likes', 'name avatar email')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name avatar email' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      blogs,
      page,
      pages: Math.ceil(count / limit),
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
export const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'name avatar')
      .populate('likes', 'name avatar email')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name avatar email' }
      });

    if (blog) {
      res.json(blog);
    } else {
      res.status(404).json({ message: 'Blog not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a blog
// @route   POST /api/blogs
// @access  Private (User/Admin)
export const createBlog = async (req, res) => {
  try {
    const { title, slug, content, category, tags, coverImage } = req.body;
    let normalizedTags = tags;
    if (typeof tags === 'string') {
      try {
        normalizedTags = JSON.parse(tags);
      } catch {
        normalizedTags = tags.split(',').map((tag) => tag.trim()).filter(Boolean);
      }
    }

    // 🔐 Check if user is blocked
    const user = await User.findById(req.user._id);
    if (user && user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. You cannot create blogs.' });
    }

    const blogExists = await Blog.findOne({ slug });
    if (blogExists) {
      return res.status(400).json({ message: 'Slug already exists' });
    }

    const blog = new Blog({
      title,
      slug,
      content,
      category,
      tags: Array.isArray(normalizedTags) ? normalizedTags : [],
      coverImage: req.file ? `/uploads/blogs/${req.file.filename}` : coverImage,
      author: req.user._id,
    });

    const createdBlog = await blog.save();
    res.status(201).json(createdBlog);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a blog
// @route   PUT /api/blogs/:id
// @access  Private (Author Only or Admin)
export const updateBlog = async (req, res) => {
  try {
    const { title, slug, content, category, tags, coverImage } = req.body;

    const blog = await Blog.findById(req.params.id);

    if (blog) {
      // Check authorization
      if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this blog' });
      }

      blog.title = title || blog.title;
      blog.slug = slug || blog.slug;
      blog.content = content || blog.content;
      blog.category = category || blog.category;
      blog.tags = tags || blog.tags;
      blog.coverImage = coverImage || blog.coverImage;

      const updatedBlog = await blog.save();
      res.json(updatedBlog);
    } else {
      res.status(404).json({ message: 'Blog not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a blog
// @route   DELETE /api/blogs/:id
// @access  Private (Author Only or Admin)
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (blog) {
      // Check authorization
      if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this blog' });
      }

      await Blog.deleteOne({ _id: blog._id });
      res.json({ message: 'Blog removed' });
    } else {
      res.status(404).json({ message: 'Blog not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Like/Unlike a blog
// @route   POST /api/blogs/:id/like
// @access  Private
export const likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const userId = req.user._id;
    const isLiked = blog.likes.includes(userId);

    if (isLiked) {
      // Unlike the blog
      blog.likes = blog.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like the blog
      blog.likes.push(userId);
    }

    const updatedBlog = await blog.save();
    const populatedBlog = await Blog.findById(updatedBlog._id)
      .populate('likes', 'name avatar email')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name avatar email' }
      });

    res.json({ 
      message: isLiked ? 'Blog unliked' : 'Blog liked',
      blog: populatedBlog,
      isLiked: !isLiked
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a comment to a blog
// @route   POST /api/blogs/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      blog: req.params.id,
    });

    const createdComment = await comment.save();
    blog.comments.push(createdComment._id);
    await blog.save();

    const populatedComment = await Comment.findById(createdComment._id)
      .populate('author', 'name avatar email');

    res.status(201).json({
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all comments for a blog
// @route   GET /api/blogs/:id/comments
// @access  Public
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ blog: req.params.id })
      .populate('author', 'name avatar email')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (Author Only or Admin)
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check authorization
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.deleteOne({ _id: req.params.id });
    
    // Remove comment from blog
    await Blog.findByIdAndUpdate(comment.blog, { $pull: { comments: req.params.id } });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
