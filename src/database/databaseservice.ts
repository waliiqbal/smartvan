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
    @InjectModel(schema.Admin.name)
    private AdminModel: Model<schema.AdminDocument>,
     @InjectModel(schema.School.name)
    private SchoolModel: Model<schema.SchoolDocument>,
     @InjectModel(schema.Trip.name)
    private TripModel: Model<schema.TripDocument>,
    @InjectModel(schema.Van.name)
    private VanModel: Model<schema.VanDocument>,
    @InjectModel(schema.Kid.name)
    private KidModel: Model<schema.KidDocument>,
     @InjectModel(schema.Notification.name)
    private notificationModel: Model<schema.KidDocument>,
     ) {}
     get repositories() {
    return {
      parentModel: this.parentModel,
      driverModel: this.driverModel,
      AdminModel: this.AdminModel,
      SchoolModel: this.SchoolModel,
      VanModel: this.VanModel,
      KidModel: this.KidModel,
      TripModel: this.TripModel,
      notificationModel: this.notificationModel,
        };
  }
}