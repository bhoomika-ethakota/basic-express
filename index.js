const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true})) 
var cors = require('cors');
app.use(cors());
// const {generateUploadURL} = require('./apicall')
const aws = require('aws-sdk')
const crypto = require('crypto')
const { promisify } = require("util")
const randomBytes = promisify(crypto.randomBytes)
const {MongoClient} = require('mongodb')

require('dotenv').config();

const region = "ap-south-1"
const bucketName = "pdf-uploading"
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
const client = new MongoClient(process.env.MONGO_URI)
app.post("/check", async (req, res) => {
  console.log(req.body.name)
  try {
   await client.connect()
   
   const database = client.db("bhoomikaethakota");
   const compressions = database.collection("Pdfs");
   const query = {name: req.body.name}
   const result = await compressions.findOne(query)
   console.log(result)
   
   res.send(result)
   
 }
 catch (e) {
   console.log(e)
 }
 finally {
   client.close()
 }
} )

const s3 = new aws.S3({
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: 'v4'
})
async function generateUploadURL() {
  const rawBytes = await randomBytes(16)
  const imageName = rawBytes.toString('hex')+".pdf"

  const params = ({
    Bucket: bucketName,
    Key: imageName,
    Expires: 60
  })
  
  const uploadURL = await s3.getSignedUrlPromise('putObject', params)
  return {url: uploadURL, key: imageName}
}


// Example route handler (can be replaced with your actual routes)
app.get('/', (req, res) => {
  res.send('Hello from the API!');
});
app.get('/download', async(req,res)=> {
  const url = await run()
  res.send(url);
});
app.get('/upload', async (req, res) => {
  const url = await generateUploadURL()
  res.send(url);
});
// Start the server
const port = process.env.PORT || 5125;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
