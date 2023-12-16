"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const conversations_1 = require("@grammyjs/conversations");
const grammy_1 = require("grammy");
const axios = require('axios');
const { MongoClient, ObjectId } = require('mongodb');
//mongodb+srv://betelhemadu14:dagmawit123@cluster0.harjd4f.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp
const mongoURI = 'mongodb://127.0.0.1:27017/Contact';
const dbName = 'Contact';
const GROUP_ID = "-1002092205889";
const client = new MongoClient(mongoURI);
const bot = new grammy_1.Bot('6625776277:AAG8m9gucriLc74yr4hO0UhzPNGdCBMnQ9M', {});
bot.use((0, grammy_1.session)({ initial: () => ({}) }));
bot.use((0, conversations_1.conversations)());
// Establish MongoDB connection
function connectToDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = client.db(dbName);
            const inviterCollection = db.collection('inviters');
            //const rewardCollection = db.collection('reward');
            const rechargeCollection = db.collection('recharge');
            const userCollection = db.collection('User');
            console.log('Connected to MongoDB');
            return { db, inviterCollection, rechargeCollection, userCollection };
        }
        catch (error) {
            console.error('Error connecting to MongoDB:', error);
            throw error;
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client.connect();
        const { db, inviterCollection, rechargeCollection, userCollection } = yield connectToDatabase();
        function checkUserIsInGroup(userId, groupId) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const result = yield bot.api.getChatMember(groupId, userId);
                    return ['creator', 'administrator', 'member'].includes(result.status);
                }
                catch (e) {
                    return false;
                }
            });
        }
        // send message
        bot.command('notification', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            if (!ctx.message) {
                console.error('No message found in the context.');
                return;
            }
            const telegramId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
            const notificationText = (_b = ctx.message.text) === null || _b === void 0 ? void 0 : _b.replace('/notification', '').trim();
            if (!telegramId) {
                console.error('No Telegram ID found in the message.');
                return;
            }
            try {
                const collection = db.collection('User');
                const user = yield collection.findOne({ telegramId });
                if (user && user.role === 'admin') {
                    if (notificationText) {
                        const users = yield collection.find({}).toArray();
                        for (const user of users) {
                            const chatId = user.telegramId;
                            yield bot.api.sendMessage(chatId, notificationText);
                        }
                        yield ctx.reply('Notifications sent successfully.');
                    }
                    else {
                        yield ctx.reply('Please enter the notification text.');
                    }
                }
                else {
                    yield ctx.reply('You are not authorized to send notifications.');
                }
            }
            catch (error) {
                console.error('Error connecting to MongoDB:', error);
                yield ctx.reply('An error occurred while sending notifications:');
            }
        }));
        const groupUsername = 'test1_am';
        bot.command('start', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
            const text = ctx.message.text;
            const param = text.split(" ")[1];
            if (param && param.startsWith("i")) {
                const inviterId = param.substring(1);
                const inviteeId = ctx.from.id.toString();
                const isInviteeInGroup = yield checkUserIsInGroup(ctx.from.id, GROUP_ID);
                if (inviteeId != inviterId && !isInviteeInGroup) {
                    const existing = yield inviterCollection.find({ inviteeId }).toArray();
                    if (existing.length == 0) {
                        yield inviterCollection.insertOne({
                            inviterId,
                            inviteeId,
                            isInviteeInGroup,
                        });
                    }
                }
            }
            yield ctx.reply(`👋 Welcome to our bot!\n
    📱 Earn exciting rewards by inviting your friends to join our group! Simply use the /addcontacts  command to invite and add your friends to our group.\n
    Use the /choosecategory command to select the category and share your contact. and also you can use /balance command to check your balance\n
    🎉 The more friends you invite, the more rewards you can earn! Start inviting now and enjoy your rewards.\n
    🙌 Thank you for being a part of our community! Do not forget to share your contact!`);
        }));
        bot.command('addcontacts', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
            const userId = ctx.from.id;
            const groupLink = 'https://t.me/test1_am';
            const groupUrl = groupLink;
            const inviteLink = `https://t.me/add_memeber_bot?start=i${userId}`;
            const shareUrl = `https://t.me/share/url?url=${encodeURI(`Join our bot ${inviteLink}`)}`;
            try {
                const inviteLinkWithRef = `${shareUrl}&ref=${userId}`;
                yield ctx.reply(`To add your contacts to the group, tap on the button below`, {
                    reply_markup: {
                        inline_keyboard: [[{ text: "Share", url: shareUrl }]]
                    }
                });
                yield ctx.reply(`To join our group, tap on the button below`, {
                    reply_markup: {
                        inline_keyboard: [[{ text: "join", url: groupUrl }]]
                    }
                });
            }
            catch (error) {
                console.error('Error:', error);
                yield ctx.reply('An error occurred while checking your membership status. Please try again later.');
            }
        }));
        function chooseCategory(conversation, ctx) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                yield ctx.reply("Please choose a category:", {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "student", callback_data: "student" },
                                { text: "teacher", callback_data: "teacher" },
                                { text: "employee", callback_data: "employee" },
                                { text: "manager", callback_data: "manager" },
                            ],
                        ],
                    },
                });
                ctx = yield conversation.waitForCallbackQuery(/^(student|teacher|employee|manager)$/);
                const chosenCategory = ctx.callbackQuery.data;
                //let sharedContact=null;
                let sharedContact = null;
                while (sharedContact == null) {
                    yield ctx.reply("Please share your contact information:", {
                        reply_markup: {
                            keyboard: [[{ text: "Share Contact", request_contact: true }]],
                            resize_keyboard: true,
                            one_time_keyboard: true
                        },
                    });
                    ctx = yield conversation.waitFor("message");
                    sharedContact = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.contact;
                    if (sharedContact == null) {
                        yield ctx.reply("Invalid contact");
                    }
                    else if (sharedContact.user_id != ctx.from.id) {
                        yield ctx.reply("Please share your own contact using the button");
                        sharedContact = null;
                    }
                }
                yield ctx.reply("Thank you! Category and contact information received.");
                console.log("Shared Contact", sharedContact);
                console.log("category", chosenCategory);
                conversation.external(() => __awaiter(this, void 0, void 0, function* () {
                    var _b, _c, _d;
                    try {
                        const collection = db.collection('User');
                        const existingContact = yield collection.findOne({
                            'phoneNumber': ((_c = (_b = ctx.message) === null || _b === void 0 ? void 0 : _b.contact) === null || _c === void 0 ? void 0 : _c.phone_number) || ''
                        });
                        if (existingContact) {
                            yield ctx.reply('You have already shared your contact.');
                            yield client.close();
                            return;
                        }
                        const document = {
                            category: chosenCategory,
                            name: sharedContact.first_name || '',
                            phoneNumber: sharedContact.phone_number || '',
                            telegramId: ((_d = ctx.from) === null || _d === void 0 ? void 0 : _d.id) || ''
                        };
                        yield collection.insertOne(document);
                        console.log('Data stored in MongoDB successfully');
                    }
                    catch (error) {
                        console.error('Error storing data in MongoDB:', error);
                    }
                }));
            });
        }
        bot.use((0, conversations_1.createConversation)(chooseCategory));
        bot.command("choosecategory", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
            yield ctx.conversation.enter("chooseCategory");
        }));
        function rewardUser(inviterId, rewardAmount, inviteeId) {
            return __awaiter(this, void 0, void 0, function* () {
                const datetime = new Date();
                try {
                    yield inviterCollection.insertOne({
                        inviterId,
                        rewardAmount,
                        inviteeId,
                        datetime
                    });
                    console.log('Reward stored in the database successfully.');
                }
                catch (error) {
                    console.error('Error storing reward in the database:', error);
                }
            });
        }
        function getUserBalance(telegramId) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let balance = 0;
                    // Get all inviter data for the user by filtering by inviter ID
                    const inviterData = yield inviterCollection.find({ inviterId: telegramId }).toArray();
                    // Sum all the reward amounts
                    const totalRewardAmount = inviterData.reduce((sum, data) => sum + (data.rewardAmount || 0), 0);
                    // Get recharge data for the user
                    const rechargeData = yield rechargeCollection.find({ telegramId }).toArray();
                    if (rechargeData.length > 0) {
                        // Sum all recharge amounts
                        const totalRechargeAmount = rechargeData.reduce((sum, data) => sum + (data.amount || 0), 0);
                        // Calculate balance: sum of reward amount - sum of recharge amount
                        balance = totalRewardAmount - totalRechargeAmount;
                        return balance > 0 ? balance : 0;
                    }
                    else {
                        // If rechargeData is empty, return the totalRewardAmount as the balance
                        return totalRewardAmount;
                    }
                }
                catch (error) {
                    throw new Error(`Error retrieving user balance: ${error}`);
                }
            });
        }
        bot.command("balance", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
            var _c;
            const telegramId = ((_c = ctx.from) === null || _c === void 0 ? void 0 : _c.id) || '';
            try {
                const balance = yield getUserBalance(telegramId.toString());
                yield ctx.reply(`Your balance is: ${balance}`);
            }
            catch (error) {
                console.error('Error retrieving user balance:', error);
                yield ctx.reply('Sorry, there was an error retrieving your balance. Please try again later.');
            }
        }));
        bot.command("recharge", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
            var _d, _e, _f, _g, _h, _j;
            // Get the amount from the command
            const amount = parseInt(((_e = (_d = ctx.message) === null || _d === void 0 ? void 0 : _d.text) === null || _e === void 0 ? void 0 : _e.split(' ')[1]) || '');
            // Get the user's Telegram ID
            const telegramId = ((_g = (_f = ctx.from) === null || _f === void 0 ? void 0 : _f.id) === null || _g === void 0 ? void 0 : _g.toString()) || '';
            try {
                // Check the user balance
                const balance = yield getUserBalance(telegramId);
                if (amount <= balance) {
                    const telegramId = ((_j = (_h = ctx.from) === null || _h === void 0 ? void 0 : _h.id) === null || _j === void 0 ? void 0 : _j.toString()) || '';
                    const phoneNumber = yield fetchPhoneNumberFromDatabase(telegramId);
                    if (phoneNumber) {
                        // Recharge the phone
                        const referenceId = yield rechargeCard(phoneNumber, amount);
                        const datetime = new Date();
                        const rechargeData = {
                            telegramId,
                            amount,
                            datetime,
                            referenceId
                        };
                        // Insert the recharge data into the recharge collection
                        yield rechargeCollection.insertOne(rechargeData);
                        yield ctx.reply(`Recharge of ${amount} successful!!`);
                    }
                    else {
                        yield ctx.reply('Phone number not found.');
                    }
                }
                else {
                    yield ctx.reply('Insufficient balance. Please recharge a lower amount.');
                }
            }
            catch (error) {
                console.error('Error recharging user:', error);
                yield ctx.reply('Sorry, there was an error processing your recharge. Please try again later.');
            }
        }));
        // Fetch phone number
        function fetchPhoneNumberFromDatabase(telegramId) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const collection = db.collection('User');
                    const document = yield collection.findOne({ telegramId: Number.parseInt(telegramId.toString()) });
                    if (document) {
                        return document.phoneNumber;
                    }
                    else {
                        console.log(`Document not found for telegramId: ${telegramId}`);
                        return null;
                    }
                }
                catch (error) {
                    console.error('Error fetching phone number from database:', error);
                    return null;
                }
            });
        }
        function rechargeCard(phoneNumber, amount) {
            return __awaiter(this, void 0, void 0, function* () {
                return 'aa';
                try {
                    // Recharge Phone
                    const rechargeUrl = 'https://airtime-api.ephonebills.com/recharge';
                    const rechargePayload = {
                        amount,
                        phoneNumber,
                        type: 'PREPAID'
                    };
                    const rechargeResponse = yield axios.post(rechargeUrl, rechargePayload, {
                        headers: {
                            client_id: 'CLIENT_ID',
                            client_secret: 'CLIENT_SECRET'
                        }
                    });
                    return rechargeResponse.data.id;
                }
                catch (error) {
                    console.error('Error recharging phone:', error);
                    throw error;
                }
            });
        }
        bot.on('message', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
            console.log('on message called');
            if (ctx.message && ctx.message.new_chat_members) {
                console.log('on message called with new chat members');
                const groupId = ctx.message.chat.id;
                const newMembers = ctx.message.new_chat_members;
                for (const member of newMembers) {
                    console.log('member', member);
                    if (member.is_bot) {
                        continue;
                    }
                    const memberId = member.id;
                    const invite = yield inviterCollection.find({
                        inviteeId: memberId.toString()
                    }).toArray();
                    console.log('invite', invite);
                    if (invite.length > 0) {
                        const inviterId = invite[0].inviterId;
                        const rewardAmount = 5;
                        yield bot.api.sendMessage(inviterId, `You have invited ${member.first_name} to the group! You have been rewarded with ${rewardAmount} coins!`);
                        yield rewardUser(inviterId, rewardAmount, memberId.toString());
                        const inviter = yield bot.api.getChatMember(GROUP_ID, inviterId).catch(e => null);
                        if (inviter) {
                            yield ctx.reply(`${inviter.user.first_name} invited ${member.first_name} to the group!`);
                        }
                    }
                }
            }
        }));
        yield bot.start();
        console.log('Bot started successfully!');
    }
    catch (error) {
        console.error('Error starting the bot:', error);
    }
}))();
