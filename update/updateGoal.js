
const {get_Img_FromDb,save_NewImg_2Db,
  get_ImgFile_Array,save_NewImgFile}=require("./getters_savers.js");

const {get_randNum,get_pixelCoords,
       changePixel,delete_arrElem}=require("./utils.js");



async function updateGoal(dbId){
  
  let {untouched_pix,cant_pix_xday,diffum_color,s3_imgName}=await get_Img_FromDb(dbId)

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
  
  await save_NewImg_2Db(dbId,untouched_pix);
  await save_NewImgFile(s3_imgName,image_dataArr,imageInfo);

}


module.exports={updateGoal};

/*-------------------------- Con openCV para node (es mas practico) ------------
//(USAR ESTO PARA PROBAR Y YA FUEEEE, ES MAS CORTO)
const cv = require('opencv4nodejs');

// Cargar la imagen
const img = cv.imread('imagen.jpg');

// Obtener los datos de la imagen como un array de números
const data = img.getData();

// Modificar un píxel (ejemplo: convertir a rojo)
data.set(0, 0, [255, 0, 0]); // Modifica el píxel en la posición (0, 0) a rojo

// Guardar la imagen modificada
img.setData(data);
cv.imwrite('nueva_imagen.jpg', img); */