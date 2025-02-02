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
import { hostname } from 'os';

function checkDomainExist(url) {

    return new Promise((resolve) => {

        let hostName;
        try {
            hostName = new URL(url).hostname;
            console.log(hostName);
            
        } catch (err) {
            return resolve(false);
        }
        console.log(`Checking DNS for: ${hostName}`);
        dns.lookup(hostName, (err) => {
            if (err) {
                console.log(err);
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
    console.log(await checkDomainExist(url));
    
    res.json({url: url, valid: await checkDomainExist(url)})
    
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});