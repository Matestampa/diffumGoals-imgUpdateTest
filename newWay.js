const {connect_MongoDB,disconnect_MongoDB}=require("./mongodb/connection.js")

const {get_ImgFile_Array,save_NewImgFile,get_Img_FromDb,save_NewImg_2Db,get_Img_FromDb_Pagination,saveMulti_NewImg_2Db}=require("./update/getters_savers.js");

const {get_randNum,changePixel,delete_arrElem} = require("./update/utils.js");

const IMG="652b9f1e9f1e9f1e9f1e9f00_s3"
const DIFFUM_COLOR=[0,0,0]
let cant_pix_xday=300

function get_untouchedPix(image_dataArr,diffum_color,channels){
    let untouched_pix=[]

    for (let i=0;i<image_dataArr.length;i+=channels){
        pixelColor=image_dataArr.slice(i,i+channels);
        if (pixelColor[0]===diffum_color[0] && pixelColor[1]===diffum_color[1] && pixelColor[2]===diffum_color[2]){
            let a=1
        }
        else{
            let x=Math.floor(i/channels % 100); // Assuming width is 100
            let y=Math.floor(i/channels / 100);
            untouched_pix.push([x,y]);
        }

    }
    return untouched_pix
}

goals=[
    "652b9f1e9f1e9f1e9f1e9f00_s3",
    "652b9f1e9f1e9f1e9f1e9f01_s3",
    "652b9f1e9f1e9f1e9f1e9f02_s3",
    "652b9f1e9f1e9f1e9f1e9f03_s3",
    "652b9f1e9f1e9f1e9f1e9f04_s3",
    "652b9f1e9f1e9f1e9f1e9f05_s3",
    "652b9f1e9f1e9f1e9f1e9f06_s3",
    "652b9f1e9f1e9f1e9f1e9f07_s3",
    "652b9f1e9f1e9f1e9f1e9f08_s3",
    "652b9f1e9f1e9f1e9f1e9f09_s3",
    "652b9f1e9f1e9f1e9f1e9f10_s3",
    "652b9f1e9f1e9f1e9f1e9f11_s3",
    "652b9f1e9f1e9f1e9f1e9f12_s3",
    "652b9f1e9f1e9f1e9f1e9f13_s3",
    "652b9f1e9f1e9f1e9f1e9f14_s3",
    "652b9f1e9f1e9f1e9f1e9f15_s3",
    "652b9f1e9f1e9f1e9f1e9f16_s3",
    "652b9f1e9f1e9f1e9f1e9f17_s3",
    "652b9f1e9f1e9f1e9f1e9f18_s3",
    "652b9f1e9f1e9f1e9f1e9f19_s3",
    "652b9f1e9f1e9f1e9f1e9f20_s3",
]

function localDiffum(image_dataArr,diffum_color,cant_pix_xday,imageInfo){
    let untouched_pix=get_untouchedPix(image_dataArr,diffum_color,imageInfo.channels);
    let new_image_dataArr=image_dataArr

    if (untouched_pix.length<cant_pix_xday){
        cant_pix_xday=untouched_pix.length;
    }

    for (let i=0;i<cant_pix_xday;i++){
        let rand_arrPos=get_randNum(0,untouched_pix.length-1);
        let pixel_coords=untouched_pix[rand_arrPos];
        changePixel(pixel_coords[0],pixel_coords[1],DIFFUM_COLOR,image_dataArr,imageInfo);
        delete_arrElem(rand_arrPos,untouched_pix);
    }
    
    new_image_dataArr=image_dataArr;
    return new_image_dataArr
}


async function dale(){
    await connect_MongoDB();

    let nextPage=true
    let page=1
    let limit=10

    // Arrays to store timing data for each goal
    let s3DownloadTimes = []
    let localDiffumTimes = []
    let s3UploadTimes = []
    let totalGoalTimes = []
    
    // Arrays to store MongoDB timing data (per batch)
    let mongoDownloadTimes = []
    let mongoUploadTimes = []
    let mongoDownloadTimesPerGoal = []
    let mongoUploadTimesPerGoal = []

    while (nextPage){
        console.log(`Processing page ${page} (limit: ${limit})`)

        // Time MongoDB download (get_Img_FromDb_Pagination)
        let mongoDownloadStart = performance.now()
        results=await get_Img_FromDb_Pagination(page,limit)
        let mongoDownloadEnd = performance.now()
        let mongoDownloadTime = mongoDownloadEnd - mongoDownloadStart
        mongoDownloadTimes.push(mongoDownloadTime)
        
        goals=results.data
        let currentBatchSize = goals.length
        
        // Calculate average MongoDB download time per goal for this batch
        let mongoDownloadTimePerGoal = mongoDownloadTime / currentBatchSize
        for (let i = 0; i < currentBatchSize; i++) {
            mongoDownloadTimesPerGoal.push(mongoDownloadTimePerGoal)
        }
        
        console.log(`MongoDB download: ${mongoDownloadTime.toFixed(2)}ms for ${currentBatchSize} goals (${mongoDownloadTimePerGoal.toFixed(2)}ms per goal)`)
        
        nextPage=results.pagination.hasNextPage
        page++

        //S3 donwload and local update
        dbData_2_update=[]
        s3Data_2_update=[]
        for (let goal of goals){
            // 1. Time S3 download (get_ImgFile_Array)
            let s3DownloadStart = performance.now()
            let {image_dataArr,imageInfo}=await get_ImgFile_Array(goal.s3_imgName);
            let s3DownloadEnd = performance.now()
            let s3DownloadTime = s3DownloadEnd - s3DownloadStart
            s3DownloadTimes.push(s3DownloadTime)
            
            // 2. Time local processing (localDiffum)
            let localDiffumStart = performance.now()
            image_dataArr=localDiffum(image_dataArr,goal.diffum_color,goal.cant_pix_xday,imageInfo);
            let localDiffumEnd = performance.now()
            let localDiffumTime = localDiffumEnd - localDiffumStart
            localDiffumTimes.push(localDiffumTime)
            
            dbData_2_update.push({id:goal.id})
            s3Data_2_update.push({
                imgName:goal.s3_imgName,
                pixelArr:image_dataArr,
                imageInfo:imageInfo,
                s3DownloadTime: s3DownloadTime,
                localDiffumTime: localDiffumTime
            })
        }

        // Time MongoDB upload (saveMulti_NewImg_2Db)
        let mongoUploadStart = performance.now()
        await saveMulti_NewImg_2Db(dbData_2_update)
        let mongoUploadEnd = performance.now()
        let mongoUploadTime = mongoUploadEnd - mongoUploadStart
        mongoUploadTimes.push(mongoUploadTime)
        
        // Calculate average MongoDB upload time per goal for this batch
        let mongoUploadTimePerGoal = mongoUploadTime / currentBatchSize
        for (let i = 0; i < currentBatchSize; i++) {
            mongoUploadTimesPerGoal.push(mongoUploadTimePerGoal)
        }
        
        console.log(`MongoDB upload: ${mongoUploadTime.toFixed(2)}ms for ${currentBatchSize} goals (${mongoUploadTimePerGoal.toFixed(2)}ms per goal)`)

        //S3 upload
        for (let goalImage of s3Data_2_update){
            // 3. Time S3 upload (save_NewImgFile)
            let s3UploadStart = performance.now()
            await save_NewImgFile(goalImage.imgName,goalImage.pixelArr,goalImage.imageInfo)
            let s3UploadEnd = performance.now()
            let s3UploadTime = s3UploadEnd - s3UploadStart
            s3UploadTimes.push(s3UploadTime)
            
            // Calculate total time for this goal (download + localDiffum + upload)
            let totalGoalTime = goalImage.s3DownloadTime + goalImage.localDiffumTime + s3UploadTime
            totalGoalTimes.push(totalGoalTime)
        }

        console.log(`Page ${page - 1} completed - Processed ${goals.length} goals`)
    }

    // Calculate and display final statistics
    if (s3DownloadTimes.length > 0) {
        let totalS3DownloadTime = s3DownloadTimes.reduce((sum, time) => sum + time, 0)
        let totalLocalDiffumTime = localDiffumTimes.reduce((sum, time) => sum + time, 0)
        let totalS3UploadTime = s3UploadTimes.reduce((sum, time) => sum + time, 0)
        let totalCombinedTime = totalGoalTimes.reduce((sum, time) => sum + time, 0)
        
        // MongoDB timing totals
        let totalMongoDownloadTime = mongoDownloadTimes.reduce((sum, time) => sum + time, 0)
        let totalMongoUploadTime = mongoUploadTimes.reduce((sum, time) => sum + time, 0)
        let totalMongoTime = totalMongoDownloadTime + totalMongoUploadTime
        
        let avgS3DownloadPerGoal = totalS3DownloadTime / s3DownloadTimes.length
        let avgLocalDiffumPerGoal = totalLocalDiffumTime / localDiffumTimes.length
        let avgS3UploadPerGoal = totalS3UploadTime / s3UploadTimes.length
        let avgTotalPerGoal = totalCombinedTime / totalGoalTimes.length
        
        // MongoDB averages per goal
        let avgMongoDownloadPerGoal = mongoDownloadTimesPerGoal.reduce((sum, time) => sum + time, 0) / mongoDownloadTimesPerGoal.length
        let avgMongoUploadPerGoal = mongoUploadTimesPerGoal.reduce((sum, time) => sum + time, 0) / mongoUploadTimesPerGoal.length
        let avgMongoTotalPerGoal = avgMongoDownloadPerGoal + avgMongoUploadPerGoal
        
        // Grand total including MongoDB
        let grandTotalTime = totalCombinedTime + totalMongoTime
        let avgGrandTotalPerGoal = avgTotalPerGoal + avgMongoTotalPerGoal
        
        console.log(`\n=== FINAL STATISTICS (${s3DownloadTimes.length} goals processed) ===`)
        
        console.log(`\nMONGODB BATCH OPERATIONS:`)
        console.log(`Total MongoDB Download time: ${totalMongoDownloadTime.toFixed(2)}ms (${mongoDownloadTimes.length} batches)`)
        console.log(`Total MongoDB Upload time: ${totalMongoUploadTime.toFixed(2)}ms (${mongoUploadTimes.length} batches)`)
        console.log(`Total MongoDB time: ${totalMongoTime.toFixed(2)}ms`)
        
        console.log(`\nS3 & LOCAL PROCESSING:`)
        console.log(`Total S3 Download time: ${totalS3DownloadTime.toFixed(2)}ms`)
        console.log(`Total Local Diffum time: ${totalLocalDiffumTime.toFixed(2)}ms`)
        console.log(`Total S3 Upload time: ${totalS3UploadTime.toFixed(2)}ms`)
        console.log(`Total S3 & Local time: ${totalCombinedTime.toFixed(2)}ms`)
        
        console.log(`\nGRAND TOTAL: ${grandTotalTime.toFixed(2)}ms`)
        
        console.log(`\nAVERAGE PER GOAL:`)
        console.log(`Average MongoDB Download per goal: ${avgMongoDownloadPerGoal.toFixed(2)}ms`)
        console.log(`Average MongoDB Upload per goal: ${avgMongoUploadPerGoal.toFixed(2)}ms`)
        console.log(`Average MongoDB Total per goal: ${avgMongoTotalPerGoal.toFixed(2)}ms`)
        console.log(`Average S3 Download per goal: ${avgS3DownloadPerGoal.toFixed(2)}ms`)
        console.log(`Average Local Diffum per goal: ${avgLocalDiffumPerGoal.toFixed(2)}ms`)
        console.log(`Average S3 Upload per goal: ${avgS3UploadPerGoal.toFixed(2)}ms`)
        console.log(`Average S3 & Local Total per goal: ${avgTotalPerGoal.toFixed(2)}ms`)
        console.log(`Average GRAND TOTAL per goal: ${avgGrandTotalPerGoal.toFixed(2)}ms`)
        
        console.log(`\nPERCENTAGE BREAKDOWN (of Grand Total):`)
        console.log(`MongoDB Download: ${(totalMongoDownloadTime/grandTotalTime*100).toFixed(1)}%`)
        console.log(`MongoDB Upload: ${(totalMongoUploadTime/grandTotalTime*100).toFixed(1)}%`)
        console.log(`S3 Download: ${(totalS3DownloadTime/grandTotalTime*100).toFixed(1)}%`)
        console.log(`Local Diffum: ${(totalLocalDiffumTime/grandTotalTime*100).toFixed(1)}%`)
        console.log(`S3 Upload: ${(totalS3UploadTime/grandTotalTime*100).toFixed(1)}%`)
    }

    await disconnect_MongoDB(); 
}


dale()