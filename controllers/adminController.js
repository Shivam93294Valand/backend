const User = require('../models/User');
const Report = require('../models/Report');
const Post = require('../models/Post');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBanned = true;
    await user.save();
    res.status(200).json({ message: 'User banned' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeContent = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Content not found' });
    res.status(200).json({ message: 'Content removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 