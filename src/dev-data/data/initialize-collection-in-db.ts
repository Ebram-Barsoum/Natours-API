import fs from "fs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "../../configs/db";
import Tour from "../../models/tour.model";
import User from "../../models/user.model";
import Review from "../../models/review.model";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

type CollectionName = "tours" | "users" | "reviews"

const importData = async (collectionName: CollectionName) => {
    try {
        if (collectionName === "tours") {
            await Tour.create(tours);
        }
        else if (collectionName === "users") {
            await User.create(users);
        }
        else if (collectionName === "reviews") {
            await Review.create(reviews);
        }

        console.log(`${collectionName} data successfully imported!`);
    }
    catch (error) {
        console.log(error);
    }
    finally {
        mongoose.disconnect();
        process.exit();
    }
}

const deleteData = async (collectionName: "tours" | "users" | "reviews") => {
    try {
        if (collectionName === "tours") {
            await Tour.deleteMany();
        }
        else if (collectionName === "users") {
            await User.deleteMany();
        }
        else if (collectionName === "reviews") {
            await Review.deleteMany();
        }

        console.log(`${collectionName} data successfully deleted!`);
    }
    catch (error) {
        console.log(error);
    }
    finally {
        mongoose.disconnect();
        process.exit();
    }
}

connectDB().then(async () => {
    const option = process.argv[2];
    const collectionName: CollectionName = process.argv[3] as CollectionName;

    console.log(process.argv);
    if (option === '--import') {
        importData(collectionName);
    }
    else if (option === '--delete') {
        deleteData(collectionName);
    }
});