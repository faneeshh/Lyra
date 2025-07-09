const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Message = require('./models/Message');
const User = require('./models/User');

const onlineUsers = new Map(); // key: userId, value: socket.id

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

app.get('/', (req, res) => {
  res.send('Lyra backend is running');
});

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const testRoutes = require('./routes/testRoutes');
app.use('/api/test', testRoutes);

const journalRoutes = require('./routes/journalRoutes');
app.use('/api/journals', journalRoutes);

const commentRoutes = require('./routes/commentRoutes');
app.use('/api/comments', commentRoutes);

const followRoutes = require('./routes/followRoutes');
app.use('/api/follow', followRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

const reflectRoutes = require('./routes/reflectRoutes');
app.use('/api/reflect', reflectRoutes);

const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

const inboxRoutes = require('./routes/inboxRoutes');
app.use('/api/inbox', inboxRoutes);

const blockRoutes = require('./routes/blockRoutes');
app.use('/api/block', blockRoutes);

const reportRoutes = require('./routes/reportRoutes');
app.use('/api/report', reportRoutes);

const bookmarkRoutes = require('./routes/bookmarkRoutes');
app.use('/api/bookmarks', bookmarkRoutes);

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // You can restrict this later
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('⚡ New socket connection:', socket.id);

  // Join a user-specific room
  socket.on('join', (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id); // ✅ track online user
    console.log(`User ${userId} joined their room`);
  });

  // Handle sending messages
  socket.on('sendMessage', async ({ sender, receiver, content }) => {
    if (!sender || !receiver || !content) return;

    const senderUser = await User.findById(sender);
    const receiverUser = await User.findById(receiver);

    // Block check
    if (receiverUser.blocked.includes(sender)) {
      return socket.emit('errorMessage', {
        message: 'You are blocked by this user.',
      });
    }

    const message = await Message.create({ sender, receiver, content });

    // Emit to receiver's room
    io.to(receiver).emit('newMessage', {
      _id: message._id,
      sender,
      receiver,
      content,
      createdAt: message.createdAt,
    });

    const receiverSocketId = onlineUsers.get(receiver);

    if (!receiverSocketId) {
      // Receiver is offline — send email
      const sendEmail = require('./utils/sendEmail');
      const receiverUserDoc = await User.findById(receiver);

      if (receiverUserDoc?.email) {
        await sendEmail(
          receiverUserDoc.email,
          `New message on Lyra from @${senderUser.handle}`,
          `You have a new message: "${content}"\n\nLogin to Lyra to read and reply.`
        );
      }
    }
  });

  socket.on('disconnect', () => {
    // Remove user from onlineUsers map
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
