const {CloudFrontClient,CreateInvalidationCommand}=require("@aws-sdk/client-cloudfront");
const {AWS_CLOUDFRONT_VARS}=require("../config/aws_config");

const { aws_errorHandler } = require("./error_handler.js");

const cloudFrontClient = new CloudFrontClient({
    region: "us-east-1", //No need to change region for CloudFront. Just the default to put something
    credentials: {
        accessKeyId: AWS_CLOUDFRONT_VARS.accessKeyId,
        secretAccessKey: AWS_CLOUDFRONT_VARS.secretAccessKey
    }
});

async function invalidateCache(distributionId, paths) {
    const params = {
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: Date.now().toString(), // Unique string to identify the request
            Paths: {
                Quantity: paths.length,
                Items: paths
            }
        }
    }
    const command = new CreateInvalidationCommand(params);
    try {
        const data = await cloudFrontClient.send(command);
        console.log("Invalidation created successfully:", data.Invalidation.Id);
        return data; // Return the invalidation data if needed
    } catch (error) {
        aws_errorHandler(error, "CloudFront");
    }
}

const CLOUDFRONT_FUNCS={
    invalidateCache
}

module.exports={CLOUDFRONT_FUNCS};