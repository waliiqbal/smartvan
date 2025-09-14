/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { serviceAccount } from 'src/certs/firebase-admin.sdk';
import { DatabaseService } from 'src/database/databaseservice';

@Injectable()
export class FirebaseAdminService {
  private readonly messaging: admin.messaging.Messaging;

  constructor(private readonly databaseservice: DatabaseService) {
    // Firebase initialize
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    }
    this.messaging = admin.messaging();
  }


async sendToDevice(
  deviceToken: string,
  payload: {
    notification?: { title: string; body: string };
    data?: { [key: string]: string };
  },
  extra?: { parentId?: string; driverId?: string; actionType?: string } // DB save ke liye
) {
  const message: admin.messaging.Message = {
    token: deviceToken,
    notification: payload.notification,
    data: payload.data,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  };

  try {
    // 🔹 Firebase push notification bhejna
    const result = await this.messaging.send(message);

    // 🔹 Notification DB me save karna
    if (extra) {
      await this.databaseservice.repositories.notificationModel.create({
        parentId: extra.parentId,
        driverId: extra.driverId,
        title: payload.notification?.title,
        message: payload.notification?.body,
        actionType: extra.actionType,
      });
    }

    return { success: true, result };
  } catch (error) {
    console.error('Firebase Error:', error);
    return { success: false, error };
  }
}


async getAlerts(parentId: string) {
  const notifications = await this.databaseservice.repositories.notificationModel.find({
    parentId: parentId, // direct string compare
  }).sort({ createdAt: -1 });

  return {
    message: 'Notifications fetched successfully',
    data: notifications,
  };
}
}