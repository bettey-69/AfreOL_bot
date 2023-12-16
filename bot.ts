import {
  conversations,
  createConversation,
  type Conversation,
  type ConversationFlavor
} from "@grammyjs/conversations";
import { Bot, Context, session } from "grammy";
const axios = require('axios');

const { MongoClient, ObjectId } = require('mongodb');
//mongodb+srv://betelhemadu14:dagmawit123@cluster0.harjd4f.mongodb.net/?retryWrites=true&w=majority&appName=AtlasApp
const mongoURI = 'mongodb://127.0.0.1:27017/Contact';
const dbName = 'Contact';
const GROUP_ID = "-1002092205889";
const client = new MongoClient(mongoURI);

// CustomContext interface
type MyContext = Context & ConversationFlavor;

type MyConversation = Conversation<MyContext>

const bot = new Bot<MyContext>('6625776277:AAG8m9gucriLc74yr4hO0UhzPNGdCBMnQ9M', {});

bot.use(session({ initial: () => ({}) }));
bot.use(conversations());

// Establish MongoDB connection
async function connectToDatabase() {
    try {
const  db = client.db(dbName);
const inviterCollection = db.collection('inviters');
//const rewardCollection = db.collection('reward');
const rechargeCollection = db.collection('recharge');
const userCollection=db.collection('User');
console.log('Connected to MongoDB');
return { db, inviterCollection, rechargeCollection, userCollection };
} catch (error) {
console.error('Error connecting to MongoDB:', error);
throw error;
}
}

(async () => {
  try {
    await client.connect();

    const { db, inviterCollection, rechargeCollection, userCollection } = await connectToDatabase();
    async function checkUserIsInGroup(userId: number, groupId: string): Promise<boolean> {
      try {
        const result = await bot.api.getChatMember(groupId, userId);
        return ['creator', 'administrator', 'member'].includes(result.status);
      } catch (e) {
        return false;
      }
    }
    
// send message
bot.command('notification', async (ctx) => {
  if (!ctx.message) {
    console.error('No message found in the context.');
    return;
  }
  const telegramId = ctx.from?.id;
  const notificationText = ctx.message.text?.replace('/notification', '').trim();

  if (!telegramId) {
    console.error('No Telegram ID found in the message.');
    return;
  }

  try {
    const collection = db.collection('User');

    const user = await collection.findOne({ telegramId });
    if (user && user.role === 'admin') {
      if (notificationText) {
        const users = await collection.find({}).toArray();

        for (const user of users) {
          const chatId = user.telegramId;
          await bot.api.sendMessage(chatId, notificationText);
        }
        await ctx.reply('Notifications sent successfully.');
      } else {
        await ctx.reply('Please enter the notification text.');
      }
    } else {
      await ctx.reply('You are not authorized to send notifications.');
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  await ctx.reply('An error occurred while sending notifications:')
  }
});
const groupUsername = 'test1_am';
bot.command('start', async (ctx: MyContext) => {
    const text:string=ctx.message!.text!
    const param= text.split(" ")[1]; 
    if(param && param.startsWith("i")){
        const inviterId= param.substring(1);
        const inviteeId= ctx.from!.id.toString();
        const isInviteeInGroup= await checkUserIsInGroup(ctx.from!.id,GROUP_ID)
        if(inviteeId!=inviterId && !isInviteeInGroup){
            const existing=await inviterCollection.find({inviteeId}).toArray()
            if(existing.length==0){
                await inviterCollection.insertOne({
                    inviterId,
                    inviteeId,
                    isInviteeInGroup,
                })
            }

          }

          }
    await ctx.reply(`👋 Welcome to our bot!\n
    📱 Earn exciting rewards by inviting your friends to join our group! Simply use the /addcontacts  command to invite and add your friends to our group.\n
    Use the /choosecategory command to select the category and share your contact. and also you can use /balance command to check your balance\n
    🎉 The more friends you invite, the more rewards you can earn! Start inviting now and enjoy your rewards.\n
    🙌 Thank you for being a part of our community! Do not forget to share your contact!`);
  });

bot.command('addcontacts', async (ctx: MyContext) => {

    const userId = ctx.from!.id;
    const groupLink = 'https://t.me/test1_am';
    const groupUrl = groupLink
    const inviteLink = `https://t.me/add_memeber_bot?start=i${userId}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURI(`Join our bot ${inviteLink}`)}`;

    try {
        const inviteLinkWithRef = `${shareUrl}&ref=${userId}`;
            await ctx.reply(
                `To add your contacts to the group, tap on the button below`,
                {
                reply_markup:{
                    inline_keyboard:[  [{text:"Share", url: shareUrl}]]
                }
                }
                );
            await ctx.reply(
                `To join our group, tap on the button below`,
                {
                 reply_markup:{
                    inline_keyboard:[  [{text:"join", url: groupUrl}]]
                 }
                }
                );
                
    } catch (error) {
        console.error('Error:', error);
        await ctx.reply('An error occurred while checking your membership status. Please try again later.');
    }
});
async function chooseCategory(conversation: MyConversation, ctx: MyContext) {
    await ctx.reply("Please choose a category:", {
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
  
    ctx = await conversation.waitForCallbackQuery(
        /^(student|teacher|employee|manager)$/ 
);
      
    const chosenCategory=ctx.callbackQuery!.data
    //let sharedContact=null;
    let sharedContact: any = null;
    while(sharedContact==null){
        await ctx.reply("Please share your contact information:", {
            reply_markup: {
              keyboard: [[{ text: "Share Contact", request_contact: true }]],
              resize_keyboard: true,
              one_time_keyboard: true },
          });
        ctx = await conversation.waitFor("message");

    sharedContact=ctx.message?.contact;

    if(sharedContact==null){
        await ctx.reply("Invalid contact");
    } 
    else if(sharedContact.user_id!=ctx.from!.id){
        await ctx.reply("Please share your own contact using the button");
        sharedContact=null;
    }
    }
    await ctx.reply("Thank you! Category and contact information received.");
    console.log("Shared Contact", sharedContact);
    console.log("category", chosenCategory);
    conversation.external(async () => {
        try{
            const collection = db.collection('User');

            const existingContact = await collection.findOne({
            'phoneNumber': ctx.message?.contact?.phone_number || ''
          });
      
          if (existingContact) {
            await ctx.reply('You have already shared your contact.');
            await client.close();
            return;
          }
            const document: any = {
                category: chosenCategory,
                name: sharedContact.first_name || '',
                phoneNumber: sharedContact.phone_number || '',
                telegramId: ctx.from?.id || ''
              };
            await collection.insertOne(document);
        console.log('Data stored in MongoDB successfully');
      } catch (error) {
        console.error('Error storing data in MongoDB:', error);
      }
      });
      
}
  
bot.use(createConversation(chooseCategory));

bot.command("choosecategory", async (ctx) => {
    await ctx.conversation.enter("chooseCategory");
});
async function rewardUser(inviterId: string, rewardAmount: number, inviteeId?: string): Promise<void> {
  const datetime = new Date();

  try {
    await inviterCollection.insertOne({
      inviterId,
      rewardAmount,
      inviteeId,
      datetime
    });

    console.log('Reward stored in the database successfully.');
  } catch (error) {
    console.error('Error storing reward in the database:', error);
  }
}
  

async function getUserBalance(telegramId: string): Promise<number> {
  try {
    let balance=0;
    // Get all inviter data for the user by filtering by inviter ID
    const inviterData = await inviterCollection.find({ inviterId: telegramId }).toArray();

    // Sum all the reward amounts
    const totalRewardAmount = inviterData.reduce((sum: number, data: { rewardAmount: number }) => sum + (data.rewardAmount || 0), 0);

    // Get recharge data for the user
    const rechargeData = await rechargeCollection.find({ telegramId }).toArray();

    if (rechargeData.length > 0) {
      // Sum all recharge amounts
      const totalRechargeAmount = rechargeData.reduce((sum: number, data: { amount: number }) => sum + (data.amount || 0), 0);

      // Calculate balance: sum of reward amount - sum of recharge amount
       balance= totalRewardAmount - totalRechargeAmount;
      return balance > 0 ? balance : 0; 
    } else {
      // If rechargeData is empty, return the totalRewardAmount as the balance
      return totalRewardAmount;
    }
  } catch (error) {
    throw new Error(`Error retrieving user balance: ${error}`);
  }
}

bot.command("balance", async (ctx) => {

  const telegramId = ctx.from?.id || '';

  try {
    const balance = await getUserBalance(telegramId.toString());
    await ctx.reply(`Your balance is: ${balance}`);
  } catch (error) {
    console.error('Error retrieving user balance:', error);
    await ctx.reply('Sorry, there was an error retrieving your balance. Please try again later.');
  }
});

bot.command("recharge", async (ctx) => {
  // Get the amount from the command
  const amount = parseInt(ctx.message?.text?.split(' ')[1] || '');

  // Get the user's Telegram ID
  const telegramId = ctx.from?.id?.toString() || '';

  try {
    // Check the user balance
    const balance = await getUserBalance(telegramId);

    if (amount <= balance) {
      
      const telegramId = ctx.from?.id?.toString() || '';

      const phoneNumber = await fetchPhoneNumberFromDatabase(telegramId);
      if (phoneNumber) {
        // Recharge the phone
        const referenceId = await rechargeCard(phoneNumber, amount);

        const datetime = new Date();

        const rechargeData = {
          telegramId,
          amount,
          datetime,
          referenceId
        };

        // Insert the recharge data into the recharge collection
        await rechargeCollection.insertOne(rechargeData);

        await ctx.reply(`Recharge of ${amount} successful!!`);
      } else {
        await ctx.reply('Phone number not found.');
      }
    } else {
      await ctx.reply('Insufficient balance. Please recharge a lower amount.');
    }
  } catch (error) {
    console.error('Error recharging user:', error);
    await ctx.reply('Sorry, there was an error processing your recharge. Please try again later.');
  }
});

// Fetch phone number
 async function fetchPhoneNumberFromDatabase(telegramId: string): Promise<string | null> {
  try {
    const collection = db.collection('User');
    const document = await collection.findOne({telegramId:Number.parseInt(telegramId.toString())});
 
    if (document) {
      return document.phoneNumber;
    } else {
      console.log(`Document not found for telegramId: ${telegramId}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching phone number from database:', error);
    return null
  
}
 }
 async function rechargeCard(phoneNumber: string, amount: number): Promise<string> {
  return 'aa'
  try {
    // Recharge Phone
    const rechargeUrl = 'https://airtime-api.ephonebills.com/recharge';
    const rechargePayload = {
      amount,
      phoneNumber,
      type: 'PREPAID'
    };
    const rechargeResponse = await axios.post(rechargeUrl, rechargePayload, {
      headers: {
        client_id: 'CLIENT_ID',
        client_secret: 'CLIENT_SECRET'
      }
    });
    return rechargeResponse.data.id;
  } catch (error) {
    console.error('Error recharging phone:', error);
    throw error;
  }
}
bot.on('message', async (ctx: MyContext) => {
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
                const invite = await inviterCollection.find({
                inviteeId: memberId.toString()
                }).toArray();

                console.log('invite', invite);
                if (invite.length > 0) {
                    const inviterId = invite[0].inviterId;
                    const rewardAmount=5;
                    await bot.api.sendMessage(
                        inviterId,
                        `You have invited ${member.first_name} to the group! You have been rewarded with ${rewardAmount} coins!`
                    );
                    await rewardUser(inviterId, rewardAmount, memberId.toString(),);

                    const inviter = await bot.api.getChatMember(GROUP_ID, inviterId).catch(e => null);
                    if (inviter) {
                        await ctx.reply(`${inviter.user.first_name} invited ${member.first_name} to the group!`);
                    }
                }
            }
          }

        });
    await bot.start();
    console.log('Bot started successfully!');
} catch (error) {
    console.error('Error starting the bot:', error);
}

}) ();
