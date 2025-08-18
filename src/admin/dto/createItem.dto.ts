/* eslint-disable prettier/prettier */
import {
  IsNotEmpty,
  IsNumber,
  IsString,
} from "class-validator";

export class CreateStoreDto {
  name: string;
  shortCode: string;
  image: string;
  itemType: string;
  price: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  specialPower: string;
}


