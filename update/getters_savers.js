
const sharp = require('sharp');

const {GoalModel,MongoDB_Error}=require("../mongodb");

const {S3_FUNCS}=require("../aws_services");

//------------------------- DB ---------------------------------------------- 

//Gets goals from DB with cursor pagination
async function get_Goals_FromDb_Pagination(lastId = null, limit = 10, filter = {}){

    try{
        // Build the query - if lastId is provided, find documents with _id greater than lastId
        let query = { ...filter };
        if (lastId) {
            query._id = { $gt: lastId };
        }
        
        const docs = await GoalModel
            .find(query)
            .select("cant_pix_xday diffum_color s3_imgName limit_date")
            .sort({ _id: 1 }) // Sort by _id ascending for consistent pagination
            .limit(limit);
        
        // Si obtenemos menos documentos que el límite, estamos en la última página
        const hasNextPage = docs.length === limit;
        
        // Get the last ID for the next page
        const nextCursor = docs.length > 0 ? docs[docs.length - 1]._id : null;
        
        const results = docs.map(doc => ({
            id: doc._id,
            cant_pix_xday: doc.cant_pix_xday,
            diffum_color: doc.diffum_color,
            s3_imgName: doc.s3_imgName,
            limit_date: doc.limit_date
        }));
        
        return {
            data: results,
            pagination: {
                hasNextPage: hasNextPage,
                nextCursor: nextCursor,
                limit: limit,
                returnedCount: docs.length
            }
        };
    }
    catch(e){
        throw new MongoDB_Error("Getting imgs from DB with cursor pagination", e);
    }
}

//Receives [{id,settedObject}] . Setted objects is an objects with the properties to modify and their
//new values
async function updateMulti_Goals_2Db(goalsUpdated){

    let operations=[]

    for (let goal of goalsUpdated){
        // Use the settedObject directly, or fallback to just updating last_diffumDate
        let setObject = goal.settedObject || { last_diffumDate: new Date() }
        
        operations.push({
            updateOne: {
                filter: { _id: goal.id },
                update: { $set: setObject }
            }
        })
    }

    try {
        await GoalModel.bulkWrite(operations)
    }
    catch(e){
        throw new MongoDB_Error("Saving new imgs batch to DB",e)
    }
}


//------------------------- S3 ----------------------------------------------

//Obtener array de pixeles e info de la img
async function get_ImgFile_Array(imgName){
    
    let imgByteArr=await S3_FUNCS.getObject(imgName);

    let {data,info}=await sharp(imgByteArr).raw().toBuffer({resolveWithObject:true});

    return {image_dataArr:data,imageInfo:info};
}

//Guardar la imagen actualizada a partir del nuevo arr de pixeles
async function save_NewImgFile(imgName, pixelArr, info) {
    let buffer = await sharp(pixelArr, {
        raw: { width: info.width, height: info.height, channels: info.channels }
    }).toFormat("png").toBuffer();

    await S3_FUNCS.saveObject(imgName, buffer, "image/png");
}

module.exports={get_Goals_FromDb_Pagination,updateMulti_Goals_2Db,
                get_ImgFile_Array,save_NewImgFile
}