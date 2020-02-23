import { config_VK } from "../config";

export interface Api_VK {
  wall: MethodsWall; //работа со стеной
}

/** api стены ВК */
export interface MethodsWall {
  /** возвращает id поста из ссылки */
  getIdFromLink(link: string): string;
  /** возвращает путь к посту */
  getPathById(idPost: string, extended?: number, copy_history_depth?: number): string;
}

/** реализация interface Api_VK */
export const api_VK: Api_VK = {
  wall: {
    getIdFromLink: function(link: string): string {
      let idPost = link.substr(link.indexOf("wall")).substr(4);
      //работа с разными хвостами ссылки
      if (idPost.indexOf("%") > -1) return idPost.substr(0, idPost.indexOf("%"));
      else if (idPost.indexOf("?") > -1) return idPost.substr(0, idPost.indexOf("?"));
      else return idPost;
    },
    getPathById: function(idPost: string, extended: number = 0, copy_history_depth: number = 0): string {
      return [
        "wall.getById?",
        "posts=" + idPost,
        "extended=" + extended,
        "copy_history_depth=" + copy_history_depth,
        "access_token=" + config_VK.ACCESS_TOKEN,
        "v=" + config_VK.APIv
      ].join("&");
    }
  }
};
