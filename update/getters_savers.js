
const sharp = require('sharp');

const {S3_FUNCS}=require("../aws_services");

//------------------------- DB ---------------------------------------------- 

//Trae el arr de pix de la img q esta en la DB
async function get_Img_FromDb(id){
    
    try{
        let doc=await GoalModel.findById(id).select("untouched_pix cant_pix_xday diffum_color s3_imgName");
    }
    catch(e){
        throw new MongoDB_Error("Getting img from DB",e);
    }
    return {untouched_pix:doc.untouched_pix,
           cant_pix_xday:doc.cant_pix_xday,
           diffum_color:doc.diffum_color,
           s3_imgName:doc.s3_imgName};

    //Ver como hacer return de esto --------------------------------------------
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

module.exports={get_Img_FromDb,save_NewImg_2Db,
                get_ImgFile_Array,save_NewImgFile
}