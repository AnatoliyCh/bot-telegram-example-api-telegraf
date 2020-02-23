export type Config_VK = {
  PATH: string; //точка входа
  ACCESS_TOKEN: string; //ключ доступа
  APIv: string; //версия API
  HOST: string; //домен ресурса
};

export const config: Config_VK = {
  PATH: "https://api.vk.com/method/",
  ACCESS_TOKEN: "your_token",
  APIv: "5.103",
  HOST: "vk.com"
};
