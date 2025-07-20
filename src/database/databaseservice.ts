/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import * as schema from "./schema";

@Injectable()
export class DatabaseService {
  constructor(
    @InjectModel('Parent') private parentModel: Model<schema.UserDocument>,
    @InjectModel('Driver') private driverModel: Model<schema.UserDocument>,
    @InjectModel(schema.Store.name)
    private storeModel: Model<schema.StoreDocument>,
    @InjectModel(schema.Van.name)
    private VanModel: Model<schema.VanDocument>,
    @InjectModel(schema.Kid.name)
    private KidModel: Model<schema.KidDocument>,
     ) {}
     get repositories() {
    return {
      parentModel: this.parentModel,
      driverModel: this.driverModel,
      storeModel: this.storeModel,
      VanModel: this.VanModel,
      KidModel: this.KidModel,
        };
  }
}