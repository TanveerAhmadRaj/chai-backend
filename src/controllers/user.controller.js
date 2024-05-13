import {asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async(userId)=>{
  try {
   const user =  await User.findById(userId);
   const accessToken = await user.generateAccessToken();
   const refreshToken = await user.generateRefreshToken();
   user.refreshToken = refreshToken;
   user.save({ validateBeforeSave: false });
  return {accessToken, refreshToken};   
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token");
    
  }
}
const registerUser = asyncHandler (async (req, res)=> {
  /*
    1: get user details from frontend.
    2: validate them all.
    3: check if user already exist.
    4: check for images, avatar (compulsory).
    5: upload them to cloudinary, avatar (compulsory).
    6: create user object.
    7: remove user passwrod ans refresh token fields from response object.
    8: check for user creation.
    9: return response.
  */ 
 const { username, email, fullname, password } = req.body;
  if([username, email, fullname, password]
    .some((field)=> field?.trim()=== "")){
    throw new ApiError(409, "All fields are required!");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });
  if(existedUser) {
    throw new ApiError(400, "Username or email is already existed please try with other!!!.");
  }
  const avatarLocalPath =  req.files?.avatar[0]?.path;
  //const coverLocalPath =  req.files?.coverImage[0]?.path;

  let coverLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverLocalPath = req.files.coverImage[0].path
    }
  if(!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required!..");
  }

 const avatar =  await uploadOnCloudinary (avatarLocalPath);
 console.log(avatar);
 const coverImage =  await uploadOnCloudinary (coverLocalPath);
 if(!avatar) {
  throw new ApiError(400, "Avatar is required!..");
}
const user =await  User.create({
  fullname,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email,
  password,
  username: username.toLowerCase()
});
const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
);
if(!createdUser){
  throw new ApiError(500, "Something went wrong while registering new user");
};
  return res.status(201).json(
    new ApiResponse(200, createdUser, "user registered successfully")
  );
});

const loggedInUser = asyncHandler ( async (req, res)=>{
  /*
  1:  req body -> data
  2:  username or email
  3:  password check
  4:  access and refresh token
  5:  send cookies (secure cookies)
  */
 const {email, username, password } = req.body;
  if(!(username || email)) {
    throw new ApiError(400, " username is required");
  }
  const user = await User.findOne({
    $or: [{username}, {email}]
  });
  if(!user){
    throw new ApiError(404, "User doesn't exist into database");
  };
 const isPasswordValid =  await user.isPasswordCorrect(password);
 if(!isPasswordValid){
  throw new ApiError(401, "invalid user credentials.");
};
const { accessToken, refreshToken } =  await generateAccessAndRefreshToken(user._id);
const logedInUser = await User.findById(user._id)
.select("-password -refreshToken");
const options = {
  httpOnly: true,
  secure: true
}
return res.status(200)
.cookie("accessToken", accessToken, options).
cookie("refreshToken", refreshToken, options).
json(
  new ApiResponse(200, {
    user: logedInUser, accessToken, refreshToken
  },
  "User loged in successfully."
));

});

const loggedoutUser = asyncHandler(async (req, res)=>{
  await User.findByIdAndDelete(
    req.user._id,
    {$unset: {refreshToken: 1}},
    {new: true}
  )
  const options = {httpOnly: true, secure: true};
  res.status(200).
  clearCookie("accessToken", options).
  clearCookie("refreshToken", options).
  json(new ApiResponse(200, {}, "User loggedout successfully"));
});

const refreshAccessToken = asyncHandler (async (req, res)=> {
    try {
      const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
      if (!incomingRefreshToken) {
        throw new ApiError(401, "user is unauthorized");
      }
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decodedToken?._id);
      if(!user) {
        throw new ApiError(401, "Invalid Refresh token");
      }
      if (incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used!!");
      }
  
      const   { accessToken, newRefreshToken  } = await generateAccessAndRefreshToken(user?._id);
  
      const options = {
        httpOnly: true,
        secure: true
      }
      res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: user, accessToken, refreshToken: newRefreshToken
          },
          "access token refreshed"  
        )
      )
    } catch (error) {
      throw new ApiError(401, error?.message || "Invalid refresh token");
    }

})

export { registerUser, loggedInUser, loggedoutUser, refreshAccessToken};