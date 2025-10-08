import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../database/schemas/base.schema';

@Schema({ collection: 'users', timestamps: true })
export class User extends BaseSchema {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: 'admin', enum: ['customer', 'admin'] })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: String, select: false })
  refreshToken?: string;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: String })
  emailVerificationToken?: string;

  @Prop({ type: Date })
  emailVerificationExpires?: Date;

  @Prop({ type: String })
  passwordResetToken?: string;

  @Prop({ type: Date })
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ createdAt: -1 });
UserSchema.index({ isDeleted: 1, isActive: 1 });
UserSchema.index({ emailVerificationToken: 1 });
UserSchema.index({ passwordResetToken: 1 });

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, res) => {
    const {
      __v,
      _id,
      refreshToken,
      emailVerificationToken,
      passwordResetToken,
      ...remaining
    } = res;
    return remaining;
  },
});
