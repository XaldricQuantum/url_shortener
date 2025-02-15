import mongoose from "mongoose";


//Define schema

const urlSchema = new mongoose.Schema({
    originalUrl: {type: String, required: true},
    shortId: {type: Number, required: true, unique: true}
});

const Url = mongoose.model("Url", urlSchema);

export default Url;