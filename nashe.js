//const {infoLogger,errorLogger} = require("./error_handling/logger.js");
const {InternalError,internalError_handler} = require("./error_handling")
const {MongoDB_Connection_Error,MongoDB_Error,S3_Error,CleanCache_Error} = require("./update/errors.js")
    
const {connect_MongoDB,disconnect_MongoDB} = require("./mongodb")
const {S3_FUNCS} = require("./aws_services");
const {updateMulti_Goals_2Db} = require("./update/getters_savers.js");

async function dale(){

    //-------------- MongoDB CONNECTION ERROR TEST ----------------
    try{
        await connect_MongoDB()
        await disconnect_MongoDB()
    }
    catch(e){
        internalError_handler(new MongoDB_Connection_Error("Error de conexion a la base de datos",e),"Connecting to mongo",["All"]);
    }

    //-------------- Mongodb ERROR TEST ----------------
    try{
        await updateMulti_Goals_2Db([1,2,3])
    }
    catch(e){
        console.log(e)
        internalError_handler(new MongoDB_Error("nose",e),"Update goals",[1,2,3]);
    }
    
    //-------------- S3 ERROR TEST ----------------
    try{
        await S3_FUNCS.getObject("holaaaa")
        //throw new AwsService_Unknown_Error("HOLA",null,"S3");
        //throw new NoseError("nose")
    }
    catch(e){
        //console.log(e instanceof Error)
        //console.log(e)
        internalError_handler(new S3_Error("Error al obtener el archivo de S3",e),"Download",[1,2,3]);
    }

    //-------------- CLEAN CACHE ERROR TEST ----------------
    try{
        throw new Error("HOLA")
    }
    catch(e){
        internalError_handler(new CleanCache_Error("Error al limpiar la cache",e),"CleanCache",[1,2,3]);
    }
}

dale()