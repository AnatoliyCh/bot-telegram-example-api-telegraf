import Telegraf, { ContextMessageUpdate } from "telegraf";
import { Message } from "telegraf/typings/telegram-types";
import { config } from "./config";
import * as repository from "./db/repository";
import { NodeMedia, PostPhoto, User } from "./model";
import { convertCaptionToTags, getArraySubarrays, getContent, responseOnCommand, sleep } from "./service";

let localHost: boolean = true;

const bot = new Telegraf(config.BOT_TOKEN);
//локальный хост
if (localHost) bot.launch();
else {
  //Heroku
  bot.telegram.setWebhook(`${process.env.APP_URL || config.HOST}/bot${config.BOT_TOKEN}`);
  bot.startWebhook(`/bot${config.BOT_TOKEN}`, null, Number(process.env.PORT) || 5000);
}

bot.start(ctx => {
  ctx.reply("Welcome!");
  if (ctx.chat && ctx.from && !ctx.from.is_bot) {
    const newUser: User | null = getUser(ctx);
    newUser && repository.newUser(newUser);
  }
});

// bot.command("/chat_id", ctx => {
//   if (ctx.chat) ctx.reply(ctx.chat.id.toString());
//   else ctx.reply("пусто (:");
// });

let tmpPhotos: NodeMedia[] = [];
bot.on("message", async ctx => {
  if (ctx.chat && ctx.message) {
    const user: User | null = getUser(ctx);
    user && repository.updateUserLastDate(user); //обновляем дату посл. взаимодейтсвия пользователя
    //работа с API других сервисов (пересылка фото по ссылке)
    if (ctx.message.text?.match(/https:(.+)/)) {
      let arrMessageBot: number[] = [];
      arrMessageBot.push((await ctx.reply("минуту...")).message_id);
      getContent(ctx.message.text, async (arrPhoto: PostPhoto[] | null) => {
        if (arrPhoto && ctx.message && ctx.chat) {
          const [arrayMedia, numberArrays] = getArraySubarrays<PostPhoto>(arrPhoto, 10);
          for (let i = 0; i < numberArrays; i++) {
            if (arrayMedia[i].length > 1) await ctx.telegram.sendMediaGroup(ctx.chat.id, arrayMedia[i]);
            else await ctx.telegram.sendPhoto(ctx.chat.id, arrayMedia[i][0].media);
          }
          bot.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id); //удаляем сообщение пользователя
        } else arrMessageBot.push((await ctx.reply("🧐")).message_id); //если все же пусто
      });
      await sleep(1000);
      await arrMessageBot.forEach(item => ctx.chat && ctx.message && bot.telegram.deleteMessage(ctx.chat.id, item)); //удаляем сообщения бота
    }
    //команды
    else if (ctx.message.text?.match(/\/(.+)/)) {
      ctx.reply(await responseOnCommand(ctx.chat.id, ctx.message.text, ctx));
      bot.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
    }
    //работа с Media контентом (сохранение фото)
    else if (ctx.message.photo && ctx.chat.id && ctx.message.message_id) {
      const tmpFileId = ctx.message.photo.pop()?.file_id;
      if (tmpFileId) {
        const newPhoto: NodeMedia = {
          messageId: ctx.message.message_id,
          mediaGroupId: ctx.message.media_group_id || null,
          tags: convertCaptionToTags(ctx.message.caption || ""),
          photoId: tmpFileId
        };
        tmpPhotos.push(newPhoto);
        await sleep(1200); //ожидание для группы фотографий
        //удаление отправленных сообщений
        tmpPhotos.forEach(item => {
          ctx.chat?.id && item.messageId && bot.telegram.deleteMessage(ctx.chat.id, item.messageId);
          item.tags = tmpPhotos[0].tags;
          item.messageId = null;
        });
        //сохранение фотографий
        repository.createPhoto(ctx.chat.id, tmpPhotos.slice(0));
        successSavePhoto(ctx.chat.id, tmpPhotos.length);
      }
    }
    //работа с Media контентом (удаление фото)
    else if (ctx.message.reply_to_message && ctx.message.reply_to_message.photo) {
      const tmpFileId = ctx.message.reply_to_message.photo.pop()?.file_id;
      if (tmpFileId) {
        const deletePhoto: NodeMedia = {
          messageId: ctx.message.reply_to_message.message_id,
          mediaGroupId: null,
          tags: [],
          photoId: tmpFileId
        };
        const deleteMessageId = await repository.deletePhoto(ctx.chat.id, deletePhoto);
        deleteMessageId && bot.telegram.deleteMessage(ctx.chat.id, deleteMessageId);
        bot.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
      }
    }
    //работа с Media контентом (вывод фото (по списку тегов СТРОГО))
    else if (ctx.message.text?.match(/^#(.+)/)) {
      const tags: string[] = convertCaptionToTags(ctx.message.text);
      const [arrayMedia, numberArrays, messageIdDelete] = await repository.readPhoto(ctx.chat.id, tags);
      let getMessage: Message[] = []; //информация про отправленные сообщения
      if (arrayMedia.length && numberArrays) {
        for (let i = 0; i < numberArrays; i++) {
          if (arrayMedia[i].length > 1) {
            arrayMedia[i][0].caption = tags.join(" ");
            getMessage = getMessage.concat(await ctx.telegram.sendMediaGroup(ctx.chat.id, arrayMedia[i])); //вывод, и получение id, сообщений
          } else
            getMessage = getMessage.concat(
              await ctx.telegram.sendPhoto(ctx.chat.id, arrayMedia[i][0].media, { caption: tags.join(" ") })
            );
        }
        //обновление и удаление старых сообщений (копий)
        repository.updatePhoto(ctx.chat.id, getMessage);
        for (const iterator of messageIdDelete) bot.telegram.deleteMessage(ctx.chat.id, iterator);
        bot.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
      } else ctx.reply(await responseOnCommand(ctx.chat.id, "", ctx)); //если все же пусто
    }
  }
  tmpPhotos.length = 0;
});

/** уведомление об успешном принятии фото */
let lock_successSavePhoto: boolean = false;
async function successSavePhoto(chatId: number, count: number) {
  if (!lock_successSavePhoto) {
    lock_successSavePhoto = true;
    const message = await bot.telegram.sendPhoto(chatId, config.SUCCESS_SAVE_PHOTO, { caption: count.toString() });
    await sleep(3000); //ожидание
    bot.telegram.deleteMessage(chatId, message.message_id);
    lock_successSavePhoto = false;
  }
}

function getUser(ctx: ContextMessageUpdate): User | null {
  if (ctx.chat && ctx.from && !ctx.from.is_bot) {
    const User: User = {
      chatId: ctx.chat.id,
      lastDate: new Date().getTime(),
      firstName: ctx.from.first_name || null,
      lastName: ctx.from.last_name || null,
      userName: ctx.from.username ? "@" + ctx.from.username : null
    };
    return User;
  }
  return null;
}

//TODO: tmpPhotos переделать для массива чатов, а то щас не очень крепко)))
//TODO: тоже самое с lock_successSavePhoto
