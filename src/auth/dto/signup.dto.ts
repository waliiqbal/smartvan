/* eslint-disable prettier/prettier */


export class RegisterDto {
  userType: 'parent' | 'driver';
  schoolId?: string;
  fullname: string;
  email: string;
  phoneNo?: string;
  address?: string;
  lat?: number;
  long?: number;
  password?: string; 
  image?: string
}
