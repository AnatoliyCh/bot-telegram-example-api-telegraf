import { database } from "firebase-admin";
import db from "../db";
import { NodeMedia, PostPhoto, User } from "../model";
import { contains, getArraySubarrays, convertCaptionToTags } from "../service";
import { Message } from "telegraf/typings/telegram-types";

/** подключение пользователя к боту */
export async function newUser(newUser: User) {
  const [ref, data] = await getReferenceAndData<User>(["users"]);
  if (data && data.length) {
    const find = data.findIndex(item => item.chatId === newUser.chatId);
    find > -1 ? updateUser(find.toString(), "lastDate", new Date().getTime()) : ref?.child(data.length.toString()).set(newUser);
  } else ref?.child("0").set(newUser);
}

export async function createPhoto(chatId: number, newPhotos: NodeMedia[]) {
  if (newPhotos.length) {
    const [ref, data] = await getReferenceAndData<NodeMedia>([chatId.toString()]);
    if (data && data.length) {
      newPhotos.forEach(item => {
        item.tags = newPhotos[0].tags;
        data.push(item);
      });
      ref?.set(data);
    } else ref?.set(newPhotos);
  }
}

export async function readPhoto(chatId: number, tags: string[]): Promise<[[PostPhoto[]], number, number[]]> {
  if (tags.length) {
    const [ref, data] = await getReferenceAndData<NodeMedia>([chatId.toString()]);
    if (data && ref && data.length) {
      const postPhoto: PostPhoto[] = []; //массив фото для отправки
      const messageIdDelete: number[] = []; //массив id сообщений для удаления
      const dataIndexDelete: number[] = []; //массив индексов для удаления
      for (let i = 0; i < data.length; i++) {
        const tmpData: NodeMedia | null = data[i];
        const tmpItem = (tmpData && contains(tmpData, tags)) || null;
        if (tmpItem) {
          dataIndexDelete.push(i);
          postPhoto.push({ type: "photo", media: tmpItem.photoId });
          tmpData.messageId && messageIdDelete.push(tmpData.messageId);
        }
      }
      const [arrayMedia, numberArrays] = getArraySubarrays<PostPhoto>(postPhoto, 10);
      //удаление(для пересылки) и обновление данных в БД
      dataIndexDelete.forEach(index => delete data[index]);
      ref.set(data.filter(x => x)); //удаляем пустые индексы
      return [arrayMedia, numberArrays, messageIdDelete];
    }
  }
  return [[[]], 0, []];
}

export async function updatePhoto(chatId: number, newMessage: Message[]) {
  let updateMedia: NodeMedia[] = []; //массив с новыми фото для заполнения БД
  newMessage.forEach(item => {
    const tmpFileId = item.photo?.pop()?.file_id;
    tmpFileId &&
      updateMedia.push({
        messageId: item.message_id,
        mediaGroupId: item.media_group_id || null,
        tags: convertCaptionToTags(newMessage[0].caption || ""),
        photoId: tmpFileId
      });
  });
  createPhoto(chatId, updateMedia);
}

export async function deletePhoto(chatId: number, deletePhoto: NodeMedia): Promise<number | null> {
  if (deletePhoto.messageId && deletePhoto.photoId) {
    const [ref, data] = await getReferenceAndData<NodeMedia>([chatId.toString()]);
    let deleteIndex: string | null = null;
    if (data && ref) {
      data.forEach((item, index) => {
        if (item.photoId === deletePhoto.photoId && item.messageId === deletePhoto.messageId) deleteIndex = index.toString();
      });
      if (deleteIndex) {
        ref.child(deleteIndex).remove();
        return data[deleteIndex].messageId;
      }
    }
  }
  return null;
}

//* Общие функции

export async function updateUserLastDate(user: User) {
  const [ref, data] = await getReferenceAndData<User>(["users"]);
  if (data && ref && data.length && user.chatId) {
    const currentDate = new Date().getTime();
    let count: number = 0; //если нашли пользователя
    for (let i = 0; i < data.length; i++) {
      const element: User | null = data[i];
      if (element && element.chatId) {
        if (
          element.chatId === user.chatId &&
          element.userName === user.userName &&
          element.lastName === user.lastName &&
          element.firstName === user.firstName
        ) {
          element.lastDate = currentDate;
          count++;
        }
      }
    }
    !count && newUser(user);
    ref.set(data);
  } else newUser(user);
}
export async function getAllTags(chatId: number) {
  const [ref, data] = await getReferenceAndData<NodeMedia>([chatId.toString()], false);
  if (data && data.length) {
    const allTags: string[] = [];
    data.forEach(item => {
      item.tags.forEach(tag => allTags.push(tag));
    });
    return [...new Set(allTags)].join(" ");
  }
  return "";
}
/** обновление одного из полей пользователя */
function updateUser(index: string, fieldName: keyof User, newValue: number | string) {
  const ref = db.ref("/users" + "/" + index + "/" + fieldName);
  ref.set(newValue);
}
/** возвращает массив данных и reference с БД */
async function getReferenceAndData<T>(
  path: string[],
  getRef: boolean = true
): Promise<[database.Reference | null, T[] | null]> {
  const ref = db.ref("/" + path.join("/"));
  const data: T[] | null = (await ref.once("value", data => data)).val();
  return getRef ? [ref, data] : [null, data];
}
