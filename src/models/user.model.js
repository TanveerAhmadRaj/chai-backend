
import mongoose,{ Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userScheme = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowecase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
    },
    avatar: {
        type: String, //cloudinary image url...
        required: true,
    },
    coverImage: {
        type: String, //cloudinary image url...
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    password: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    }


},
{
    timestamps: true
}
);


userScheme.pre("save",async function (next) {
    if (!this.isModified("password")) return next(); 
    this.password = await bcrypt.hash(this.password, 10)
    next();
});
userScheme.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
};
userScheme.methods.generateAccessToken = function () {
   return jwt.sign({
        _id: this._id,
        email: tjis.email,
        username: this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY

    }
)
};
userScheme.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY

    }
)

};
export const User =  mongoose.model("User", userScheme);