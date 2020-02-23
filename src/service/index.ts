import { NodeMedia } from "../model";
import { responseOnCommand } from "./command";
import { getContent } from "./otherAPI";

export { responseOnCommand, getContent };

/** конвертация подписи в теги */
export function convertCaptionToTags(value: string): string[] {
  const arrTag: string[] = [];
  value
    ? value
        .split("#")
        .filter(x => !!x)
        .sort()
        .forEach(item => {
          item[0].toLowerCase();
          arrTag.push("#" + item.trim());
        })
    : arrTag.push("#empty");
  return arrTag;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function copyStringToSymbol(symbol: string, str: string) {
  return str.indexOf(symbol) > -1 ? str.slice(0, str.indexOf(symbol)) : str;
}

/** строгий поиск в массиве элементов другого массива */
export function contains(data: NodeMedia, tags: string[]): NodeMedia | null {
  if (data && tags && data.tags.length === tags.length) {
    for (const iterator of tags) if (data.tags.indexOf(iterator) == -1) return null;
    return data;
  }
  return null;
}
/** возвращет массив подмассивов определенного типа */
export function getArraySubarrays<T>(array: T[], size: number): [[T[]], number] {
  const subArray: [T[]] = [[]];
  const numberArrays = Math.ceil(array.length / size);
  for (let i = 0; i < numberArrays; i++) subArray[i] = array.slice(i * size, i * size + size);
  return [subArray, numberArrays];
}
