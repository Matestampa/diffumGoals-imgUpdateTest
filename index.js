const {get_ImgFile_Array,save_NewImgFile}=require("./update/getters_savers.js");

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

untouched_pix=get_untouchedPixArr(100,100); //Ejemplo de 100x100px
cant_pix_xday=50
diffum_color=get_randomRGBColor()

async function updateGoal(s3_imgName){
  
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

updateGoal("652b9f1e9f1e9f1e9f1e9f1f_s3")