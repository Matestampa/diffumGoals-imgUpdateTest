const { get_env } = require("./get_env.js");

get_env();


const AWS_S3_VARS={
    bucketRegion:process.env.S3_BUCKET_REGION,
    bucketRegion:process.env.S3_BUCKET_REGION,
    bucketName:process.env.S3_BUCKET_NAME,
    accessKeyId:process.env.S3_AWS_ACCESS_KEY_ID,
    secretAccessKey:process.env.S3_AWS_SECRET_ACCESS_KEY,
}

console.log(AWS_S3_VARS)

module.exports= {AWS_S3_VARS};