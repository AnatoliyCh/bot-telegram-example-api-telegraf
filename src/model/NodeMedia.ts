/** Вся информация по картинке с данным тегом */
export default interface NodeMedia {
  messageId: number | null;
  mediaGroupId: string | null; //id группы фотографий (если скинули альбомом)
  tags: string[];
  photoId: string;
}
