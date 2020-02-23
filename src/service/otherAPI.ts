import request from "request";
import { config_VK } from "../config";
import { api_VK } from "../api";
import { PostPhoto } from "../model";

type vkPhoto = {
  type: string;
  photo: {
    sizes: { url: string }[];
  };
  text: string | null;
};

//виды API
enum APIs {
  vk = "vk"
}

export function getContent(link: string, callback: (arrPhoto: PostPhoto[] | null) => void) {
  if (link.indexOf(config_VK.HOST)) {
    let IdPost = defineAPI(link, APIs.vk);
    IdPost &&
      request(config_VK.PATH + api_VK.wall.getPathById(IdPost), (error, response, body) => {
        const vkPhoto: vkPhoto[] | null = JSON.parse(body).response[0]?.attachments || null;
        if (vkPhoto) {
          let postPhoto: PostPhoto[] | null = vkPhoto
            .filter(item => item.type === "photo") //только фото
            //состовляем масив к отправке
            .map(item => {
              return <PostPhoto>{
                type: "photo",
                media: item.photo.sizes.pop()?.url || ""
              };
            })
            .filter(item => item.media); //удаляем пустые
          callback(postPhoto); //отдаем готовый массив
        }
        callback(null);
      });
  }
}

/** определяем API и возвращаем нужные куски для запроса */
function defineAPI(link: string, who: APIs): string | null {
  switch (who) {
    case APIs.vk:
      if (link.indexOf("wall")) return api_VK.wall.getIdFromLink(link);
      break;

    default:
      return null; //нет такого апи у нас
  }
  return null; //нет такого апи у нас
}
