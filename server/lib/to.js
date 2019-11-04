const logger = require('logat')
module.exports=function to(promise) {
    return promise.then(data => {
        return [null, data];
    })
        .catch(err =>{
            return [{error:500,message:err.message}]
        });
};