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
    downloadHair,
    downloadFace,
    downloadBody,
    downloadPants,
    // downloadLogo,
    // renderText,
    composeImage,
    sendImage,
    cleanupFiles,
]);

// Add the middleware function implementations below this line
function validateRequest(req, res, next) {
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



function createIdentifier(req, res, next) {
    const identifier = crypto.randomUUID();
    req.identifier = identifier;
    next();
}

function downloadLayers(req, res, next) {
    const layers = [
      {url: req.query.hair, name: 'hair'},
      {url: req.query.face, name: "face"},
      {url: req.query.body, name: "body"},
      {url: req.query.pants, name: "pants"}
    ];
    layers.forEach((layer)=>{
      const file = fs.createWriteStream(`./${req.identifier}-${layer.name}.jpg`);
      console.log("url",layer.url)

      var readableStream = fs.createReadStream(layer.url);
      readableStream.on('data', function(chunk) {
        console.log("chunk",chunk);
        file.write(chunk);
      });
  
    })
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

    console.log("kkkkkkkkkkkkkkkkkkkkkkkkk", `./${req.identifier}-hair.jpg`);

    const hair = await loadImage(`./${req.identifier}-hair.jpg`);
    const face = await loadImage(`./${req.identifier}-face.jpg`);
    const body = await loadImage(`./${req.identifier}-body.jpg`);
    const pants = await loadImage(`./${req.identifier}-pants.jpg`);
    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

    const width = hair.width;
    const height = hair.height;

    registerFont("./shortbaby2.ttf", { family: "ShortBaby" });
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    const logoPadding = 20;
    context.drawImage(pants, 0, 0, width, height);
    context.drawImage(body, 0, 0, width, height);
    context.drawImage(face, 0, 0, width, height);
    context.drawImage(hair, 0, 0, width, height);
    // context.drawImage(logo, width - logo.width - logoPadding, height - logo.height - logoPadding);

    const textPadding = 30;
    context.font = "bold 70pt ShortBaby";
    context.textAlign = "left";
    context.textBaseline = "top";

    const textSize = context.measureText(req.query.text);
    context.fillStyle = "rgba(255, 255, 255, 0.8)"
    context.fillRect(0, 0, textSize.width + 2*textPadding, 200);

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
  fs.unlink(`./${req.identifier}-hair.jpg`, ()=>{});
  fs.unlink(`./${req.identifier}-face.jpg`, ()=>{});
  fs.unlink(`./${req.identifier}-body.jpg`, ()=>{});
  fs.unlink(`./${req.identifier}-pants.jpg`, ()=>{});
  fs.unlink(`./${req.identifier}-background.jpg`, ()=>{});
  next();
}


app.listen(port, function () {
    console.log(`Image API listening on port ${port}!`);
});
