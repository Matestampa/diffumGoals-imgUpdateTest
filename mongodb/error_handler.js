const { InternalError } = require("../error_handling");

class MongoDB_Connection_Error extends InternalError{
    constructor(message,attachedError){
        super(message,attachedError)
        this.name="MongoDB_Connection_Error";
        this.critic=true;
    }
}

class MongoDB_Error extends InternalError{
    constructor(message,attachedError){
        super(message,attachedError)
        this.name="MongoDB_Error";
        this.critic=true;
    }
}

module.exports = {MongoDB_Error};
