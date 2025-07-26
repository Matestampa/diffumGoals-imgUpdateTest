const {connect_MongoDB,disconnect_MongoDB}=require("./mongodb/connection.js")

const {get_ImgFile_Array,save_NewImgFile,get_Img_FromDb,save_NewImg_2Db,get_Img_FromDb_Pagination}=require("./update/getters_savers.js");

const {get_randNum,get_pixelCoords,
       changePixel,delete_arrElem}=require("./update/utils.js");

// Function to generate a random RGB color array
function get_randomRGBColor() {
    const r = Math.floor(Math.random() * 256); // 0-255
    const g = Math.floor(Math.random() * 256); // 0-255
    const b = Math.floor(Math.random() * 256); // 0-255
    return [r, g, b];
}

//Crear array o traerlo
function get_untouchedPixArr(width,height){
    let pixelCoords=[];

     for (let y = 0; y < height; y++) {
        for (let x=0;x<width;x++){
          pixelCoords.push([x,y]);
        }
    }
    return pixelCoords
}

DEFAULT_UNTOUCHED_PIX=get_untouchedPixArr(100,100); //Ejemplo de 100x100px
DEFLT_CANT_PIX_XDAY=50
DEFLT_DIFFUM_COLOR=get_randomRGBColor()

async function updateGoal_onlyS3(s3_imgName,untouched_pix,cant_pix_xday,diffum_color){
  
  let {image_dataArr,imageInfo}=await get_ImgFile_Array(s3_imgName);
  
  for (i=0;i<cant_pix_xday;i++){
    //seleccionar pixel random del array de DB
    let rand_arrPos=get_randNum(0,untouched_pix.length-1);
    let pixel_coords=get_pixelCoords(untouched_pix[rand_arrPos]);
    
    //modificar pixel del array de img
    changePixel(pixel_coords[0],pixel_coords[1],diffum_color,image_dataArr,imageInfo);
    
    //borrar elem del array de DB
    delete_arrElem(rand_arrPos,untouched_pix);
  }
  
  //await save_NewImg_2Db(dbId,untouched_pix);
  await save_NewImgFile(s3_imgName,image_dataArr,imageInfo);

}

async function updateGoal(dbId){
    console.time("updateOneGoal")

    console.time("get_Img_FromDb")
    let {untouched_pix,cant_pix_xday,diffum_color,s3_imgName}=await get_Img_FromDb(dbId)
    console.timeEnd("get_Img_FromDb")
    console.time("get_ImgFile_fromS3")
    let {image_dataArr,imageInfo}=await get_ImgFile_Array(s3_imgName);
    console.timeEnd("get_ImgFile_fromS3")
    
    //Si ya quedan los ultimos sobrantes
    if (untouched_pix.length<cant_pix_xday){
      cant_pix_xday=untouched_pix.length;
    }

    for (i=0;i<cant_pix_xday;i++){
      //seleccionar pixel random del array de DB
      let rand_arrPos=get_randNum(0,untouched_pix.length-1);
      let pixel_coords=get_pixelCoords(untouched_pix[rand_arrPos]);
      
      //modificar pixel del array de img
      changePixel(pixel_coords[0],pixel_coords[1],diffum_color,image_dataArr,imageInfo);
      
      //borrar elem del array de DB
      delete_arrElem(rand_arrPos,untouched_pix);
    }
    
    console.time("save_NewImg_2Db")
    await save_NewImg_2Db(dbId,untouched_pix);
    console.timeEnd("save_NewImg_2Db")
    console.time("save_NewImgFile")
    await save_NewImgFile(s3_imgName,image_dataArr,imageInfo);
    console.timeEnd("save_NewImgFile")
    console.timeEnd("updateOneGoal")

}


//updateGoal_onlyS3("652b9f1e9f1e9f1e9f1e9f1f_s3",DEFAULT_UNTOUCHED_PIX,DEFLT_CANT_PIX_XDAY,DEFLT_DIFFUM_COLOR)
goals=["652b9f1e9f1e9f1e9f1e9f1e",
       "652b9f1e9f1e9f1e9f1e9f1f",
       "652b9f1e9f1e9f1e9f1e9f20",
       "652b9f1e9f1e9f1e9f1e9f21",
       "652b9f1e9f1e9f1e9f1e9f22",
       "652b9f1e9f1e9f1e9f1e9f23",
       "652b9f1e9f1e9f1e9f1e9f24",
       "652b9f1e9f1e9f1e9f1e9f25",
       "652b9f1e9f1e9f1e9f1e9f26",
       "652b9f1e9f1e9f1e9f1e9f27"]

async function main(){
    try{
        await connect_MongoDB();
        console.log("Connected to MongoDB");

        /*console.time("updateGoals")
        for (let goalId of goals){
            console.log(`Updating goal with ID: ${goalId}`);
            await updateGoal(goalId);
            console.log(`Goal with ID: ${goalId} updated successfully`);
        }
        console.timeEnd("updateGoals")*/
       console.time("get_Img_FromDb_Pagination")
       await get_Img_FromDb_Pagination(1, 10); // Example usage of pagination function
       console.timeEnd("get_Img_FromDb_Pagination")
    }
    catch(e){
        console.error("Error during update:", e);
    }
    await disconnect_MongoDB();
    console.log("Disconnected from MongoDB"); 
}

main()