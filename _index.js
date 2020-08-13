const Telegraf = require('telegraf');
const Instagram = require('instagram-web-api');

const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

console.log(`INSTA_USER ${process.env.INSTA_USER}`);

const bot = new Telegraf(process.env.TEL_BOT_TOKEN);

const { username, password } = {
   username: process.env.INSTA_USER,
   password: process.env.INSTA_PSW,
};

const client = new Instagram({ username, password });

(async () => {
   await client.login();
   const profile = await client.getProfile();

   console.log(profile);
})();

const newChatMemberHandler = async (ctx) => {
   const names = ctx.message.new_chat_members
      .filter(({ is_bot }) => !is_bot)
      .map(({ first_name, last_name }) => `${first_name} ${last_name}`);

   await ctx.deleteMessage();

   ctx.replyWithMarkdown(`Welcome ${names.join(', ')}!`);
};

bot.on('new_chat_members', newChatMemberHandler);

bot.start((message) => {
   console.log('started:', message.from.id);
   return message.reply(
      'Incolla il messaggio generato dal bot per applicare automaticamente un like'
   );
});

bot.command('login', (message) => {
   bot.reply('[INSTAGRAM] Inserisci email');
});

bot.on('text', (message) => {
   debugger;
   var message_id = message.message.message_id;
   var chat_id = message.chat.id;
   var testo = message.update.message.text;
   bot.telegram.deleteMessage(chat_id, message_id);
   bot.telegram.sendMessage(chat_id, testo).then((m) => {
      bot.telegram.deleteMessage(chat_id, m.message_id);
   });
   var arrayUrl = testo.split(')');
   var urlExport = [];
   for (let index = 0; index < arrayUrl.length; index++) {
      if (index === 0) continue;
      var url = '';
      const element = arrayUrl[index];

      if (index + 1 === arrayUrl.length) {
         url = element.split('\n\n')[0].split('\n')[0].trim();
      } else {
         url = element.split('\n')[0].trim();
      }

      axios
         .get('http://api.instagram.com/oembed?callback=&url=' + url)
         .then((response) => {
            try {
               var media_id = response.data.media_id;
               client.like({ mediaId: media_id }).then((a) => {
                  console.log('like --> ' + response.config.url);
                  message.reply(
                     'like --> ' + response.config.url.split('url=')[1]
                  );
               });
            } catch (err) {
               console.log('KO', error);
            }
         })
         .catch((error) => {
            console.log(error);
         });

      urlExport.push(url);
   }
});

bot.startPolling();
