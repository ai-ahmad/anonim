// require('dotenv').config();
// const TelegramBot = require('node-telegram-bot-api');

// // .env faylidan o'qish yoki default qiymat (default ishlatmaslik yaxshiroq)
// const TOKEN = process.env.BOT_TOKEN 
// const LOG_CHANNEL_ID = process.env.CHANNEL_ID
// const BOT_USERNAME = process.env.BOT_USERNAME 
// const NEW_USERS_LOG_CHANNEL_ID = process.env.NEW_USERS_LOG_CHANNEL_ID || LOG_CHANNEL_ID;

// // .env tekshiruvi
// if (!TOKEN) { console.error("XATOLIK: .env da BOT_TOKEN yo'q!"); process.exit(1); }
// if (!LOG_CHANNEL_ID) { console.error("XATOLIK: .env da LOG_CHANNEL_ID yo'q!"); process.exit(1); }
// if (!BOT_USERNAME) { console.error("XATOLIK: .env da BOT_USERNAME yo'q!"); process.exit(1); }

// const bot = new TelegramBot(TOKEN, { polling: true });

// // Xotira
// const userStore = {}; // Foydalanuvchi ma'lumotlari
// const writingTo = {}; // Deep link orqali birinchi xabarni kimga yozmoqchi
// const conversationMap = {}; // Suhbatlarni bog'lash uchun: Key: bot_msg_id, Value: {replyGoesToUserId, replyGoesToChatId, replyFromDisplayName}

// // Konsol loglari va yordamchi funksiyalar (avvalgidek)
// console.log('------------------------------------');
// console.log('Bot ishga tushirilmoqda...');
// console.log(`Yopiq log kanali (asosiy): ${LOG_CHANNEL_ID}`);
// if (NEW_USERS_LOG_CHANNEL_ID && NEW_USERS_LOG_CHANNEL_ID !== LOG_CHANNEL_ID) {
//     console.log(`Yangi foydalanuvchilar uchun log kanali: ${NEW_USERS_LOG_CHANNEL_ID}`);
// } else {
//     console.log(`Yangi foydalanuvchilar logi asosiy log kanaliga yuboriladi.`);
// }
// console.log(`Bot username: @${BOT_USERNAME}`);
// console.log('------------------------------------');
// function generateUniqueLinkParam(userId) { return `u${userId}`; }
// function getUserIdFromLinkParam(param) { /* ... avvalgidek ... */ if (param && param.startsWith('u')) { const s = param.substring(1); if (!isNaN(s)) return parseInt(s, 10); } return null; }
// function formatDateTime(timestamp) { /* ... avvalgidek ... */ const d = new Date(timestamp * 1000); return d.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }); }
// async function logToChannel(channelId, message, options = { parse_mode: 'Markdown' }) { /* ... avvalgidek ... */ console.log(`LOG_ATTEMPT: Kanal ID: ${channelId}`); try { await bot.sendMessage(channelId, message, options); console.log(`LOG_SUCCESS: ${channelId} ga log yozildi.`); } catch (e) { console.error(`LOG_ERROR: ${channelId} ga yozishda xato:`, e.message); if (e.response?.body) console.error("DETAILS:", e.response.body); } }

// // /start buyrug'i (o'zgarishsiz, faqat yangi user logi va writingTo ishlatiladi)
// bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
//     const chatId = msg.chat.id;
//     const userId = msg.from.id;
//     const username = msg.from.username;
//     const firstName = msg.from.first_name || "Foydalanuvchi";
//     const lastName = msg.from.last_name || "";
//     const fullName = `${firstName} ${lastName}`.trim();
//     const languageCode = msg.from.language_code || "Noma'lum";
//     const messageTime = formatDateTime(msg.date);
//     const deepLinkParam = match && match[1] ? match[1] : null;

//     console.log(`EVENT: /start - User: ${fullName} (${username ? '@' + username : 'usernamesiz'}, ID: ${userId}), Param: ${deepLinkParam}`);

//     let userAlreadyLogged = userStore[userId] && userStore[userId].loggedToChannel;

//     if (!userStore[userId]) {
//         userStore[userId] = { chatId, username, firstName, lastName, uniqueLinkParam: generateUniqueLinkParam(userId), joinDate: messageTime, languageCode, loggedToChannel: false };
//         console.log(`USER_STORE: Yangi user saqlandi: ${fullName} (ID: ${userId})`);
//         userAlreadyLogged = false;
//     } else {
//         Object.assign(userStore[userId], { chatId, username, firstName, lastName, languageCode });
//         if (!userStore[userId].uniqueLinkParam) userStore[userId].uniqueLinkParam = generateUniqueLinkParam(userId);
//         console.log(`USER_STORE: User ma'lumotlari yangilandi: ${fullName} (ID: ${userId})`);
//     }

//     if (!userAlreadyLogged) {
//         let userMentionText = username ? `@${username}` : `[${fullName || 'Foydalanuvchi'}](tg://user?id=${userId})`;
//         let referredByText = "";
//         if (deepLinkParam) {
//             const referredByUserId = getUserIdFromLinkParam(deepLinkParam);
//             if (referredByUserId) {
//                 const rInfo = userStore[referredByUserId];
//                 let rDisplay = `ID: \`${referredByUserId}\``;
//                 if (rInfo) {
//                     const rFullName = `${rInfo.firstName || ''} ${rInfo.lastName || ''}`.trim();
//                     rDisplay = rInfo.username ? `@${rInfo.username}` : `[${rFullName || 'Foydalanuvchi'}](tg://user?id=${referredByUserId})`;
//                 }
//                 referredByText = `\n🔗 **Kim orqali:** ${rDisplay}`;
//             } else { referredByText = `\n🔗 **Parametr orqali:** _Noto'g'ri (\`${deepLinkParam}\`)_`; }
//         }
//         const logMsg = `🆕 **YANGI FOYDALANUVCHI**\n\n👤 **Nickname:** ${firstName}\n👤 **User:** ${userMentionText}\n🆔 **ID:** \`${userId}\`\n🌐 **Til:** ${languageCode}\n📅 **Vaqt:** ${messageTime}${referredByText}`;
//         await logToChannel(NEW_USERS_LOG_CHANNEL_ID, logMsg, { parse_mode: 'Markdown' });
//         if (userStore[userId]) userStore[userId].loggedToChannel = true;
//         console.log(`LOG_STATUS: User ${userId} kanalga log qilindi.`);
//     } else { console.log(`LOG_STATUS: User ${userId} avval log qilingan, qayta yuborilmadi.`); }

//     if (deepLinkParam) {
//         const targetId = getUserIdFromLinkParam(deepLinkParam);
//         if (targetId && userStore[targetId]) {
//             const tInfo = userStore[targetId];
//             const tName = tInfo.username ? `@${tInfo.username}` : `${tInfo.firstName || ''} ${tInfo.lastName || ''}`.trim() || "Foydalanuvchi";
//             if (userId === targetId) {
//                 bot.sendMessage(chatId, `Salom, ${fullName}! 👋\n\nBu sizning shaxsiy havolangiz, ushbu havola orqali sizga anonim xabar yozishlari mumkin:\n\n\`https://t.me/${BOT_USERNAME}?start=${userStore[userId].uniqueLinkParam}\`\n\n`, { parse_mode: 'Markdown' });
//                 delete writingTo[userId];
//             } else {
//                 writingTo[userId] = targetId;
//                 bot.sendMessage(chatId, `Salom, ${fullName}! Anonim xabaringizni yozing:`, { parse_mode: 'Markdown' });
//             }
//         } else {
//             bot.sendMessage(chatId, `Salom, ${fullName}! 👋\n\nUzr, siz ochgan havola yaroqsiz yoki eskirgan.\n\nBu sizning shaxsiy manzilingiz, buni do'stlaringizga tarqating:\n\`https://t.me/${BOT_USERNAME}?start=${userStore[userId].uniqueLinkParam}\``, { parse_mode: 'Markdown' });
//             delete writingTo[userId];
//         }
//     } else {
//         bot.sendMessage(chatId, `Salom, ${fullName}! 👋\n\nBu sizning shaxsiy havolangiz, ushbu havola orqali sizga anonim xabar yozishlari mumkin:\n\n\`https://t.me/${BOT_USERNAME}?start=${userStore[userId].uniqueLinkParam}\`\n\n`, { parse_mode: 'Markdown' });
//         delete writingTo[userId];
//     }
// });

// // /send buyrug'i (endi conversationMap ishlatadi)
// bot.onText(/\/send @(\S+) (.+)/s, async (msg, match) => {
//     const senderChatId = msg.chat.id;
//     const senderUserId = msg.from.id;
//     const senderInfo = userStore[senderUserId];
//     if (!senderInfo) { bot.sendMessage(senderChatId, "Iltimos, avval /start bering."); return; }
//     const senderFullName = `${senderInfo.firstName || ''} ${senderInfo.lastName || ''}`.trim();
//     const senderDisplayName = senderInfo.username ? `@${senderInfo.username}` : (senderFullName || `ID:${senderUserId}`);
//     const messageTime = formatDateTime(msg.date);

//     const targetUsernameRaw = match[1];
//     const targetUsernameLower = targetUsernameRaw.toLowerCase();
//     const messageText = match[2];

//     console.log(`EVENT: /send - Kimdan: ${senderDisplayName} (ID: ${senderUserId}), Kimga: @${targetUsernameRaw}, Matn: "${messageText.substring(0, 30)}..."`);

//     let logMessageContent = `➡️ **XABAR (/send orqali)**\n\n` +
//         `👤 **Kimdan:** ${senderDisplayName} (ID: \`${senderUserId}\`)\n` +
//         `🎯 **Kimga (username):** @${targetUsernameRaw}\n`;

//     let targetUserInfo = null;
//     for (const uid in userStore) {
//         if (userStore[uid].username && userStore[uid].username.toLowerCase() === targetUsernameLower) {
//             targetUserInfo = userStore[uid];
//             break;
//         }
//     }

//     if (targetUserInfo) {
//         const targetFullName = `${targetUserInfo.firstName || ''} ${targetUserInfo.lastName || ''}`.trim();
//         logMessageContent += `🎯 **Kimga (ID):** \`${targetUserInfo.id}\` (${targetUserInfo.username ? '@' + targetUserInfo.username : targetFullName || 'Noma\'lum'}) \n`;
//     } else {
//         logMessageContent += `🎯 **Kimga (ID):** _Noma'lum (@${targetUsernameRaw} botni /start qilmagan)_\n`;
//     }

//     logMessageContent += `💬 **Matn:**\n${messageText}\n` + `📅 **Vaqt:** ${messageTime}\n\n`;
//     let directSendConfirmation = "✅ Xabaringiz yopiq kanalga yozildi.";

//     if (targetUserInfo && targetUserInfo.chatId && targetUserInfo.id !== senderUserId) {
//         const targetChatId = targetUserInfo.chatId;
//         const targetUserId = targetUserInfo.id;
//         const targetDisplayName = targetUserInfo.username ? `@${targetUserInfo.username}` : `${targetUserInfo.firstName || ''} ${targetUserInfo.lastName || ''}`.trim() || 'Foydalanuvchi';
//         try {
//             const directMessageToTarget = `🔔 **Sizga anonim xabar (\`/send\` orqali):**\n\n${messageText}\n\n` +
//                 `_Javob uchun ushbu xabarga "reply" qiling._`;
//             const sentToTargetMsg = await bot.sendMessage(targetChatId, directMessageToTarget, { parse_mode: 'Markdown' });

//             // Suhbatni bog'lash
//             conversationMap[sentToTargetMsg.message_id] = {
//                 replyGoesToUserId: senderUserId,
//                 replyGoesToChatId: senderChatId,
//                 replyFromDisplayName: targetDisplayName // Bu xabar kimdan kelganini ko'rsatish uchun
//             };

//             logMessageContent += `📡 **Status:** @${targetUserInfo.username || targetUserInfo.firstName} ga yuborildi.`;
//             directSendConfirmation += ` Va @${targetUserInfo.username || targetUserInfo.firstName} ga yetkazildi.`;
//         } catch (error) {
//             console.error(`SEND_DIRECT_ERROR: @${targetUsernameRaw} ga /send da xato:`, error.message);
//             let errorDetails = error.response && error.response.body ? error.response.body.description : error.message;
//             logMessageContent += `📡 **Status:** @${targetUsernameRaw} ga yuborishda xato: ${errorDetails}`;
//             directSendConfirmation += ` Ammo @${targetUsernameRaw} ga yetkazishda xato.`;
//         }
//     } else if (targetUserInfo && targetUserInfo.id === senderUserId) {
//         logMessageContent += `📡 **Status:** O'z-o'ziga /send. Yuborilmadi.`;
//         directSendConfirmation = "❌ O'zingizga \`/send\` qila olmaysiz.";
//     } else {
//         logMessageContent += `📡 **Status:** To'g'ridan-to'g'ri yuborilmadi (@${targetUsernameRaw} topilmadi).`;
//         directSendConfirmation += ` Ammo @${targetUsernameRaw} ga yetkaza olmadik.`;
//     }

//     await logToChannel(LOG_CHANNEL_ID, logMessageContent);
//     bot.sendMessage(senderChatId, directSendConfirmation, { parse_mode: 'Markdown' });
//     if (writingTo[senderUserId]) delete writingTo[senderUserId]; // Agar /send paytida yozish rejimida bo'lsa
// });


// // Asosiy xabarlarni qayta ishlash (reply va yangi deep link xabarlari)
// bot.on('message', async (msg) => {
//     const senderChatId = msg.chat.id;
//     const senderUserId = msg.from.id;
//     const text = msg.text;
//     const messageTime = formatDateTime(msg.date);

//     // Buyruqlarni e'tiborsiz qoldirish
//     if (!text || text.startsWith('/')) return;

//     const senderUserInfo = userStore[senderUserId];
//     // Agar /start bosmagan bo'lsa, yoki boshqa sabab bilan userStoreda yo'q bo'lsa
//     if (!senderUserInfo) {
//         // bot.sendMessage(senderChatId, "Iltimos, avval /start buyrug'ini bering."); // Bu xabarni kerak bo'lsa yoqish mumkin
//         return;
//     }
//     const senderFullName = `${senderUserInfo.firstName || ''} ${senderUserInfo.lastName || ''}`.trim();
//     const senderDisplayName = senderUserInfo.username ? `@${senderUserInfo.username}` : (senderFullName || `ID:${senderUserId}`);

//     console.log(`EVENT: Matnli xabar - User: ${senderDisplayName} (ID: ${senderUserId}), Matn: "${text.substring(0, 30)}..."`);

//     // === Ikki tomonlama REPLY logikasi ===
//     if (msg.reply_to_message && msg.reply_to_message.from.is_bot && msg.reply_to_message.from.username === BOT_USERNAME) {
//         const repliedToBotMsgId = msg.reply_to_message.message_id;
//         const conversationData = conversationMap[repliedToBotMsgId];

//         if (conversationData) {
//             console.log(`REPLY_HANDLER: Bot xabariga javob aniqlandi (msg_id: ${repliedToBotMsgId}).`);
//             const { replyGoesToUserId, replyGoesToChatId, replyFromDisplayName } = conversationData; // replyFromDisplayName = kimdan xabar kelgan edi

//             const targetUserIdForThisReply = replyGoesToUserId;
//             const targetChatIdForThisReply = replyGoesToChatId;
//             const targetUserInfoForThisReply = userStore[targetUserIdForThisReply];

//             if (targetUserInfoForThisReply && targetChatIdForThisReply) {
//                 const targetDisplayNameForThisReply = targetUserInfoForThisReply.username ? `@${targetUserInfoForThisReply.username}` : `${targetUserInfoForThisReply.firstName || ''} ${targetUserInfoForThisReply.lastName || ''}`.trim() || `ID:${targetUserIdForThisReply}`;
//                 try {
//                     // Replyni kerakli odamga (asl jo'natuvchi yoki oldingi javob beruvchiga) yuborish
//                     const sentReply = await bot.sendMessage(targetChatIdForThisReply,
//                         `↪️ **Javob keldi:**\n\n${text}\n\nJavob berish uchun ushbu xabarga "reply" qiling.`, //senderDisplayName = hozir javob yozayotgan odam
//                         { parse_mode: "Markdown" }
//                     );

//                     // Yangi mappingni yaratish (keyingi javob uchun)
//                     conversationMap[sentReply.message_id] = {
//                         replyGoesToUserId: senderUserId, // Javob endi bu replyni yozgan odamga (sender) qaytadi
//                         replyGoesToChatId: senderChatId,
//                         replyFromDisplayName: targetDisplayNameForThisReply // Bu xabar kimdan kelganini ko'rsatish uchun
//                     };
//                     console.log(`CONVERSATION_MAP: Yangi mapping qo'shildi (key: ${sentReply.message_id})`);

//                     bot.sendMessage(senderChatId, `✅ Javobingiz yuborildi.`); // Javob yozganga tasdiq

//                     // Kanalga log
//                     const logMsg = `↩️ **SUHBAT JAVOBI**\n\n` +
//                         `🗣️ **Kimdan:** ${senderDisplayName} (ID: \`${senderUserId}\`)\n\n` +
//                         `👤 **Kimga:** ${targetDisplayNameForThisReply} (ID: \`${targetUserIdForThisReply}\`)\n\n` +
//                         `💬 **Matn:**\n${text}\n\n` +
//                         `📅 **Vaqt:** ${messageTime}`;
//                     await logToChannel(LOG_CHANNEL_ID, logMsg);

//                 } catch (error) {
//                     console.error("CONV_REPLY_ERROR:", error.message);
//                     bot.sendMessage(senderChatId, "❌ Javobingizni yuborishda xatolik.");
//                 }
//             } else {
//                 bot.sendMessage(senderChatId, "❌ Javob yuboriladigan foydalanuvchi topilmadi yoki uning chat ma'lumotlari yo'q.");
//             }
//             return; // Reply qayta ishlandi, boshqa logikaga o'tmaymiz
//         } else {
//             // Agar reply qilingan xabar conversationMapda bo'lmasa
//             console.log(`REPLY_HANDLER_WARN: Reply qilingan xabar (msg_id: ${repliedToBotMsgId}) conversationMap da topilmadi.`);
//             // Foydalanuvchiga tushuntirish berish mumkin yoki e'tiborsiz qoldirish
//             // bot.sendMessage(senderChatId, "Bu eski xabar bo'lishi mumkin, unga javob bera olmaysiz.");
//             // return; // Agar javob bera olmasligini aytmoqchi bo'lsak
//         }
//     }

//     // === YANGI SUHBAT BOSHLANISHI (Deep Link orqali birinchi xabar) ===
//     if (writingTo[senderUserId]) {
//         console.log(`WRITING_MODE_MESSAGE: User ${senderDisplayName} (ID: ${senderUserId}) yozish rejimida.`);
//         const targetUserId = writingTo[senderUserId];
//         const targetUserInfo = userStore[targetUserId];

//         if (targetUserInfo && targetUserInfo.chatId) {
//             const targetDisplayName = targetUserInfo.username ? `@${targetUserInfo.username}` : `${targetUserInfo.firstName || ''} ${targetUserInfo.lastName || ''}`.trim() || `ID:${targetUserId}`;
//             const targetChatId = targetUserInfo.chatId;

//             try {
//                 const firstMessageToTarget = await bot.sendMessage(targetChatId,
//                     `🔔 **Sizga anonim xabar keldi:**\n\n${text}\n\n` + // Kimdan kelganini ko'rsatish (ixtiyoriy)
//                     `_Javob berish uchun ushbu xabarga "reply" qiling._`,
//                     { parse_mode: "Markdown" }
//                 );

//                 // Suhbatni bog'lash
//                 conversationMap[firstMessageToTarget.message_id] = {
//                     replyGoesToUserId: senderUserId,       // Javob asl jo'natuvchiga (B) boradi
//                     replyGoesToChatId: senderChatId,
//                     replyFromDisplayName: targetDisplayName // Bu xabar kimdan kelganini ko'rsatish uchun (A)
//                 };
//                 console.log(`CONVERSATION_MAP: Yangi mapping qo'shildi (key: ${firstMessageToTarget.message_id})`);

//                 bot.sendMessage(senderChatId, `✅ Xabaringiz anonim tarzda yuborildi.`);

//                 const logMsg = `➡️ **YANGI ANONIM XABAR (Deep Link)**\n\n` +
//                     `👤 **Kimdan (anonim):** ${senderDisplayName} (ID: \`${senderUserId}\`)\n\n` +
//                     `🎯 **Kimga (manzil egasi):** ${targetDisplayName} (ID: \`${targetUserId}\`)\n\n` +
//                     `💬 **Birinchi xabar:**\n${text}\n\n` +
//                     `📅 **Vaqt:** ${messageTime}`;
//                 await logToChannel(LOG_CHANNEL_ID, logMsg);

//                 delete writingTo[senderUserId]; // Birinchi xabardan keyin "yozish rejimi"ni tozalash

//             } catch (error) {
//                 console.error("NEW_ANON_MSG_ERROR:", error.message);
//                 bot.sendMessage(senderChatId, `❌ Xabaringizni ${targetDisplayName} ga yuborishda xatolik.`);
//                 delete writingTo[senderUserId];
//             }
//         } else {
//             bot.sendMessage(senderChatId, "Xabar yuboriladigan foydalanuvchi topilmadi.");
//             delete writingTo[senderUserId];
//         }
//         return; // Yangi xabar qayta ishlandi
//     }

//     // Agar oddiy matn bo'lsa va reply ham emas, yozish rejimida ham emas
//     // bot.sendMessage(senderChatId, "Nima qilmoqchi ekanligingizni tushunmadim. /start yoki shaxsiy havola orqali yozing.");

// });


// bot.on('polling_error', (error) => {
//     console.error(`POLLING_ERROR: ${error.code} - ${error.message}`);
//     if (error.message && error.message.includes("ETELEGRAM: 409 Conflict")) {
//         console.error("POLLING_ERROR_ADVICE: Botning faqat bitta nusxasi ishlayotganiga ishonch hosil qiling! Muammo davom etsa, bot tokenini @BotFather orqali almashtiring.");
//     }
// });

// process.on('SIGINT', () => {
//     console.log('------------------------------------');
//     console.log("Bot to'xtatilmoqda (SIGINT)...");
//     // Kelajakda: userStore, conversationMap ni faylga saqlash
//     console.log('------------------------------------');
//     process.exit(0);
// });

// console.log("Bot xabarlarni kutishni boshladi...");

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express'); // <--- PORT UCHUN QO'SHILDI

// .env faylidan o'qish yoki default qiymat
const TOKEN = process.env.BOT_TOKEN;
const LOG_CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME;
const NEW_USERS_LOG_CHANNEL_ID = process.env.NEW_USERS_LOG_CHANNEL_ID || LOG_CHANNEL_ID;

// --- PORT VA WEBHOOK UCHUN YANGI O'ZGARUVCHILAR ---
const PORT = process.env.PORT || 3000; // Server ishlaydigan port
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Botga xabarlar yuboriladigan URL
// --------------------------------------------------

// .env tekshiruvi
if (!TOKEN) { console.error("XATOLIK: .env da BOT_TOKEN yo'q!"); process.exit(1); }
if (!LOG_CHANNEL_ID) { console.error("XATOLIK: .env da LOG_CHANNEL_ID yo'q!"); process.exit(1); }
if (!BOT_USERNAME) { console.error("XATOLIK: .env da BOT_USERNAME yo'q!"); process.exit(1); }
// --- WEBHOOK_URL TEKSHIRUVI ---
if (!WEBHOOK_URL) {
    console.error("XATOLIK: .env da WEBHOOK_URL yo'q! Masalan: https://yourdomain.com");
    process.exit(1);
}
// -----------------------------

// const bot = new TelegramBot(TOKEN, { polling: true }); // <-- POLLING O'CHIRILDI
const bot = new TelegramBot(TOKEN); // <-- WEBHOOK UCHUN SHUNDAY BO'LADI

// Xotira (SIZNING KODINGIZ - O'ZGARISHSIZ)
const userStore = {};
const writingTo = {};
const conversationMap = {};

// Konsol loglari va yordamchi funksiyalar (SIZNING KODINGIZ - O'ZGARISHSIZ)
console.log('------------------------------------');
console.log('Bot ishga tushirilmoqda (Webhook rejimi)...'); // Log o'zgartirildi
console.log(`Yopiq log kanali (asosiy): ${LOG_CHANNEL_ID}`);
if (NEW_USERS_LOG_CHANNEL_ID && NEW_USERS_LOG_CHANNEL_ID !== LOG_CHANNEL_ID) {
    console.log(`Yangi foydalanuvchilar uchun log kanali: ${NEW_USERS_LOG_CHANNEL_ID}`);
} else {
    console.log(`Yangi foydalanuvchilar logi asosiy log kanaliga yuboriladi.`);
}
console.log(`Bot username: @${BOT_USERNAME}`);
console.log('------------------------------------');
function generateUniqueLinkParam(userId) { return `u${userId}`; }
function getUserIdFromLinkParam(param) { if (param && param.startsWith('u')) { const s = param.substring(1); if (!isNaN(s)) return parseInt(s, 10); } return null; }
function formatDateTime(timestamp) { const d = new Date(timestamp * 1000); return d.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }); }
async function logToChannel(channelId, message, options = { parse_mode: 'Markdown' }) { console.log(`LOG_ATTEMPT: Kanal ID: ${channelId}`); try { await bot.sendMessage(channelId, message, options); console.log(`LOG_SUCCESS: ${channelId} ga log yozildi.`); } catch (e) { console.error(`LOG_ERROR: ${channelId} ga yozishda xato:`, e.message); if (e.response?.body) console.error("DETAILS:", e.response.body); } }


// --- EXPRESS SERVER VA WEBHOOK SOZLAMALARI (PORT UCHUN QO'SHILDI) ---
const app = express();
app.use(express.json()); // Telegramdan keladigan JSONni tushunish uchun

// Webhook uchun maxfiy yo'l (URLga qo'shiladi)
// Bu token yoki boshqa maxfiy satr bo'lishi mumkin
const secretPath = `/webhook/${TOKEN}`; // Misol, TOKENni ishlatish
const fullWebhookUrl = `${WEBHOOK_URL.replace(/\/$/, '')}${secretPath}`; // Oxiridagi / ni olib tashlash

// Telegramdan yangilanishlarni qabul qilish uchun endpoint
app.post(secretPath, (req, res) => {
    bot.processUpdate(req.body); // Botga yangilanishni yuborish
    res.sendStatus(200);         // Telegramga OK javobini qaytarish
});

// Webhookni Telegramga o'rnatish
bot.setWebHook(fullWebhookUrl)
    .then(() => {
        console.log(`Webhook muvaffaqiyatli o'rnatildi: ${fullWebhookUrl}`);
        // Serverni faqat webhook o'rnatilgandan keyin ishga tushirish
        app.listen(PORT, '0.0.0.0', () => { // '0.0.0.0' barcha mavjud tarmoq interfeyslarida tinglash uchun
            console.log(`Bot serveri ${PORT}-portda ishga tushdi...`);
            console.log(`Bot xabarlarni webhook orqali ${fullWebhookUrl} manzilida kutmoqda...`);
        });
    })
    .catch((error) => {
        console.error("Webhook o'rnatishda xato:", error.message);
        if (error.response && error.response.body) {
            console.error("Telegram API javobi:", error.response.body.description);
        }
        process.exit(1);
    });
// ----------------------------------------------------------------------

// /start buyrug'i (SIZNING KODINGIZ - FUNKSIYASI O'ZGARISHSIZ)
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username;
    const firstName = msg.from.first_name || "Foydalanuvchi";
    const lastName = msg.from.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const languageCode = msg.from.language_code || "Noma'lum";
    const messageTime = formatDateTime(msg.date);
    const deepLinkParam = match && match[1] ? match[1] : null;

    console.log(`EVENT: /start - User: ${fullName} (${username ? '@' + username : 'usernamesiz'}, ID: ${userId}), Param: ${deepLinkParam}`);

    let userAlreadyLogged = userStore[userId] && userStore[userId].loggedToChannel;

    if (!userStore[userId]) {
        userStore[userId] = { chatId, username, firstName, lastName, uniqueLinkParam: generateUniqueLinkParam(userId), joinDate: messageTime, languageCode, loggedToChannel: false, id: userId };
        console.log(`USER_STORE: Yangi user saqlandi: ${fullName} (ID: ${userId})`);
        userAlreadyLogged = false;
    } else {
        Object.assign(userStore[userId], { chatId, username, firstName, lastName, languageCode, id: userId });
        if (!userStore[userId].uniqueLinkParam) userStore[userId].uniqueLinkParam = generateUniqueLinkParam(userId);
        console.log(`USER_STORE: User ma'lumotlari yangilandi: ${fullName} (ID: ${userId})`);
    }

    if (!userAlreadyLogged) {
        let userMentionText = username ? `@${username}` : `[${fullName || 'Foydalanuvchi'}](tg://user?id=${userId})`;
        let referredByText = "";
        if (deepLinkParam) {
            const referredByUserId = getUserIdFromLinkParam(deepLinkParam);
            if (referredByUserId && userStore[referredByUserId]) { // referredByUserId mavjudligini va userStoreda borligini tekshirish
                const rInfo = userStore[referredByUserId];
                let rDisplay = `ID: \`${referredByUserId}\``;
                // if (rInfo) { // Yuqorida tekshirildi
                const rFullName = `${rInfo.firstName || ''} ${rInfo.lastName || ''}`.trim();
                rDisplay = rInfo.username ? `@${rInfo.username}` : `[${rFullName || 'Foydalanuvchi'}](tg://user?id=${referredByUserId})`;
                // }
                referredByText = `\n🔗 **Kim orqali:** ${rDisplay}`;
            } else if (referredByUserId) { // Agar userStoreda topilmasa ham ID ni ko'rsatish
                referredByText = `\n🔗 **Kim orqali:** _Noma'lum foydalanuvchi (ID: \`${referredByUserId}\`)_`;
            } else { referredByText = `\n🔗 **Parametr orqali:** _Noto'g'ri (\`${deepLinkParam}\`)_`; }
        }
        const logMsg = `🆕 **YANGI FOYDALANUVCHI**\n\n👤 **Nickname:** ${firstName}\n👤 **User:** ${userMentionText}\n🆔 **ID:** \`${userId}\`\n🌐 **Til:** ${languageCode}\n📅 **Vaqt:** ${messageTime}${referredByText}`;
        await logToChannel(NEW_USERS_LOG_CHANNEL_ID, logMsg, { parse_mode: 'Markdown' });
        if (userStore[userId]) userStore[userId].loggedToChannel = true;
        console.log(`LOG_STATUS: User ${userId} kanalga log qilindi.`);
    } else { console.log(`LOG_STATUS: User ${userId} avval log qilingan, qayta yuborilmadi.`); }

    if (deepLinkParam) {
        const targetId = getUserIdFromLinkParam(deepLinkParam);
        if (targetId && userStore[targetId]) {
            const tInfo = userStore[targetId];
            // const tName = tInfo.username ? `@${tInfo.username}` : `${tInfo.firstName || ''} ${tInfo.lastName || ''}`.trim() || "Foydalanuvchi"; // Bu o'zgaruvchi ishlatilmayapti
            if (userId === targetId) {
                bot.sendMessage(chatId, `Salom, ${fullName}! 👋\n\nBu sizning shaxsiy havolangiz, ushbu havola orqali sizga anonim xabar yozishlari mumkin:\n\n\`https://t.me/${BOT_USERNAME}?start=${userStore[userId].uniqueLinkParam}\`\n\n`, { parse_mode: 'Markdown' });
                delete writingTo[userId];
            } else {
                writingTo[userId] = targetId;
                bot.sendMessage(chatId, `Salom, ${fullName}! Anonim xabaringizni yozing:`, { parse_mode: 'Markdown' });
            }
        } else {
            bot.sendMessage(chatId, `Salom, ${fullName}! 👋\n\nUzr, siz ochgan havola yaroqsiz yoki eskirgan.\n\nBu sizning shaxsiy manzilingiz, buni do'stlaringizga tarqating:\n\`https://t.me/${BOT_USERNAME}?start=${userStore[userId].uniqueLinkParam}\``, { parse_mode: 'Markdown' });
            delete writingTo[userId];
        }
    } else {
        bot.sendMessage(chatId, `Salom, ${fullName}! 👋\n\nBu sizning shaxsiy havolangiz, ushbu havola orqali sizga anonim xabar yozishlari mumkin:\n\n\`https://t.me/${BOT_USERNAME}?start=${userStore[userId].uniqueLinkParam}\`\n\n`, { parse_mode: 'Markdown' });
        delete writingTo[userId];
    }
});

// /send buyrug'i (SIZNING KODINGIZ - FUNKSIYASI O'ZGARISHSIZ)
bot.onText(/\/send @(\S+) (.+)/s, async (msg, match) => {
    const senderChatId = msg.chat.id;
    const senderUserId = msg.from.id;
    const senderInfo = userStore[senderUserId];
    if (!senderInfo) { bot.sendMessage(senderChatId, "Iltimos, avval /start bering."); return; }
    const senderFullName = `${senderInfo.firstName || ''} ${senderInfo.lastName || ''}`.trim();
    const senderDisplayName = senderInfo.username ? `@${senderInfo.username}` : (senderFullName || `ID:${senderUserId}`);
    const messageTime = formatDateTime(msg.date);

    const targetUsernameRaw = match[1];
    const targetUsernameLower = targetUsernameRaw.toLowerCase();
    const messageText = match[2];

    console.log(`EVENT: /send - Kimdan: ${senderDisplayName} (ID: ${senderUserId}), Kimga: @${targetUsernameRaw}, Matn: "${messageText.substring(0, 30)}..."`);

    let logMessageContent = `➡️ **XABAR (/send orqali)**\n\n` +
        `👤 **Kimdan:** ${senderDisplayName} (ID: \`${senderUserId}\`)\n` +
        `🎯 **Kimga (username):** @${targetUsernameRaw}\n`;

    let targetUserInfo = null;
    for (const uid in userStore) {
        if (userStore[uid].username && userStore[uid].username.toLowerCase() === targetUsernameLower) {
            targetUserInfo = userStore[uid];
            break;
        }
    }

    if (targetUserInfo) {
        const targetFullName = `${targetUserInfo.firstName || ''} ${targetUserInfo.lastName || ''}`.trim();
        logMessageContent += `🎯 **Kimga (ID):** \`${targetUserInfo.id}\` (${targetUserInfo.username ? '@' + targetUserInfo.username : targetFullName || 'Noma\'lum'}) \n`;
    } else {
        logMessageContent += `🎯 **Kimga (ID):** _Noma'lum (@${targetUsernameRaw} botni /start qilmagan)_\n`;
    }

    logMessageContent += `💬 **Matn:**\n${messageText}\n` + `📅 **Vaqt:** ${messageTime}\n\n`;
    let directSendConfirmation = "✅ Xabaringiz yopiq kanalga yozildi.";

    if (targetUserInfo && targetUserInfo.chatId && targetUserInfo.id !== senderUserId) {
        const targetChatId = targetUserInfo.chatId;
        const targetUserId = targetUserInfo.id;
        const targetDisplayName = targetUserInfo.username ? `@${targetUserInfo.username}` : `${targetUserInfo.firstName || ''} ${targetUserInfo.lastName || ''}`.trim() || 'Foydalanuvchi';
        try {
            const directMessageToTarget = `🔔 **Sizga anonim xabar (\`/send\` orqali):**\n\n${messageText}\n\n` +
                `_Javob uchun ushbu xabarga "reply" qiling._`;
            const sentToTargetMsg = await bot.sendMessage(targetChatId, directMessageToTarget, { parse_mode: 'Markdown' });

            conversationMap[sentToTargetMsg.message_id] = {
                replyGoesToUserId: senderUserId,
                replyGoesToChatId: senderChatId,
                replyFromDisplayName: targetDisplayName
            };

            logMessageContent += `📡 **Status:** @${targetUserInfo.username || targetUserInfo.firstName} ga yuborildi.`;
            directSendConfirmation += ` Va @${targetUserInfo.username || targetUserInfo.firstName} ga yetkazildi.`;
        } catch (error) {
            console.error(`SEND_DIRECT_ERROR: @${targetUsernameRaw} ga /send da xato:`, error.message);
            let errorDetails = error.response && error.response.body ? error.response.body.description : error.message;
            logMessageContent += `📡 **Status:** @${targetUsernameRaw} ga yuborishda xato: ${errorDetails}`;
            directSendConfirmation += ` Ammo @${targetUsernameRaw} ga yetkazishda xato.`;
        }
    } else if (targetUserInfo && targetUserInfo.id === senderUserId) {
        logMessageContent += `📡 **Status:** O'z-o'ziga /send. Yuborilmadi.`;
        directSendConfirmation = "❌ O'zingizga \`/send\` qila olmaysiz.";
    } else {
        logMessageContent += `📡 **Status:** To'g'ridan-to'g'ri yuborilmadi (@${targetUsernameRaw} topilmadi).`;
        directSendConfirmation += ` Ammo @${targetUsernameRaw} ga yetkaza olmadik.`;
    }

    await logToChannel(LOG_CHANNEL_ID, logMessageContent);
    bot.sendMessage(senderChatId, directSendConfirmation, { parse_mode: 'Markdown' });
    if (writingTo[senderUserId]) delete writingTo[senderUserId];
});


// Asosiy xabarlarni qayta ishlash (SIZNING KODINGIZ - FUNKSIYASI O'ZGARISHSIZ)
bot.on('message', async (msg) => {
    const senderChatId = msg.chat.id;
    const senderUserId = msg.from.id;
    const text = msg.text;
    const messageTime = formatDateTime(msg.date);

    if (!text || text.startsWith('/')) return;

    const senderUserInfo = userStore[senderUserId];
    if (!senderUserInfo) {
        return;
    }
    const senderFullName = `${senderUserInfo.firstName || ''} ${senderUserInfo.lastName || ''}`.trim();
    const senderDisplayName = senderUserInfo.username ? `@${senderUserInfo.username}` : (senderFullName || `ID:${senderUserId}`);

    console.log(`EVENT: Matnli xabar - User: ${senderDisplayName} (ID: ${senderUserId}), Matn: "${text.substring(0, 30)}..."`);

    if (msg.reply_to_message && msg.reply_to_message.from.is_bot && msg.reply_to_message.from.username === BOT_USERNAME) {
        const repliedToBotMsgId = msg.reply_to_message.message_id;
        const conversationData = conversationMap[repliedToBotMsgId];

        if (conversationData) {
            console.log(`REPLY_HANDLER: Bot xabariga javob aniqlandi (msg_id: ${repliedToBotMsgId}).`);
            const { replyGoesToUserId, replyGoesToChatId, replyFromDisplayName } = conversationData;

            const targetUserIdForThisReply = replyGoesToUserId;
            const targetChatIdForThisReply = replyGoesToChatId;
            const targetUserInfoForThisReply = userStore[targetUserIdForThisReply];

            if (targetUserInfoForThisReply && targetChatIdForThisReply) {
                const targetDisplayNameForThisReply = targetUserInfoForThisReply.username ? `@${targetUserInfoForThisReply.username}` : `${targetUserInfoForThisReply.firstName || ''} ${targetUserInfoForThisReply.lastName || ''}`.trim() || `ID:${targetUserIdForThisReply}`;
                try {
                    const sentReply = await bot.sendMessage(targetChatIdForThisReply,
                        `↪️ **Javob keldi:**\n\n${text}\n\nJavob berish uchun ushbu xabarga "reply" qiling.`,
                        { parse_mode: "Markdown" }
                    );

                    conversationMap[sentReply.message_id] = {
                        replyGoesToUserId: senderUserId,
                        replyGoesToChatId: senderChatId,
                        replyFromDisplayName: targetDisplayNameForThisReply
                    };
                    console.log(`CONVERSATION_MAP: Yangi mapping qo'shildi (key: ${sentReply.message_id})`);

                    bot.sendMessage(senderChatId, `✅ Javobingiz yuborildi.`);

                    const logMsg = `↩️ **SUHBAT JAVOBI**\n\n` +
                        `🗣️ **Kimdan:** ${senderDisplayName} (ID: \`${senderUserId}\`)\n\n` +
                        `👤 **Kimga:** ${targetDisplayNameForThisReply} (ID: \`${targetUserIdForThisReply}\`)\n\n` +
                        `💬 **Matn:**\n${text}\n\n` +
                        `📅 **Vaqt:** ${messageTime}`;
                    await logToChannel(LOG_CHANNEL_ID, logMsg);

                } catch (error) {
                    console.error("CONV_REPLY_ERROR:", error.message);
                    bot.sendMessage(senderChatId, "❌ Javobingizni yuborishda xatolik.");
                }
            } else {
                bot.sendMessage(senderChatId, "❌ Javob yuboriladigan foydalanuvchi topilmadi yoki uning chat ma'lumotlari yo'q.");
            }
            return;
        } else {
            console.log(`REPLY_HANDLER_WARN: Reply qilingan xabar (msg_id: ${repliedToBotMsgId}) conversationMap da topilmadi.`);
        }
    }

    if (writingTo[senderUserId]) {
        console.log(`WRITING_MODE_MESSAGE: User ${senderDisplayName} (ID: ${senderUserId}) yozish rejimida.`);
        const targetUserId = writingTo[senderUserId];
        const targetUserInfo = userStore[targetUserId];

        if (targetUserInfo && targetUserInfo.chatId) {
            const targetDisplayName = targetUserInfo.username ? `@${targetUserInfo.username}` : `${targetUserInfo.firstName || ''} ${targetUserInfo.lastName || ''}`.trim() || `ID:${targetUserId}`;
            const targetChatId = targetUserInfo.chatId;

            try {
                const firstMessageToTarget = await bot.sendMessage(targetChatId,
                    `🔔 **Sizga anonim xabar keldi:**\n\n${text}\n\n` +
                    `_Javob berish uchun ushbu xabarga "reply" qiling._`,
                    { parse_mode: "Markdown" }
                );

                conversationMap[firstMessageToTarget.message_id] = {
                    replyGoesToUserId: senderUserId,
                    replyGoesToChatId: senderChatId,
                    replyFromDisplayName: targetDisplayName
                };
                console.log(`CONVERSATION_MAP: Yangi mapping qo'shildi (key: ${firstMessageToTarget.message_id})`);

                bot.sendMessage(senderChatId, `✅ Xabaringiz anonim tarzda yuborildi.`);

                const logMsg = `➡️ **YANGI ANONIM XABAR (Deep Link)**\n\n` +
                    `👤 **Kimdan (anonim):** ${senderDisplayName} (ID: \`${senderUserId}\`)\n\n` +
                    `🎯 **Kimga (manzil egasi):** ${targetDisplayName} (ID: \`${targetUserId}\`)\n\n` +
                    `💬 **Birinchi xabar:**\n${text}\n\n` +
                    `📅 **Vaqt:** ${messageTime}`;
                await logToChannel(LOG_CHANNEL_ID, logMsg);

                delete writingTo[senderUserId];

            } catch (error) {
                console.error("NEW_ANON_MSG_ERROR:", error.message);
                bot.sendMessage(senderChatId, `❌ Xabaringizni ${targetDisplayName} ga yuborishda xatolik.`);
                delete writingTo[senderUserId];
            }
        } else {
            bot.sendMessage(senderChatId, "Xabar yuboriladigan foydalanuvchi topilmadi.");
            delete writingTo[senderUserId];
        }
        return;
    }
});

// Polling xatolarini eshitish o'rniga webhook xatolarini eshitish
// bot.on('polling_error', (error) => { ... }); // <-- BU O'CHIRILDI
bot.on('webhook_error', (error) => { // <--- WEBHOOK UCHUN XATO HANDLER
    console.error(`WEBHOOK_ERROR: ${error.code} - ${error.message || error.toString()}`);
});

process.on('SIGINT', async () => { // <--- WEBHOOKNI O'CHIRISH QO'SHILDI
    console.log('------------------------------------');
    console.log("Bot to'xtatilmoqda (SIGINT)...");
    try {
        console.log("Webhookni o'chirishga harakat qilinmoqda...");
        await bot.deleteWebHook();
        console.log("Webhook muvaffaqiyatli o'chirildi.");
    } catch (e) {
        console.error("Webhookni o'chirishda xato:", e.message);
    } finally {
        // Kelajakda: userStore, conversationMap ni faylga saqlash
        console.log('------------------------------------');
        process.exit(0);
    }
});

// console.log("Bot xabarlarni kutishni boshladi..."); // <-- BU ENDI KERAK EMAS, app.listen ICHIDA BOR