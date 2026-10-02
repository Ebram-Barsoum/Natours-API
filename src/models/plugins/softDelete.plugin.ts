import mongoose, { Schema } from "mongoose";

export interface SoftDeletetion extends Document {
    softDelete: () => Promise<Document>;
    deletedAt: Date | null
}

const softDeletePlugin = <T>(schema: Schema) => {
    schema.add({
        deletedAt: {
            type: Date,
            default: null,
            select: false
        }
    });

    schema.pre(/^find/, function (this: mongoose.Query<T, T>, next) {
        this.where({ deletedAt: null });
        next();
    });

    schema.methods.softDelete = async function (): Promise<T> {
        this.deletedAt = new Date();
        return this.save();
    };

    schema.methods.restore = async function (): Promise<T> {
        this.deletedAt = null;
        return this.save();
    };
}

export default softDeletePlugin;