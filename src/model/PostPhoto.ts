/** объект готовый к отправке ботом */
export default interface PostPhoto {
  type: "photo";
  caption?: string;
  media: string;
}
