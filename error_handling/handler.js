const {infoLogger,errorLogger} = require("./logger.js")


async function internalError_handler(error,action,goalsIds){

    infoLogger.info(`Se ha producido un error en la accion: ${action} con los goals: ${goalsIds}`,{action,goalsIds});
    errorLogger.error(error,{action,goalsIds});

    //Logear error en un formato especifico.
    //console.log({error,action});
    //console.log(error.attachedError.attachedError)
}


//internalError_handler(new MongoDB_Connection_Error("Error de conexion a la base de datos"),"Conectando a la base de datos",[3,4,2])

module.exports= {internalError_handler};