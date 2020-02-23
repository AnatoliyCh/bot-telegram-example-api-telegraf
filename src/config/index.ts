import { config_VK } from "./api";

export type Config = {
  HOST: string;
  PORT: number;
  BOT_TOKEN: string;
  ID_ADMIN: string;
  SUCCESS_SAVE_PHOTO: string; //успех сохранения фото
};

export const config: Config = {
  HOST: "",
  PORT: 5000,
  BOT_TOKEN: "YOUR_TOKEN",
  ID_ADMIN: "YOUR_ID",
  SUCCESS_SAVE_PHOTO: "AgACAgIAAxkBAAIGZV5RNaqavWU8i846-YC89SwNSkDAAAKWrDEbV1SRStZoCQlE9dKk2UnLDgAEAQADAgADbQADfIwCAAEYBA"
};

export { config_VK }; //конфиг для API.VK
