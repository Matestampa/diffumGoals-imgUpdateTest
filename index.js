const {connect_MongoDB,disconnect_MongoDB}=require("./mongodb/connection.js")

const {get_ImgFile_Array,save_NewImgFile,get_Img_FromDb,save_NewImg_2Db,get_Img_FromDb_Pagination}=require("./update/getters_savers.js");

const {get_randNum,get_pixelCoords,
       changePixel,delete_arrElem}=require("./update/utils.js");

//updateGoal_onlyS3("652b9f1e9f1e9f1e9f1e9f1f_s3",DEFAULT_UNTOUCHED_PIX,DEFLT_CANT_PIX_XDAY,DEFLT_DIFFUM_COLOR)
goals=["652b9f1e9f1e9f1e9f1e9f01",
    "652b9f1e9f1e9f1e9f1e9f02",
    "652b9f1e9f1e9f1e9f1e9f03",
    "652b9f1e9f1e9f1e9f1e9f04",
    "652b9f1e9f1e9f1e9f1e9f05",
    "652b9f1e9f1e9f1e9f1e9f06",
    "652b9f1e9f1e9f1e9f1e9f07",
    "652b9f1e9f1e9f1e9f1e9f08",
    "652b9f1e9f1e9f1e9f1e9f09",
    "652b9f1e9f1e9f1e9f1e9f10",
    "652b9f1e9f1e9f1e9f1e9f11",
    "652b9f1e9f1e9f1e9f1e9f12",
    "652b9f1e9f1e9f1e9f1e9f13",
    "652b9f1e9f1e9f1e9f1e9f14",
    "652b9f1e9f1e9f1e9f1e9f15",
    "652b9f1e9f1e9f1e9f1e9f16",
    "652b9f1e9f1e9f1e9f1e9f17",
    "652b9f1e9f1e9f1e9f1e9f18",
    "652b9f1e9f1e9f1e9f1e9f19",
    "652b9f1e9f1e9f1e9f1e9f20",
    "652b9f1e9f1e9f1e9f1e9f21",
    "652b9f1e9f1e9f1e9f1e9f22",
    "652b9f1e9f1e9f1e9f1e9f23",
    "652b9f1e9f1e9f1e9f1e9f24",
    "652b9f1e9f1e9f1e9f1e9f25",
    "652b9f1e9f1e9f1e9f1e9f26",
    "652b9f1e9f1e9f1e9f1e9f27",
    "652b9f1e9f1e9f1e9f1e9f28",
    "652b9f1e9f1e9f1e9f1e9f29",
    "652b9f1e9f1e9f1e9f1e9f30"
      ]

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

    // Track MongoDB download time
    let dbDownloadStart = performance.now()
    let {untouched_pix,cant_pix_xday,diffum_color,s3_imgName}=await get_Img_FromDb(dbId)
    let dbDownloadEnd = performance.now()
    let dbDownloadTime = dbDownloadEnd - dbDownloadStart
    
    let {image_dataArr,imageInfo}=await get_ImgFile_Array(s3_imgName);
    
    
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
    
    // Track MongoDB upload time
    let dbUploadStart = performance.now()
    await save_NewImg_2Db(dbId,untouched_pix);
    let dbUploadEnd = performance.now()
    let dbUploadTime = dbUploadEnd - dbUploadStart
    
    await save_NewImgFile(s3_imgName,image_dataArr,imageInfo);

    // Return timing data
    return {
        dbDownloadTime,
        dbUploadTime
    };

}

async function main(){
    try{
        await connect_MongoDB();
        console.log("Connected to MongoDB");

        // Arrays to store all timing data
        let allDbDownloadTimes = []
        let allDbUploadTimes = []
        
        // Temporary arrays for current batch (10 IDs)
        let batchDbDownloadTimes = []
        let batchDbUploadTimes = []
        
        let processedCount = 0;

        for (let goalId of goals){
            console.log(`Updating goal with ID: ${goalId} (${processedCount + 1}/${goals.length})`);
            
            let timingData = await updateGoal(goalId);
            
            // Store timing data
            allDbDownloadTimes.push(timingData.dbDownloadTime);
            allDbUploadTimes.push(timingData.dbUploadTime);
            batchDbDownloadTimes.push(timingData.dbDownloadTime);
            batchDbUploadTimes.push(timingData.dbUploadTime);
            
            processedCount++;
            console.log(`Goal with ID: ${goalId} updated successfully (DB Download: ${timingData.dbDownloadTime.toFixed(2)}ms, DB Upload: ${timingData.dbUploadTime.toFixed(2)}ms)`);
            
            // Every 10 IDs, calculate and display batch statistics
            if (processedCount % 10 === 0 || processedCount === goals.length) {
                let batchDbDownloadSum = batchDbDownloadTimes.reduce((sum, time) => sum + time, 0);
                let batchDbUploadSum = batchDbUploadTimes.reduce((sum, time) => sum + time, 0);
                let batchTotalSum = batchDbDownloadSum + batchDbUploadSum;
                
                console.log(`\n=== Batch Statistics (IDs ${processedCount - batchDbDownloadTimes.length + 1} to ${processedCount}) ===`);
                console.log(`Batch DB Download Total: ${batchDbDownloadSum.toFixed(2)}ms`);
                console.log(`Batch DB Upload Total: ${batchDbUploadSum.toFixed(2)}ms`);
                console.log(`Batch Combined Total: ${batchTotalSum.toFixed(2)}ms`);
                console.log(`Batch Size: ${batchDbDownloadTimes.length} IDs\n`);
                
                // Reset batch arrays for next batch
                batchDbDownloadTimes = [];
                batchDbUploadTimes = [];
            }
        }
        
        // Calculate and display final statistics (averages per ID)
        if (allDbDownloadTimes.length > 0) {
            let totalDbDownloadTime = allDbDownloadTimes.reduce((sum, time) => sum + time, 0);
            let totalDbUploadTime = allDbUploadTimes.reduce((sum, time) => sum + time, 0);
            let totalCombinedTime = totalDbDownloadTime + totalDbUploadTime;
            
            let avgDbDownloadPerID = totalDbDownloadTime / allDbDownloadTimes.length;
            let avgDbUploadPerID = totalDbUploadTime / allDbUploadTimes.length;
            let avgCombinedPerID = totalCombinedTime / allDbDownloadTimes.length;
            
            console.log(`\n=== FINAL STATISTICS (All ${allDbDownloadTimes.length} IDs) ===`);
            console.log(`Total DB Download Time: ${totalDbDownloadTime.toFixed(2)}ms`);
            console.log(`Total DB Upload Time: ${totalDbUploadTime.toFixed(2)}ms`);
            console.log(`Total Combined Time: ${totalCombinedTime.toFixed(2)}ms`);
            console.log(`\nAVERAGE PER ID:`);
            console.log(`Average DB Download per ID: ${avgDbDownloadPerID.toFixed(2)}ms`);
            console.log(`Average DB Upload per ID: ${avgDbUploadPerID.toFixed(2)}ms`);
            console.log(`Average Combined per ID: ${avgCombinedPerID.toFixed(2)}ms`);
        }
  
    }
    catch(e){
        console.error("Error during update:", e);
    }
    await disconnect_MongoDB();
    console.log("Disconnected from MongoDB"); 
}

main()