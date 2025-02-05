// require('dotenv').config();
import dotenv from 'dotenv'
// const express = require('express');
import express from 'express'
// const cors = require('cors');
import cors from 'cors'
const app = express();
// const mongoose = require('mongoose')
import dns from 'dns'
import mongoose from 'mongoose';
import Url from './models/urlModel.js';

function checkDomainExist(url) {

    return new Promise((resolve) => {

        let hostName;
        try {
            hostName = new URL(url).hostname;
            console.log("20: ", hostName);
            
        } catch (err) {
            console.log("23: ", err);
            
            return resolve(false);
        }
        console.log(`Checking DNS for: ${hostName}`);
        dns.lookup(hostName, (err) => {
            if (err) {
                console.log("dns lookup fail: ", err);
                return resolve(false);
            };
            console.log("DNS OK");
            
            return resolve(true);
        })
    })
    
}

dotenv.config();
mongoose.connect(process.env.MONGO_URI, ({useNewUrlParser: true, useUnifiedTopology: true}));
const db = mongoose.connection;
db.on('connected', () => console.log('✅ Mongoose connected to DB'))

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.use(express.urlencoded({extended: true}));

app.post('/api/shorturl', async (req, res) => {
    const url = req.body.url;
    console.log(url);
    const isUrlOk = await checkDomainExist(url);
    console.log("domain status check", isUrlOk);
    if (!isUrlOk) {
        return res.json({ error: 'invalid url' });
    };
    try {
        const savedUrl = await saveUrl(url);
        console.log("saved Url: ", savedUrl);
        return res.json({ originalUrl: savedUrl.originalUrl, shortUrl: savedUrl.shortId})
    } catch (err) {
        console.log("cannot save url, err: ", err);
        return res.json({error: "Failed to save URL"})
    }
})

app.get('/api/shorturl/:number' , async (req, res) => {
    const number = req.params.number;
    if (!number) {
        return res.json({error: "Invalid input"})
    }
    try {
        const requestedUrl = await Url.findOne({shortId: number});
        if (requestedUrl) {
            return res.redirect(requestedUrl.originalUrl)
        } else {
            return res.json({error: "No short URL found for the given input"})
        }
    } catch (err) {
        console.log("error invalid input: ", err);
        return res.json({error: "Wrong format"})
        
    }
    
})

const saveUrl = async (inputUrl) => {
    let newUrl
    try {
        const existingUrl = await Url.findOne({originalUrl: inputUrl});
        console.log("existing url", existingUrl);
        
        if (existingUrl) {
            console.log("URL already saved");
            return existingUrl;
        }

        // If the URL is new , assign short ID
        const lastUrl = await Url.findOne().sort({shortId: -1});
        const newShortId = lastUrl ? lastUrl.shortId + 1 : 1;
        console.log("new shortId: ", newShortId);
        
        // Create new record for new url
        newUrl = new Url({ originalUrl: inputUrl, shortId: newShortId});
        console.log("new url: ", newUrl);
        
        // console.log(await newUrl.save());
        try {
            await newUrl.save();
            console.log("new URL saved: ", newUrl);
            return newUrl;
        }catch (err) {
            console.log("save error: ", err);
            
            return null;
        }
    } catch (err) {
        console.error("Error saving URL: ", err);
        return null;
        
    }
}


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});