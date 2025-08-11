

function localDiffum(image_dataArr,diffum_color,cant_pix_xday,imageInfo){
    let untouched_pix=get_untouchedPix(image_dataArr,diffum_color,imageInfo.channels);
    let new_image_dataArr=image_dataArr

    let lastDiffum = false;
    if (untouched_pix.length<=cant_pix_xday){
        cant_pix_xday=untouched_pix.length;
        lastDiffum = true;
    }

    for (let i=0;i<cant_pix_xday;i++){
        let rand_arrPos=get_randNum(0,untouched_pix.length-1);
        let pixel_coords=untouched_pix[rand_arrPos];
        changePixel(pixel_coords[0],pixel_coords[1],diffum_color,image_dataArr,imageInfo);
        delete_arrElem(rand_arrPos,untouched_pix);
    }
    
    new_image_dataArr=image_dataArr;
    return {new_image_dataArr,lastDiffum}
}



function get_randNum(minimo,maximo){
    minimo = Math.ceil(minimo);
    maximo = Math.floor(maximo);

    return Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;
}

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

function changePixel(x,y,new_color,imgArr,imgInfo){
    // Calcular el índice del píxel en el buffer
    const indice = (y * imgInfo.width + x) * imgInfo.channels;

    // Modificar los valores RGB
    imgArr[indice] = new_color[0];
    imgArr[indice + 1] = new_color[1];
    imgArr[indice + 2] = new_color[2];
}

function delete_arrElem(index,arr){
    arr.splice(index,1);
}


module.exports={localDiffum};