const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;

    if (!receiver || !content) {
      return res.status(400).json({ message: 'Receiver and content are required' });
    }

    // Validate content length
    if (content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ message: 'Message too long. Maximum 1000 characters allowed' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(receiver)) {
      return res.status(400).json({ message: 'Invalid receiver ID format' });
    }

    // Prevent sending message to self
    if (receiver === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if receiver is banned
    if (receiverUser.isBanned) {
      return res.status(403).json({ message: 'Cannot send message to banned user' });
    }

    const message = new Message({
      sender: req.user._id,
      receiver,
      content: content.trim()
    });

    await message.save();
    
    // Populate the saved message
    await message.populate('sender', 'username avatar');
    await message.populate('receiver', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Error sending message' });
  }
};

exports.getMessagesWithUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    // Check if user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is banned
    if (targetUser.isBanned) {
      return res.status(403).json({ message: 'Cannot message banned user' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
    .sort({ createdAt: 1 }) // Changed to ascending order for chat display
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar');

    res.status(200).json({
      success: true,
      messages,
      targetUser: {
        _id: targetUser._id,
        username: targetUser.username,
        avatar: targetUser.avatar
      }
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

exports.getAllConversations = async (req, res) => {
  try {
    // Get the latest message for each conversation
    const messages = await Message.aggregate([
      { $match: { $or: [ { sender: req.user._id }, { receiver: req.user._id } ] } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', req.user._id] },
            '$receiver',
            '$sender'
          ]
        },
        lastMessage: { $first: '$content' },
        lastMessageAt: { $first: '$createdAt' },
        sender: { $first: '$sender' },
        receiver: { $first: '$receiver' }
      } },
      { $sort: { lastMessageAt: -1 } }
    ]);
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all available users for messaging
exports.getAllUsers = async (req, res) => {
  try {
    // Extract query parameters
    const {
      search = '',
      page = 1,
      limit = 20,
      sortBy = 'username'
    } = req.query;

    // Build search query
    const query = {
      _id: { $ne: req.user._id }, // Exclude current user
      isBanned: { $ne: true }      // Exclude banned users
    };

    // Add search functionality
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i', $exists: true, $ne: null } }
      ];
    }

    // Calculate pagination
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    // Define sort options
    const sortOptions = {
      username: { username: 1 },
      recent: { createdAt: -1 }
    };

    // For followers sort, we'll use default sort and handle it after fetching
    const sortQuery = sortOptions[sortBy] || { username: 1 };

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select('_id username avatar bio followers following createdAt')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNumber);

    // Format the response with additional user statistics
    let formattedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      isFollowing: user.followers.includes(req.user._id),
      joinedDate: user.createdAt
    }));

    // Sort by followers count if requested (since MongoDB aggregation is complex for this case)
    if (sortBy === 'followers') {
      formattedUsers = formattedUsers.sort((a, b) => b.followersCount - a.followersCount);
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalUsers / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.status(200).json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalUsers,
          hasNextPage,
          hasPrevPage,
          limit: limitNumber
        },
        searchQuery: search,
        sortBy
      }
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching users for messaging'
    });
  }
};
