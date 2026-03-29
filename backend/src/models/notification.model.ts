import { Schema, model, Document, Types } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'application_status',
  'new_applicant',
  'system',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true, maxlength: 500 },
    link: {
      type: String,
      maxlength: 300,
      validate: {
        validator: (v: string) => /^(https?:\/\/|\/)/.test(v),
        message: 'link must be a relative path or an absolute URL',
      },
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Notification = model<INotification>('Notification', notificationSchema);
