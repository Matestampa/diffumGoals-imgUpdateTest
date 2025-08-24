
async function internalError_handler(error,action){
    
    //Logear error en un formato especifico.
    console.log({error,action});
    console.log(error.attachedError.attachedError)
}


module.exports= {internalError_handler};