
const sharp = require('sharp');

const {GoalModel,MongoDB_Error}=require("../mongodb");

const {S3_FUNCS}=require("../aws_services");

//------------------------- DB ---------------------------------------------- 

//Trae el arr de pix de la img q esta en la DB
async function get_Img_FromDb(id){
    
    try{
        let doc=await GoalModel.findById(id).select("cant_pix_xday diffum_color s3_imgName");
        return {untouched_pix:doc.untouched_pix,
               cant_pix_xday:doc.cant_pix_xday,
               diffum_color:doc.diffum_color,
               s3_imgName:doc.s3_imgName};
    }
    catch(e){
        throw new MongoDB_Error("Getting img from DB",e);
    }
}

//Trae arr de pix de imgs con paginación
async function get_Img_FromDb_Pagination(page = 1, limit = 10, filter = {}){
    
    try{
        const skip = (page - 1) * limit;
        
        const docs = await GoalModel
            .find(filter)
            .select("cant_pix_xday diffum_color s3_imgName")
            .skip(skip)
            .limit(limit);
        
        // Si obtenemos menos documentos que el límite, estamos en la última página
        const hasNextPage = docs.length === limit;
        
        const results = docs.map(doc => ({
            id: doc._id,
            cant_pix_xday: doc.cant_pix_xday,
            diffum_color: doc.diffum_color,
            s3_imgName: doc.s3_imgName
        }));
        
        return {
            data: results,
            pagination: {
                currentPage: page,
                hasNextPage: hasNextPage,
                hasPrevPage: page > 1,
                limit: limit,
                returnedCount: docs.length
            }
        };
    }
    catch(e){
        throw new MongoDB_Error("Getting imgs from DB with pagination", e);
    }
}


//Guarda nuevo arr de pix actualizado de la img en la DB
async function save_NewImg_2Db(id,pixelArr,data){
    try{
        await GoalModel.updateOne({_id:id},{$set:{untouched_pix:pixelArr,
            last_diffumDate:new Date()}});  
    }
    catch(e){
        throw new MongoDB_Error("Saving new img to DB",e);
    }
}

async function saveMulti_NewImg_2Db(goalsUpdated){

    let operations=[]

    for (let goal of goalsUpdated){
        operations.push({updateOne:{filter:{_id:goal.id},update:{$set:{last_diffumDate:new Date()}}}})
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

module.exports={get_Img_FromDb,get_Img_FromDb_Pagination,save_NewImg_2Db,saveMulti_NewImg_2Db,
                get_ImgFile_Array,save_NewImgFile
}