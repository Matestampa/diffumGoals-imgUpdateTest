const {connect_MongoDB,disconnect_MongoDB}=require("./mongodb/connection.js")

const {get_ImgFile_Array,save_NewImgFile,get_Goals_FromDb_Pagination,updateMulti_Goals_2Db}=require("./update/getters_savers.js");

const {localDiffum} = require("./update/utils.js");


//----------------- Get params to modify in DB , according to the situation ----------------

//DIFFUM operation
function get_dbDiffumOperation(){

    return {last_diffumDate: new Date()}
}

//SET_EXPIRED operation
function get_dbSetExpiredOperation(){

    return {expired: true,last_diffumDate: new Date()}
}


//------------------------------ Main func ---------------------------------------------------

async function main(){
    await connect_MongoDB();

    let nextCursor=null
    let limit=10

    do{
        console.log(`Processing page from cursor ${nextCursor} (limit: ${limit})`)

        //Get batch of goals from DB
        results=await get_Goals_FromDb_Pagination(nextCursor,limit,{expired:false})

        goals=results.data
        
        nextCursor=results.pagination.nextCursor

        //S3 donwload and local update
        dbData_2_update=[]
        s3Data_2_update=[]
        batchOperations=[]
        for (let goal of goals){
        
            //Get image data and info from S3
            let {image_dataArr,imageInfo}=await get_ImgFile_Array(goal.s3_imgName);
            
            //Apply local diffum
            let lastDiffum=false;
            ({new_image_dataArr,lastDiffum}=localDiffum(image_dataArr,goal.diffum_color,goal.cant_pix_xday,imageInfo));
            console.log("Is the last diffum", lastDiffum)

            //If the last pixels are diffumed or the date is expired, the goal is set to expired
            if (lastDiffum || goal.limit_date < new Date()){
                dbData_2_update.push({id:goal.id,settedObject:get_dbSetExpiredOperation()})
                batchOperations.push({id:goal.id,operation:"SET_EXPIRED"})
            }

            //If the goal is not expired, it is updated with the new diffum data
            else{
                dbData_2_update.push({id:goal.id,settedObject:get_dbDiffumOperation()})
                batchOperations.push({id:goal.id,operation:"DIFFUM"})
            }

            s3Data_2_update.push({
                imgName:goal.s3_imgName,
                pixelArr:new_image_dataArr,
                imageInfo:imageInfo,
            })
        }

        console.log("Batch operations:", batchOperations)
        //Update goals data in DB in batch
        await updateMulti_Goals_2Db(dbData_2_update)

        console.log("Batch operations to db completed")


        //Upload updated images to S3
        for (let goalImage of s3Data_2_update){

            await save_NewImgFile(goalImage.imgName,goalImage.pixelArr,goalImage.imageInfo)
        }
        console.log("Batch operations to S3 completed")

        console.log(`Page from cursor ${nextCursor} completed - Processed ${goals.length} goals`)

    }
    while(nextCursor);

    await disconnect_MongoDB(); 
}


main()