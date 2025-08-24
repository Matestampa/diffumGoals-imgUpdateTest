const {InternalError} = require("../error_handling/general_errors.js")

class MongoDB_InitialConnection_Error extends InternalError{
    constructor(message,attachedError){
        super(message,attachedError)
        this.name="MongoDB_InitialConnection_Error";
        this.critic=true;
    }
}


module.exports = {
    MongoDB_InitialConnection_Error
}
