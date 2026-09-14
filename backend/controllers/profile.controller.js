import User from '../models/User.js';
import Blog from '../models/Blog.js';

export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name avatar bio work location website interests createdAt');

    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const blogs = await Blog.find({ author: user._id })
      .populate('author', 'name avatar work')
      .sort({ createdAt: -1 });

    res.json({ user, blogs });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.status(500).json({ message: 'Could not load profile' });
  }
};
