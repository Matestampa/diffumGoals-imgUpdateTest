const {CLOUDFRONT_FUNCS} = require("./aws_services")


async function dale(){
    await CLOUDFRONT_FUNCS.invalidateCache("nashe-js-invalidation",["/*"]);
}


dale();