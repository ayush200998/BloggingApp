const mongodb = require("mongodb")
const dotenv = require("dotenv")
dotenv.config()
// let db 
// let connectionString = "mongodb+srv://todoAppUser:passqbtau20@cluster0-l2i6m.mongodb.net/ComplexApp?retryWrites=true&w=majority"

    mongodb.connect(process.env.CONNECTIONSTRING , {useNewUrlParser : true , useUnifiedTopology : true} , function(err , client){
        module.exports = client
        
            const app = require("./server")
            app.listen(process.env.PORT , function(){
                console.log("running on port 9000")
            })
    })