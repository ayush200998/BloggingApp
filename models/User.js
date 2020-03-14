const bcrypt = require("bcryptjs")
const userCollection = require("../db").db().collection("users")
const validator = require("validator")
const md5 = require("md5")

// User model for every user to login.
let User = function(data , isTrue){
    this.data = data 
    this.error = []

    if(isTrue == undefined){
        isTrue = false
    }

    if(isTrue){
        this.getAvatar()
    }
}

// Checking for the entered value that it should only contain strings .
User.prototype.cleanUp = function(){
    if(typeof(this.data.username) != "string"){
        this.data.username = ""
    }

    if(typeof(this.data.email) != "string"){
        this.data.email = ""
    }

    if(typeof(this.data.password) != "string"){
        this.data.password = ""
    }

    this.data = {
        username : this.data.username.trim().toLowerCase(),
        email : this.data.email.trim().toLowerCase(),
        password : this.data.password
    }
}

// Form Validation for the users.
User.prototype.validate = function(){
    return new Promise(async (resolve , reject) =>{
        if(this.data.username == ""){
            this.error.push("Provide a Valid Username")
        }
    
        if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){
            this.error.push("Username can only contain strings of numbers or alphabets")
        }
    
        if(!validator.isEmail(this.data.email)){
           this.error.push("Provide a Valid Email")
       }
    
       if(this.data.password == ""){
           this.error.push("Provide a Valid Password")
       }
    
       if(this.data.password.length > 0 && this.data.password.length < 8){
           this.error.push("Password must greater than 8 character")
       }
    
       if(this.data.password.length > 50){
        this.error.push("Password cannot be greater than 50 character")
       }
    
       if(this.data.username.length > 0 && this.data.username.length < 3){
        this.error.push("Should provide atleast 3 character for username")
       }
       if(this.data.username.length > 100 ){
        this.error.push("username cannot be greater than  100 characters")
       }
    
           // To Check whether the username already exists in the database or not
        if(this.data.username.length > 2 && this.data.username.length <50 && validator.isAlphanumeric(this.data.username)){
            let usernameExists = await userCollection.findOne({username : this.data.username}) 
            if(usernameExists){
                this.error.push("Username Already exists")
            } 
        }
    
        // To Check whether the email already exists in the database or not
        if(validator.isEmail(this.data.email)){
            let emailExists = await userCollection.findOne({email : this.data.email}) 
            if(emailExists){
                this.error.push("Email Already exists")
            } 
        }
        resolve()
    })
}

User.prototype.login = function(){
    return new Promise((resolve , reject)=>{
        this.cleanUp()
    userCollection.findOne({username : this.data.username} , (error , attemptedUser) =>{
        if(attemptedUser && bcrypt.compareSync(this.data.password , attemptedUser.password)){
            this.data = attemptedUser
            this.getAvatar()
            resolve("Congrats you have been logged in ")      
        }else{
            reject("Login failed")
        }
    })
    })
}

User.prototype.register = function(){
    return new Promise(async (resolve , reject) =>{
        // Step 1 validate the data .
        // this.cleanUp()
       await this.validate()
    
        // Step 2 If there are no errors in validation then pass the data to the database .
            if(!this.error.length){
                let salt = bcrypt.genSaltSync(10)
                this.data.password = bcrypt.hashSync(this.data.password , salt)
               await userCollection.insertOne(this.data)
               this.getAvatar()
               resolve()
            }else{
                reject(this.error)
            }
    })
}

User.prototype.getAvatar = function(){
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUsername = function(username){
    return new Promise(function(resolve , reject){
        if(typeof(username) != "string"){
            reject()
            return
        }

        userCollection.findOne({username : username}).then(function(userDoc){
           
           if(userDoc){
            resolve(userDoc)
           } else{
               reject()
           }
        }).catch(function(){
            reject()
        })
    })
}

User.doesEmailExists = function(email){
    return new Promise(async (resolve , reject) =>{
        if(typeof(email) != "string"){
            resolve(false)
            return
        }

        let user = await userCollection.findOne({email: email})
        if(user){
            resolve(true)
        }else{
        resolve(false)
        }
    })
}

module.exports = User