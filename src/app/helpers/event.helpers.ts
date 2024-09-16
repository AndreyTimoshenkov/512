import { EDirection } from "../interfaces/general.types";

export function isDirection(keyCode: string): boolean {
  return Object.values(EDirection).includes(keyCode as EDirection);
}