const {connect_MongoDB,disconnect_MongoDB}=require("./mongodb/connection.js")

const {get_ImgFile_Array,save_NewImgFile,get_Img_FromDb,save_NewImg_2Db,get_Img_FromDb_Pagination,saveMulti_NewImg_2Db}=require("./update/getters_savers.js");

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

async function getS3Image_and_update(s3_imgName,untouched_pix,cant_pix_xday,diffum_color){

    //console.time("get_ImgFile_fromS3")
    let {image_dataArr,imageInfo}=await get_ImgFile_Array(s3_imgName);
    //console.timeEnd("get_ImgFile_fromS3")
    
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

    return {untouched_pix,image_dataArr,imageInfo}
    
    console.time("save_NewImg_2Db")
    await save_NewImg_2Db(dbId,untouched_pix);
    console.timeEnd("save_NewImg_2Db")
    console.time("save_NewImgFile")
    await save_NewImgFile(s3_imgName,image_dataArr,imageInfo);
    console.timeEnd("save_NewImgFile")
    console.timeEnd("updateOneGoal")

}


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
        let nextPage=true
        let page=1
        let limit=30
        
        // Arrays to store timing data for each iteration
        let mongoDownloadTimes = []
        let mongoUploadTimes = []
        
        while (nextPage){
          console.log(`Processing page ${page} (limit: ${limit})`)

          // MongoDB Download timing
          let mongoDownloadStart = performance.now()
          results=await get_Img_FromDb_Pagination(page,limit)
          let mongoDownloadEnd = performance.now()
          let mongoDownloadTime = mongoDownloadEnd - mongoDownloadStart
          mongoDownloadTimes.push(mongoDownloadTime)
          console.log(`MongoDB download time: ${mongoDownloadTime.toFixed(2)}ms - Retrieved ${results.data.length} documents`)
          
          goals=results.data
          nextPage=results.pagination.hasNextPage
          page++

          //Obtener imagenes de s3 y updatear la data localmente (osea sin suburla todavia)
          console.log("Descargando de s3 y actualizando")
          dbData_2_update=[]
          s3Data_2_update=[]
          for (let goal of goals){
            //let {untouched_pix,image_dataArr,imageInfo}=await getS3Image_and_update(goal.s3_imgName,goal.untouched_pix,goal.cant_pix_xday,goal.diffum_color)
            //dbData_2_update.push({id:goal.id,untouched_pix:untouched_pix})
            dbData_2_update.push({id:goal.id})
            //s3Data_2_update.push({imgName:goal.s3_imgName,pixelArr:image_dataArr,imageInfo:imageInfo})
          }

          // MongoDB Upload timing
          let mongoUploadStart = performance.now()
          await saveMulti_NewImg_2Db(dbData_2_update)
          let mongoUploadEnd = performance.now()
          let mongoUploadTime = mongoUploadEnd - mongoUploadStart
          mongoUploadTimes.push(mongoUploadTime)
          console.log(`MongoDB upload time: ${mongoUploadTime.toFixed(2)}ms - Updated ${dbData_2_update.length} documents`)

          /*subir a s3
          console.log("Subiendo a s3")
          for (let goalImage of s3Data_2_update){
             await save_NewImgFile(goalImage.imgName,goalImage.pixelArr,goalImage.imageInfo)
          }*/

          if (!nextPage) {
            console.log("Reached last page - no more documents to process")
          }

        }
        
        // Calculate and display timing statistics
        if (mongoDownloadTimes.length > 0) {
          let totalDownloadTime = mongoDownloadTimes.reduce((sum, time) => sum + time, 0)
          let avgDownloadTime = totalDownloadTime / mongoDownloadTimes.length
          console.log(`\n=== MongoDB Download Statistics ===`)
          console.log(`Total iterations: ${mongoDownloadTimes.length}`)
          console.log(`Total download time: ${totalDownloadTime.toFixed(2)}ms`)
          console.log(`Average download time per iteration: ${avgDownloadTime.toFixed(2)}ms`)
        }
        
        if (mongoUploadTimes.length > 0) {
          let totalUploadTime = mongoUploadTimes.reduce((sum, time) => sum + time, 0)
          let avgUploadTime = totalUploadTime / mongoUploadTimes.length
          console.log(`\n=== MongoDB Upload Statistics ===`)
          console.log(`Total iterations: ${mongoUploadTimes.length}`)
          console.log(`Total upload time: ${totalUploadTime.toFixed(2)}ms`)
          console.log(`Average upload time per iteration: ${avgUploadTime.toFixed(2)}ms`)
        }
        
        if (mongoDownloadTimes.length > 0 && mongoUploadTimes.length > 0) {
          let totalCombinedTime = mongoDownloadTimes.reduce((sum, time) => sum + time, 0) + 
                                 mongoUploadTimes.reduce((sum, time) => sum + time, 0)
          let avgCombinedTime = totalCombinedTime / mongoDownloadTimes.length
          console.log(`\n=== Combined MongoDB Statistics ===`)
          console.log(`Total combined time (download + upload): ${totalCombinedTime.toFixed(2)}ms`)
          console.log(`Average combined time per iteration: ${avgCombinedTime.toFixed(2)}ms`)
        }
        
    }
    catch(e){
        console.error("Error during update:", e);
    }
    await disconnect_MongoDB();
    console.log("Disconnected from MongoDB"); 
}

main()