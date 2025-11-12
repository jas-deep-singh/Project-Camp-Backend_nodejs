import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/dbConnect.js";

dotenv.config({
    path: "./.env"
});

const port = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.listen(port, () => {
        console.log(`LISTENING ON http://localhost:${port}`);
        })
    })
    .catch((error) => {
        console.error("MongoDb connection failed", error);
        process.exit(0);
    });