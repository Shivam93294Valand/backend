const Story = require('../models/Story');
const User = require('../models/User');

exports.createStory = async (req, res) => {
  try {
    const { media, expiresAt } = req.body;
    if (!media) {
      return res.status(400).json({ message: 'Media is required' });
    }

    const story = new Story({
      user: req.user.id,
      media,
      expiresAt: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    await story.save();
    await story.populate('user', 'username avatar');

    res.status(201).json({
      message: 'Story created',
      story
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating story' });
  }
};

exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find({ archived: false, expiresAt: { $gt: new Date() } }).populate('user', 'username avatar');
    res.status(200).json(stories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getArchivedStories = async (req, res) => {
  try {
    const stories = await Story.find({ user: req.user._id, archived: true });
    res.status(200).json(stories);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.archiveStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (!story.user.equals(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
    story.archived = true;
    await story.save();
    res.status(200).json({ message: 'Story archived' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (!story.viewers.includes(req.user._id)) {
      story.viewers.push(req.user._id);
      await story.save();
    }
    res.status(200).json({ message: 'Story viewed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.replyToStory = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    const reply = new Message({ sender: req.user._id, receiver: story.user, content });
    await reply.save();
    story.replies.push(reply._id);
    await story.save();
    res.status(200).json({ message: 'Reply sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};