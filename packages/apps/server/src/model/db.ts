import mongoose from "mongoose";

const MONGO_DB_URL = process.env.MONGO_DB_URL ?? null;

export async function connectToDB() {
    if (!MONGO_DB_URL || MONGO_DB_URL == null) {
        console.error("Unable to find mongodb url");
        return;
    }

    try {
        await mongoose.connect(MONGO_DB_URL)
            .catch(error => console.error(error));

        mongoose.connection.on("connection", () => {
            console.info(`Connected to MongoDB: ${MONGO_DB_URL}`);
        })

        mongoose.connection.on("error", () => {
            console.error(`Connected to MongoDB: ${MONGO_DB_URL}`);
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occured connecting to mongodb";
        console.error(errorMessage);
    }
}