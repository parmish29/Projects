const TelegramBot = require('node-telegram-bot-api');
const { keep_alive } = require("./keep_alive");
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = '6411483176:AAEtWDgL21Eb8-8fjLEwunCDoEF-qy0tJvU'; // Replace with your actual bot token
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const pdfDirectory = './PDF';
const courses = {
  
  'BSc Non-Med': ['Physics', 'Chemistry', 'Maths'],
  'BSc Med': ['Botany', 'Zoology', 'Chemistry'],
  'BSc Comp Sci': ['Programming', 'Data Structures', 'Database Systems'],
  'BA': ['BRM'],
  'BCom': ['Accountancy', 'Economics', 'Business Studies'],
  'BTech Electronics': ['A'],
  'MBA Business Analytics': ['FSA', 'Management Robins','Business Analytics','Business Statistics', 'Management Koontz' ,'Management Science','BRM', 'OB Robins' , 'OB luthans' , 'Managerial Economics','Financial management','DBMS',],
  'MBA Finance': ['Corporate Finance','Management Robins','Business Statistics', 'Management Koontz' ,'Management Science','BRM', 'OB Robins' , 'OB luthans' , 'Managerial Economics','Business Communications', 'Accounting For Managers'],
  'MBA International Business': ['Marketing Management','Management Robins','Business Statistics', 'Management Koontz' ,'Management Science','BRM', 'OB Robins' , 'OB luthans' ,'Business Communications', 'Accounting For Managers','International Business'],
  'MBA Marketing': ['Marketing Management','Management Robins','Business Statistics', 'Management Koontz' ,'Management Science','BRM', 'OB Robins' , 'OB luthans' , 'Managerial Economics','Business Communications', 'Accounting For Managers'],
  'MBA General': ['Management Robins','Business Statistics', 'Management Koontz' ,'Management Science','BRM', 'OB Robins' , 'OB luthans' , 'Managerial Economics','Business Communications', 'Accounting For Managers']
  // ... Your course data ...
};

const CHANNEL_USERNAME = 'hisarbazzar'; // Replace with the actual username of the channel

// Function to check if the user is a member of the channel
async function isUserMemberOfChannel(chatId, userId) {
  try {
    const chatMember = await bot.getChatMember(`@${CHANNEL_USERNAME}`, userId);
    return chatMember && (chatMember.status === 'member' || chatMember.status === 'administrator');
  } catch (error) {
    console.error(error);
    return false;
  }
}

bot.onText(/\/start/i, async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;

  // Check if the user is a member of the channel
  const isMember = await isUserMemberOfChannel(chatId, userId);

  if (!isMember) {
    // User is not a member, provide a link to join the channel
    const joinChannelKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Join Our Channel', url: `https://t.me/${CHANNEL_USERNAME}` }]
        ]
      }
    };
    bot.sendMessage(chatId, `Welcome! GJU Book Bot To  please join our channel @${CHANNEL_USERNAME}
  Now Say Hi To Access The Content:`, joinChannelKeyboard);
  } else {
    // User is already a member, prompt them to type "hi" to access the course list
    bot.sendMessage(chatId, 'Welcome! To access the course list, please type "hi".');
  }
});

bot.onText(/hi/i, (msg) => {
  const keyboard = {
    reply_markup: {
      inline_keyboard: Object.keys(courses).map((course) => [
        { text: course, callback_data: `course-${course}` }
      ])
    }
  };
  bot.sendMessage(msg.chat.id, 'Please choose your course:', keyboard);
});

bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const chosenData = callbackQuery.data;
  const [dataType, chosenItem] = chosenData.split('-');

  if (dataType === 'course') {
    const keyboard = {
      reply_markup: {
        inline_keyboard: courses[chosenItem].map((subject) => [{ text: subject, callback_data: `subject-${subject}` }])
      }
    };
    bot.sendMessage(msg.chat.id, `You have chosen ${chosenItem}. Now, please choose a subject:`, keyboard);
  } else if (dataType === 'subject') {
    bot.sendMessage(msg.chat.id, "Processing request...")
      .then(processingMessage => {
        const pdfFilePath = path.join(pdfDirectory, `${chosenItem}.pdf`);

        fs.access(pdfFilePath, fs.constants.F_OK, (err) => {
          if (err) {
            bot.deleteMessage(msg.chat.id, processingMessage.message_id);
            bot.sendMessage(msg.chat.id, "Sorry, there seems to be an error. Please make sure the selected subject has a corresponding PDF file.");
          } else {
            bot.sendDocument(msg.chat.id, pdfFilePath)
              .then(() => bot.deleteMessage(msg.chat.id, processingMessage.message_id));
          }
        });
      });
  }
});
