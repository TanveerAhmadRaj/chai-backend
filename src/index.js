 import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
 dotenv.config({
    path: "./.env"
 });

 connectDB()
 .then(()=>{
   app.listen(process.env.PORT || 5000, ()=>{
      console.log(`Server is running on http://localhost:${process.env.PORT}`);
   })
 })
 .catch((error)=>{
   console.log("Database connection is failed!!!!", error);
 });