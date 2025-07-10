function get_randNum(minimo,maximo){
    minimo = Math.ceil(minimo);
    maximo = Math.floor(maximo);

    return Math.floor(Math.random() * (maximo - minimo + 1)) + minimo;
}

function get_pixelCoords(arr){
    let [x,y]=arr.slice(0,2);

    return [x,y];
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


module.exports={get_randNum,get_pixelCoords,changePixel,delete_arrElem};