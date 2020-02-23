/** Вся информация по чату */
export default interface User {
  chatId: number | null;
  lastDate: number; // последняя дата взаимодейтсвия
  firstName: string | null; // имя
  lastName: string | null; // фамилия
  userName: string | null; // уникальный id пользователя
}
