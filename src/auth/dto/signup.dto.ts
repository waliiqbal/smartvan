/* eslint-disable prettier/prettier */


export class RegisterDto {
  userType: 'parent' | 'driver';
  fullname: string;
  email: string;
  phoneNo?: string;
  address?: string;
  lat?: number;
  long?: number;
  password?: string; 
}
