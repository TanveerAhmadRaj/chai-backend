import { Router } from "express";
import {loggedoutUser, 
    loggedInUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateAvatar, 
    updateCoverImage, 
    getUserChannelProfile, 
    getWatchHistory} from "../controllers/user.controller.js";
import {upload } from "../middlewares/multer.middleware.js";
import {verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);
router.route("/login").post(loggedInUser);
//secure routes...
router.route("/logout").post( verifyJWT, loggedoutUser);
router.route("/refresh-token", refreshAccessToken);
router.route("/update-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("update-account").patch(verifyJWT, updateAccountDetails);
router.route("/change-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router.route("chnage-cover-image").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
router.route("/channel-detail/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);
export default router;