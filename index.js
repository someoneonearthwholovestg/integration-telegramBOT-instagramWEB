const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');

const Instagram = require('instagram-web-api');
const axios = require('axios');

//let instaEmail, instaPsw;
//let isLogin = false;

// login scene
const loginScene = new Scene('login');
loginScene.enter((ctx) => {
   if (!ctx.session.isLogin) ctx.reply('Inserisci la mail');
   else ctx.reply('Login già effettuato');
});

loginScene.on('text', (ctx) => {
   var message_id = ctx.message.message_id;
   var chat_id = ctx.chat.id;

   bot.telegram.deleteMessage(chat_id, message_id);

   if (ctx.session.isLogin) return ctx.reply('Login già effettuato');
   var text = ctx.message.text;
   const email = validateEmail(text);
   if (email) {
      //instaEmail = text;
      ctx.session.email = text;
      ctx.reply('Inserisci la password:');
   } else {
      if (!ctx.session.email)
         return ctx.reply("Inserisci l'email per poter procedere");
      //instaPsw = text;
      ctx.session.psw = text;
      const localClient = new Instagram({
         username: ctx.session.email,
         password: ctx.session.psw,
      });
      ctx.session.client = localClient;
      (async () => {
         try {
            const login = await localClient.login();
            console.log(login);
            if (!login.authenticated) {
               return ctx.reply('Problemi di autenticazione.');
            }

            ctx.session.isLogin = true; //isLogin = true;

            const profile = await localClient.getProfile();
            console.log(profile);

            ctx.scene.leave();
            ctx.reply(
               'Login Avvenuto correttamente\n\nIncolla il messaggio generato dal bot per applicare automaticamente i like alle foto contenute.'
            );
         } catch (error) {
            return ctx.reply('Problemi di autenticazione.');
         }
      })();
   }
});

const dotenv = require('dotenv');
dotenv.config();

const bot = new Telegraf(process.env.TEL_BOT_TOKEN);

const stage = new Stage([loginScene], { ttl: 500 });
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
   if (!ctx.session.isLogin)
      return ctx.reply('Effettua il login per poter procedere. /login');

   return ctx.reply(
      'Incolla il messaggio generato dal bot per applicare automaticamente un like'
   );
});

bot.command('login', (ctx) => ctx.scene.enter('login'));

bot.on('text', (ctx) => {
   if (!ctx.session.isLogin) {
      return ctx.reply('Effettua il login per poter procedere. /login');
   }

   var testo = ctx.update.message.text;

   /* DELETE MESSAGE
   var message_id = ctx.message.message_id;
   var chat_id = ctx.chat.id;

   bot.telegram.deleteMessage(chat_id, message_id);
   bot.telegram.sendMessage(chat_id, testo).then((m) => {
      bot.telegram.deleteMessage(chat_id, m.message_id);
   }); 
   */

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
               ctx.session.client.like({ mediaId: media_id }).then((a) => {
                  console.log('like --> ' + response.config.url);
                  ctx.reply('like --> ' + response.config.url.split('url=')[1]);
               });
            } catch (err) {
               console.log('KO', err);
            }
         })
         .catch((error) => {
            console.log(error);
         });

      urlExport.push(url);
   }
});

bot.launch();

const validateEmail = (email) => {
   const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
   return re.test(String(email).toLowerCase());
};
