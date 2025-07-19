const User = require('../models/User');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is blocked
    if (user.blocked.includes(req.user.id)) {
      return res.status(403).json({ message: 'You have been blocked by this user' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { bio, avatar } },
      { new: true }
    );

    res.json({
      message: 'Profile updated successfully'
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};

exports.followUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user.id);

    // Check if already following
    const isFollowing = currentUser.following.includes(req.params.id);
    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(req.params.id);
      userToFollow.followers.pull(req.user.id);
    } else {
      // Follow
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user.id);
    }

    await Promise.all([currentUser.save(), userToFollow.save()]);

    res.json({
      message: isFollowing ? 'User unfollowed' : 'User followed',
      following: !isFollowing
    });
  } catch (err) {
    res.status(500).json({ message: 'Error following user' });
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)  // Changed from _id to id
      .populate({
        path: 'followers',
        select: 'username avatar bio',  // Added more fields
        options: { sort: { username: 1 } }  // Sort alphabetically
      });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      followers: user.followers || []
    });
  } catch (err) {
    console.error('GetFollowers Error:', err.message);
    res.status(500).json({ 
      message: 'Error fetching followers',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)  // Changed from _id to id
      .populate({
        path: 'following',
        select: 'username avatar bio',  // Added more fields
        options: { sort: { username: 1 } }  // Sort alphabetically
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      following: user.following || []
    });
  } catch (err) {
    console.error('GetFollowing Error:', err.message);
    res.status(500).json({ 
      message: 'Error fetching following list',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    const me = await User.findById(req.user._id);
    if (me.blocked.includes(target._id)) {
      me.blocked.pull(target._id);
      await me.save();
      return res.status(200).json({ message: 'User unblocked successfully' });
    }
    me.blocked.push(target._id);
    await me.save();
    res.status(200).json({ message: 'User blocked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};