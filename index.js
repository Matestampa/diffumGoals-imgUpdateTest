const {connect_MongoDB,disconnect_MongoDB}=require("./mongodb/connection.js")

const {get_ImgFile_Array,save_NewImgFile,get_Img_FromDb_Pagination,saveMulti_NewImg_2Db}=require("./update/getters_savers.js");

const {localDiffum} = require("./update/utils.js");


async function dale(){
    await connect_MongoDB();

    let nextPage=true
    let page=1
    let limit=10

    while (nextPage){
        console.log(`Processing page ${page} (limit: ${limit})`)

        //Get batch of goals from DB
        results=await get_Img_FromDb_Pagination(page,limit)
        
        goals=results.data
        
        nextPage=results.pagination.hasNextPage
        page++

        //S3 donwload and local update
        dbData_2_update=[]
        s3Data_2_update=[]
        for (let goal of goals){
        
            //Get image data and info from S3
            let {image_dataArr,imageInfo}=await get_ImgFile_Array(goal.s3_imgName);
            
            //Apply local diffum
            image_dataArr=localDiffum(image_dataArr,goal.diffum_color,goal.cant_pix_xday,imageInfo);
            
            dbData_2_update.push({id:goal.id})
            s3Data_2_update.push({
                imgName:goal.s3_imgName,
                pixelArr:image_dataArr,
                imageInfo:imageInfo,
            })
        }

        //Update goals data in DB in batch
        await saveMulti_NewImg_2Db(dbData_2_update)

        //Upload updated images to S3
        for (let goalImage of s3Data_2_update){

            await save_NewImgFile(goalImage.imgName,goalImage.pixelArr,goalImage.imageInfo)
        }

        console.log(`Page ${page - 1} completed - Processed ${goals.length} goals`)
    }

    await disconnect_MongoDB(); 
}


dale()