// routes/chat.js
const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const Message = require('../models/Message');
const { validatePagination, validateObjectId } = require('../middleware/validation');

// Get global chat messages
router.get('/global', optionalAuth, validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.getGlobalMessages(
      parseInt(limit),
      (parseInt(page) - 1) * parseInt(limit)
    );
    
    const total = await Message.countDocuments({
      messageType: 'global',
      isDeleted: false,
      status: { $ne: 'flagged' }
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show newest first
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: messages.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Get global chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get domain-specific chat messages
router.get('/domain/:domainId', optionalAuth, validateObjectId('domainId'), validatePagination, async (req, res) => {
  try {
    const { domainId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.getDomainMessages(
      domainId,
      parseInt(limit),
      (parseInt(page) - 1) * parseInt(limit)
    );
    
    const total = await Message.countDocuments({
      messageType: 'domain',
      domainId,
      isDeleted: false,
      status: { $ne: 'flagged' }
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: messages.length,
          totalItems: total
        }
      }
    });

  } catch (error) {
    console.error('Get domain chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get private messages between users
router.get('/private/:userId', authenticate, validateObjectId('userId'), validatePagination, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.getPrivateMessages(
      req.userId,
      userId,
      parseInt(limit),
      (parseInt(page) - 1) * parseInt(limit)
    );
    
    // Mark messages as read
    const unreadMessageIds = messages
      .filter(msg => msg.recipient && msg.recipient._id.toString() === req.userId && !msg.isRead)
      .map(msg => msg._id);
    
    if (unreadMessageIds.length > 0) {
      await Message.markAsRead(unreadMessageIds, req.userId);
    }

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          current: parseInt(page),
          count: messages.length
        }
      }
    });

  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Send private message
router.post('/private/:userId', authenticate, validateObjectId('userId'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const User = require('../models/User');
    const [sender, recipient] = await Promise.all([
      User.findById(req.userId),
      User.findById(userId)
    ]);

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    const newMessage = new Message({
      content: message.trim(),
      username: sender.username,
      email: sender.email,
      userId: req.userId,
      messageType: 'private',
      recipient: userId
    });

    await newMessage.save();
    await newMessage.populate([
      { path: 'userId', select: 'username fullName profileImage' },
      { path: 'recipient', select: 'username fullName profileImage' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: newMessage }
    });

  } catch (error) {
    console.error('Send private message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Search messages
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q: query, type = 'global', page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filters = { messageType: type };
    if (type === 'private') {
      filters.$or = [
        { userId: req.userId },
        { recipient: req.userId }
      ];
    }

    const messages = await Message.searchMessages(query, filters, {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        messages,
        query,
        type,
        pagination: {
          current: parseInt(page),
          count: messages.length
        }
      }
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;