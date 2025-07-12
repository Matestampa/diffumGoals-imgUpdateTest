const mongoose = require("mongoose");

const { MONGODB_VARS } = require("../config/mongodb_config.js");

const {MongoDB_Error}=require("./error_handler.js");

//----- CONNECTION STRING/URL ----------
const connectionString=MONGODB_VARS.url;  //------------- PONEEEER ------------


async function connect_MongoDB(){
    try{
        await mongoose.connect(connectionString);
    }

    catch(e){
        throw new MongoDB_Error("",e)
    }
}

async function disconnect_MongoDB(){
    mongoose.connection.close();
}

//------------------- ERROR HANDLING --------------------------------
/*mongoose.connection.on("error",e=>{
    internalError_handler(new MongoDB_Connection_Error("",e));
})


class MongoDB_Connection_Error extends InternalError{
    constructor(message,attachedError){
        super(message,attachedError)
        this.name="MongoDB_Connection_Error";
        this.critic=true;
    }
}*/

/*class MongoDB_Error extends InternalError{
    constructor(message,attachedError){
        super(message,attachedError)
        this.name="MongoDB_Error";
        this.critic=true;
    }
}*/


module.exports= {connect_MongoDB,disconnect_MongoDB};