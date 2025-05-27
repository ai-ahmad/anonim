import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { MongoClient, ObjectId } from 'mongodb';
import bodyParser from 'body-parser';

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Environment variables
const token = process.env.BOT_TOKEN || '7950415832:AAH42TfP_fbDHFIXmJ8hKzGzEwgmC6EYs7I';
const mongoUrl = process.env.MONGO_URL || 'mongodb+srv://abuxzzzzzzz:abuxzz2008@cluster0.ks58st5.mongodb.net/telegramBotDB?retryWrites=true&w=majority';
const webhookUrl = process.env.WEBHOOK_URL || `https://anonim-tg-bot.onrender.com/webhook/${token}`;
const port = process.env.PORT || 10000;

// Initialize Telegram bot with webhook
const bot = new TelegramBot(token);
const client = new MongoClient(mongoUrl);

// Database collections
let db, usersCollection, messagesCollection, repliesCollection;

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    db = client.db();
    usersCollection = db.collection('users');
    messagesCollection = db.collection('messages');
    repliesCollection = db.collection('replies');

    // Create indexes for better performance
    await usersCollection.createIndex({ id: 1 }, { unique: true });
    await messagesCollection.createIndex({ receiverId: 1 });
    await messagesCollection.createIndex({ senderId: 1 });
    await repliesCollection.createIndex({ parentId: 1 });
    await repliesCollection.createIndex({ receiverId: 1 });
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

// Helper function to get user info
async function getUserInfo(userId) {
  const user = await usersCollection.findOne({ id: userId });
  return user || {
    username: 'Unknown',
    firstName: 'Unknown',
    lastName: '',
    joinDate: new Date(),
  };
}

// Object to track pending replies
const pendingReplies = {};

// Initialize the bot
async function initializeBot() {
  try {
    await connectDB();
    console.log('Bot initialization complete');

    // Set webhook
    await bot.setWebHook(webhookUrl);
    console.log(`Webhook set to: ${webhookUrl}`);

    // START command
    bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const refUserId = match[1];

      try {
        // Add/update user in DB
        await usersCollection.updateOne(
          { id: chatId },
          {
            $set: {
              username: msg.from.username || 'NoUsername',
              firstName: msg.from.first_name || '',
              lastName: msg.from.last_name || '',
              lastSeen: new Date(),
            },
            $setOnInsert: {
              joinDate: new Date(),
            },
          },
          { upsert: true }
        );

        if (refUserId && refUserId !== String(chatId)) {
          bot.sendMessage(chatId, '✉️ Write your anonymous message:');

          // Store the chat ID to handle the next message as an anonymous message
          pendingReplies[chatId] = {
            type: 'anonymous',
            refUserId: refUserId,
          };
        } else {
          const botInfo = await bot.getMe();
          bot.sendMessage(
            chatId,
            `👋 Hello! This is your personal anonymous link:\n\n` +
              `👉 https://t.me/${botInfo.username}?start=${chatId}\n\n` +
              `Share this link with others to receive anonymous messages.`
          );
        }
      } catch (error) {
        console.error('Error in /start command:', error);
        bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
      }
    });

    // Regular message handler for pending replies
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const pending = pendingReplies[chatId];

      if (!pending || msg.text?.startsWith('/')) {
        return; // Not a pending reply or it's a command
      }

      try {
        if (pending.type === 'anonymous') {
          const senderInfo = await getUserInfo(chatId);
          const refUserId = pending.refUserId;

          const messageResult = await messagesCollection.insertOne({
            senderId: chatId,
            receiverId: refUserId,
            message: msg.text,
            timestamp: new Date(),
            read: false,
            senderInfo: {
              username: senderInfo.username,
              firstName: senderInfo.firstName,
              lastName: senderInfo.lastName,
            },
          });

          const receiverMessage = `📩 New anonymous message:\n\n${msg.text}\n\n` +
            `👤 Sender: ${senderInfo.firstName} ${senderInfo.lastName}\n` +
            `🔗 Username: @${senderInfo.username}\n` +
            `🆔 Sender ID: ${chatId}\n` +
            `⏱️ Time: ${new Date().toLocaleString()}`;

          try {
            await bot.sendMessage(refUserId, receiverMessage, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '✍️ Reply',
                      callback_data: `reply_message_${messageResult.insertedId}`,
                    },
                  ],
                ],
              },
            });
            await bot.sendMessage(chatId, '✅ Your message has been sent!');
          } catch (err) {
            if (err.response?.statusCode === 403) {
              await bot.sendMessage(chatId, '❌ The user has blocked the bot, message not delivered.');
            } else {
              throw err;
            }
          }

          delete pendingReplies[chatId];
        } else if (pending.type === 'reply') {
          const parentId = pending.parentId;
          const parentType = pending.parentType; // 'message' or 'reply'
          let receiverId, originalMessage;

          if (parentType === 'message') {
            originalMessage = await messagesCollection.findOne({
              _id: new ObjectId(parentId),
            });
            receiverId = originalMessage.senderId;
          } else {
            const parentReply = await repliesCollection.findOne({
              _id: new ObjectId(parentId),
            });
            receiverId = parentReply.senderId;
            originalMessage = await messagesCollection.findOne({
              _id: new ObjectId(parentReply.originalMessageId),
            });
          }

          if (!originalMessage) {
            bot.sendMessage(chatId, '❌ Original message not found!');
            return;
          }

          const replyResult = await repliesCollection.insertOne({
            originalMessageId: originalMessage._id.toString(),
            parentId: parentId,
            parentType: parentType,
            senderId: chatId,
            receiverId: receiverId,
            message: msg.text,
            timestamp: new Date(),
          });

          try {
            await bot.sendMessage(
              receiverId,
              `📨 Reply to your message:\n\n${msg.text}\n\n` +
                `💬 Original: "${originalMessage.message.substring(0, 50)}${originalMessage.message.length > 50 ? '...' : ''}"\n` +
                `⏱️ Time: ${new Date().toLocaleString()}`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '✍️ Reply',
                        callback_data: `reply_reply_${replyResult.insertedId}`,
                      },
                    ],
                  ],
                },
              }
            );
            await bot.sendMessage(chatId, '✅ Reply sent successfully!');
          } catch (err) {
            if (err.response?.statusCode === 403) {
              await bot.sendMessage(chatId, '❌ User has blocked the bot, reply not delivered.');
            } else {
              throw err;
            }
          }

          delete pendingReplies[chatId];
        }
      } catch (error) {
        console.error('Error processing pending reply:', error);
        bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
        delete pendingReplies[chatId];
      }
    });

    // HISTORY command
    bot.onText(/\/history/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const messages = await messagesCollection
          .find({
            receiverId: String(chatId),
          })
          .sort({ timestamp: -1 })
          .toArray();

        if (messages.length === 0) {
          bot.sendMessage(chatId, '📭 You have no anonymous messages yet.');
          return;
        }

        for (const msg of messages) {
          // Fetch all replies for this message
          const replies = await repliesCollection
            .find({
              originalMessageId: msg._id.toString(),
            })
            .sort({ timestamp: 1 })
            .toArray();

          let messageText = `📩 Anonymous message:\n\n${msg.message}\n\n` +
            `👤 From: ${msg.senderInfo.firstName} ${msg.senderInfo.lastName}\n` +
            `🔗 Username: @${msg.senderInfo.username}\n` +
            `🆔 Sender ID: ${msg.senderId}\n` +
            `⏱️ Time: ${new Date(msg.timestamp).toLocaleString()}\n\n`;

          if (replies.length > 0) {
            messageText += `💬 Conversation thread (${replies.length} replies):\n`;
            for (const [index, reply] of replies.entries()) {
              const senderInfo = await getUserInfo(reply.senderId);
              messageText += `  #${index + 1}: ${reply.message}\n` +
                `  👤 From: ${senderInfo.firstName} ${senderInfo.lastName}\n` +
                `  ⏱️ Time: ${new Date(reply.timestamp).toLocaleString()}\n\n`;
            }
          }

          const replyMarkup = {
            inline_keyboard: [
              [
                {
                  text: '✍️ Reply',
                  callback_data: `reply_message_${msg._id}`,
                },
              ],
            ],
          };

          bot.sendMessage(chatId, messageText, { reply_markup: replyMarkup });
        }
      } catch (error) {
        console.error('Error in /history command:', error);
        bot.sendMessage(chatId, '❌ Failed to load message history.');
      }
    });

    // REPLY TO MESSAGE OR REPLY
    bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const data = query.data;

      try {
        if (data.startsWith('reply_message_')) {
          const messageId = data.split('_')[2];
          const originalMsg = await messagesCollection.findOne({
            _id: new ObjectId(messageId),
          });

          if (!originalMsg) {
            await bot.answerCallbackQuery(query.id, { text: 'Message not found!' });
            return;
          }

          pendingReplies[chatId] = {
            type: 'reply',
            parentId: messageId,
            parentType: 'message',
          };

          await bot.sendMessage(chatId, `✍️ Write your reply to ${originalMsg.senderInfo.firstName}:`);
          await bot.answerCallbackQuery(query.id);
        } else if (data.startsWith('reply_reply_')) {
          const replyId = data.split('_')[2];
          const originalReply = await repliesCollection.findOne({
            _id: new ObjectId(replyId),
          });

          if (!originalReply) {
            await bot.answerCallbackQuery(query.id, { text: 'Reply not found!' });
            return;
          }

          pendingReplies[chatId] = {
            type: 'reply',
            parentId: replyId,
            parentType: 'reply',
          };

          const senderInfo = await getUserInfo(originalReply.senderId);
          await bot.sendMessage(chatId, `✍️ Write your reply to ${senderInfo.firstName}:`);
          await bot.answerCallbackQuery(query.id);
        }
      } catch (error) {
        console.error('Error in reply callback:', error);
        await bot.answerCallbackQuery(query.id, { text: 'Error processing reply!' });
      }
    });

    // VIEW REPLIES command
    bot.onText(/\/replies/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const replies = await repliesCollection
          .find({
            receiverId: String(chatId),
          })
          .sort({ timestamp: -1 })
          .toArray();

        if (replies.length === 0) {
          bot.sendMessage(chatId, '📭 You have no replies yet.');
          return;
        }

        let response = `📨 Your replies (${replies.length}):\n\n`;

        for (const [index, reply] of replies.entries()) {
          const originalMsg = await messagesCollection.findOne({
            _id: new ObjectId(reply.originalMessageId),
          });

          response += `#${index + 1}\n` +
            `📝 Reply: ${reply.message}\n` +
            `💬 To your message: "${originalMsg?.message.substring(0, 50)}${originalMsg?.message.length > 50 ? '...' : ''}"\n` +
            `⏱️ Time: ${new Date(reply.timestamp).toLocaleString()}\n\n`;

          const replyMarkup = {
            inline_keyboard: [
              [
                {
                  text: '✍️ Reply',
                  callback_data: `reply_reply_${reply._id}`,
                },
              ],
            ],
          };

          bot.sendMessage(chatId, response, { reply_markup: replyMarkup });
          response = ''; // Reset for the next message if needed
        }
      } catch (error) {
        console.error('Error in /replies command:', error);
        bot.sendMessage(chatId, '❌ Failed to load replies.');
      }
    });

    // Error handling
    bot.on('webhook_error', (error) => {
      console.error('Webhook error:', error);
    });

    process.on('SIGINT', async () => {
      await client.close();
      console.log('MongoDB connection closed');
      process.exit();
    });

    console.log('Bot is running...');
  } catch (error) {
    console.error('Bot initialization failed:', error);
    process.exit(1);
  }
}

// Webhook endpoint
app.post(`/webhook/${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Bot is running');
});

// Start the server
app.listen(port, async () => {
  console.log(`Bot server running on port ${port}`);
  await initializeBot();
});