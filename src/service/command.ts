import { ContextMessageUpdate } from "telegraf";
import { getAllTags } from "../db/repository";
import { copyStringToSymbol } from "./index";
const empty = "🧐";

export async function responseOnCommand(chatId: number, text: string, ctx: ContextMessageUpdate) {
  let command = copyStringToSymbol("@", text);
  switch (command) {
    case "/chat_id":
      return chatId ? chatId.toString() : empty;
    case "/all_tags":
      const allTtegs = await getAllTags(chatId);
      return allTtegs ? allTtegs : empty;
    case "/help":
      return "Команды бота: \n #youTag1 #youTag2 ... #youTagN - показывает изображения ТОЛЬКО с заданными тегами \n";

    default:
      return empty;
  }
}
