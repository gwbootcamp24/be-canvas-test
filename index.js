const express = require("express");
const crypto = require('crypto');
const fs = require("fs");
const client = require("https");
const { createCanvas, loadImage, registerFont } = require("canvas");


const app = express();
const port = process.env.PORT || '3005';

app.get("/", [
    validateRequest,
    createIdentifier,
    downloadBackground,
    downloadHair,
    downloadFace,
    downloadBody,
    downloadPants,
    downloadLogo,
    // renderText, 
    composeImage,
    sendImage,
    cleanupFiles,
]);

// Add the middleware function implementations below this line
function validateRequest(req, res, next) {
    if (!req.query.background){
      return res.status(400).send("missing background");
    }
    // if (!req.query.logo){
    //   return res.status(400).send("missing logo");
    // }
    if (!req.query.hair){
      return res.status(400).send("missing hair");
    }    
    if (!req.query.face){
      return res.status(400).send("missing face");
    }    
    if (!req.query.body){
      return res.status(400).send("missing body");
    }
    if (!req.query.pants){
      return res.status(400).send("missing pants");
    }


    if (!req.query.text){
      return res.status(400).send("missing text");
    }
    next();
}


function createIdentifier(req, res, next) {
    const identifier = crypto.randomUUID();
    req.identifier = identifier;
    next();
}


function downloadHair(req, res, next) {

  const url = req.query.hair;
  const file = fs.createWriteStream(`./${req.identifier}-hair.jpg`);

  var readableStream = fs.createReadStream(url);
  readableStream.on('data', function(chunk) {
    file.write(chunk);
  });

  next();
}

function downloadFace(req, res, next) {

  const url = req.query.face;
  const file = fs.createWriteStream(`./${req.identifier}-face.jpg`);

  var readableStream = fs.createReadStream(url);
  readableStream.on('data', function(chunk) {
    file.write(chunk);
  });

  next();
}

function downloadBody(req, res, next) {

  const url = req.query.body;
  const file = fs.createWriteStream(`./${req.identifier}-body.jpg`);

  var readableStream = fs.createReadStream(url);
  readableStream.on('data', function(chunk) {
    file.write(chunk);
  });

  next();
}

function downloadPants(req, res, next) {

  const url = req.query.pants;
  const file = fs.createWriteStream(`./${req.identifier}-pants.jpg`);

  var readableStream = fs.createReadStream(url);
  readableStream.on('data', function(chunk) {
    file.write(chunk);
  });

  next();
}

function downloadBackground(req, res, next) {
    const url = req.query.background;
    const file = fs.createWriteStream(`./${req.identifier}-background.jpg`);
 

    var readableStream = fs.createReadStream(url);
    readableStream.on('data', function(chunk) {
      file.write(chunk);
    });
    next();
 
 
}

function downloadLogo(req, res, next) {
    const url = req.query.logo;
    const file = fs.createWriteStream(`./${req.identifier}-logo.jpg`);

    client.get(url, (webRes) => {
        if (webRes.statusCode < 200 || webRes.statusCode > 299) {
            return res.status(400).send(`Got status code ${webRes.statusCode} while downloading logo`);
        }
        webRes.pipe(file).once("close", () => {
            next();
        });
    }).on("error",(err)=>{
        return res.status(500).send("error downloading logo");
    });
}

async function composeImage(req, res, next) {
    const background = await loadImage(`./${req.identifier}-background.jpg`);
    // const logo = await loadImage(`./${req.identifier}-logo.jpg`);
    const hair = await loadImage(`./${req.identifier}-hair.jpg`);
    const face = await loadImage(`./${req.identifier}-face.jpg`);
    const body = await loadImage(`./${req.identifier}-body.jpg`);
    const pants = await loadImage(`./${req.identifier}-pants.jpg`);


    const width = background.width;
    const height = background.height;

    registerFont("./shortbaby2.ttf", { family: "ShortBaby" });
    // const canvas = createCanvas(width, 2 * height);
    const canvasWidth = 480;
    const canvasHeight = 1200;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext("2d");

    const logoPadding = 20;
    
    context.drawImage(background, 0, 0, background.width, background.height);
    context.drawImage(pants, 0, 440, pants.width, pants.height);
    context.drawImage(body, 0, 200, body.width, body.height);
    context.drawImage(face, 0, 0, face.width, face.height);
    context.drawImage(hair, 0, 0, hair.width, hair.height);

    // context.drawImage(logo, width - logo.width - logoPadding + 400, height - logo.height - logoPadding);


    const textPadding = 30;
    context.font = "bold 70pt ShortBaby";
    context.textAlign = "left";
    context.textBaseline = "top";

    const textSize = context.measureText(req.query.text);
    context.fillStyle = "rgba(255, 255, 255, 0.8)"
    // context.fillRect(0, 960, textSize.width + 2*textPadding, 200);
    context.fillRect(0, canvasHeight - 200, canvasWidth, 200);

    context.fillStyle = "#444";
    context.fillText(req.query.text, textPadding, 2*textPadding);

    const buffer = canvas.toBuffer("image/png");
    req.compositeImageBuffer = buffer;
    next();
}


async function sendImage(req, res, next) {
    res.setHeader("Content-Type", "image/png");
    res.send(req.compositeImageBuffer);
    next();
}

async function cleanupFiles(req, res, next) {console.log("req.identifier",req.identifier)
    fs.unlink(`./${req.identifier}-background.jpg`, ()=>{});
    fs.unlink(`./${req.identifier}-logo.jpg`, ()=>{});
    next();
}


app.listen(port, function () {
    console.log(`Image API listening on port ${port}!`);
});
