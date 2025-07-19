const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

exports.createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    if (!content && !image) {
      return res.status(400).json({ message: 'Content or image is required' });
    }

    const post = new Post({
      user: req.user.id,
      content,
      image
    });

    await post.save();
    await post.populate('user', 'username avatar');

    res.status(201).json({
      message: 'Post created',
      post
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating post' });
  }
};

exports.getFeed = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username avatar')
      .sort('-createdAt');
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

exports.getExplorePosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(20).populate('user', 'username avatar');
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSinglePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user', 'username avatar');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: 'Post not found' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.user.equals(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
    post.content = req.body.content || post.content;
    await post.save();
    res.status(200).json({ message: 'Post updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.user.id);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
      await post.save();
      return res.status(200).json({ message: 'Post unliked' });
    }

    post.likes.push(req.user.id);
    await post.save();
    res.status(200).json({ message: 'Post liked' });
  } catch (err) {
    res.status(500).json({ message: 'Error liking post' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = new Comment({ post: post._id, user: req.user._id, content });
    await comment.save();
    post.comments.push(comment._id);
    await post.save();
    res.status(201).json({ message: 'Comment added', comment });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate({ path: 'comments', populate: { path: 'user', select: 'username avatar' } });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.status(200).json(post.comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.bookmarkPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const idx = post.bookmarks.indexOf(req.user._id);
    if (idx > -1) {
      post.bookmarks.pull(req.user._id);
      await post.save();
      return res.status(200).json({ message: 'Post unbookmarked' });
    }
    post.bookmarks.push(req.user._id);
    await post.save();
    res.status(200).json({ message: 'Post bookmarked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.user.equals(req.user._id)) return res.status(403).json({ message: 'Not allowed' });
    await post.remove();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};