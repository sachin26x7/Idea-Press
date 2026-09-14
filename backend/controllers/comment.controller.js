import Comment from '../models/Comment.js';

// @desc    Get comments for a blog
// @route   GET /api/comments/:blogId
// @access  Public
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ blog: req.params.blogId })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    // Transform into a tree structure if desired, or let frontend handle it.
    // Here we'll return flat list for simplicity, UI can nest if it matches parentComment.
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a comment
// @route   POST /api/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { content, blogId, parentComment } = req.body;

    const comment = new Comment({
      content,
      author: req.user._id,
      blog: blogId,
      parentComment: parentComment || null,
    });

    const createdComment = await comment.save();
    
    // Populate author so immediate frontend display has name
    await createdComment.populate('author', 'name avatar');

    res.status(201).json(createdComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (comment) {
      if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }

      await Comment.deleteOne({ _id: comment._id });
      // Optionally cascade delete replies, skipped for brevity
      res.json({ message: 'Comment removed' });
    } else {
      res.status(404).json({ message: 'Comment not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
