import mongoose, { Schema } from "mongoose";

const subscriberSchema = new Schema({
    subscriber: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },
    chanel: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    }
}, {
    timestamps: true
}
);

export const Subscriber = mongoose.model("Subscriber", subscriberSchema);
