
async function internalError_handler(error,action){
    
    //Logear error en un formato especifico.
    console.log({error,action});
}


module.exports= {internalError_handler};