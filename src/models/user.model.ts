import Joi from "joi";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import softDeletePlugin from "./plugins/softDelete.plugin";
import castMonogoID from "../utils/castMongoID";

export interface IUser extends mongoose.Document {
  id: string;
  name: string;
  email: string;
  password: string;
  passwordChangedAt: Date;
  role: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  passwordResetToken: string | undefined;
  passwordResetExpires: Date | undefined;

  verifyPassword(password: string, userPassword: string): Promise<boolean>;
  isPasswordChangedAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "A user must have a name"],
      minlength: [3, "A user name must have more or equal than 3 characters"],
      maxlength: [20, "A user name must have less or equal than 20 characters"],
    },
    email: {
      type: String,
      required: [true, "A user must have an email"],
      unique: true,
      lowercase: true,
      validate: {
        // this works on create and save
        validator: function (val: string): boolean {
          return !Joi.string().email().validate(val).error;
        },
        message: "Invalid email address!",
      },
      index: true,
    },
    password: {
      type: String,
      required: [true, "A user must have a password"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "guide", "lead-guide", "admin"],
      default: "user",
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    imageUrl: {
      type: String,
      default: "default-user.png",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: Record<string, unknown>) => {
        castMonogoID(_doc, ret);
        ret.imageUrl = !ret.imageUrl
          ? null
          : (ret.imageUrl as string)?.startsWith("https:")
            ? ret.imageUrl
            : `${process.env.BASE_URL}/uploads/users/${ret.imageUrl}`;

        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

// Index on user name for performant search
userSchema.index({ name: "text" });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
userSchema.pre("save", async function (next) {
  // only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

userSchema.methods.verifyPassword = async (
  canditatePassword: string,
  userPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(canditatePassword, userPassword);
};

userSchema.methods.isPasswordChangedAfter = function (
  JWTTimestamp: number,
): boolean {
  if (!this.passwordChangedAt) return false;

  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);

  return JWTTimestamp < changedTimestamp;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 1000 * 60 * 10; // Expires in 10 minutes

  return resetToken;
};

userSchema.plugin(softDeletePlugin<IUser>);

const User = mongoose.model("User", userSchema);

export default User;
