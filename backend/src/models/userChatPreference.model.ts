import { Schema, model, Document, Types } from 'mongoose';

export interface IUserChatPreference {
  user: Types.ObjectId;
  chat: Types.ObjectId;
  centerMessageId?: Types.ObjectId; // Last message the UI was centered on (for scroll position)
  lastSeenMessageId?: Types.ObjectId; // Last message user has read (for unread tracking)
  lastSeenAt?: Date; // Timestamp of last seen (optional, for time-based comparison)
}

export interface UserChatPreferenceDoc extends IUserChatPreference, Document {}

const userChatPreferenceSchema = new Schema<UserChatPreferenceDoc>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UserChatPreference must have a user'],
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: [true, 'UserChatPreference must have a chat'],
    },
    centerMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastSeenMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  {
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
    timestamps: true,
  }
);

// Compound unique index: one preference per user per chat
userChatPreferenceSchema.index({ user: 1, chat: 1 }, { unique: true });
// Index for quick lookups
userChatPreferenceSchema.index({ chat: 1, user: 1 });

const UserChatPreference = model<UserChatPreferenceDoc>('UserChatPreference', userChatPreferenceSchema);

export default UserChatPreference;

