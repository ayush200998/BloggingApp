const userCollection = require("../db").db().collection("users")
const followCollection = require("../db").db().collection("follows")
const ObjectID = require("mongodb").ObjectID
const User = require("./User")

let Follow = function(followedUsername , authorId){
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []
}

Follow.prototype.cleanUp = async function(){
    if(typeof(this.followedUsername) != "string"){
        this.followedUsername = ""
    }
}

Follow.prototype.validate = async function(action){
    // check if username exists in the database.

    let followedAccount = await userCollection.findOne({username: this.followedUsername})
    console.log(followedAccount)
    if(followedAccount){
        this.followedId = followedAccount._id
    }else{
        this.errors.push("you cannot follow a user that does not exists")
    }
     
    let doesFollowAlreadyExists = await followCollection.findOne({followedId: this.followedId , authorId: new ObjectID(this.authorId)})
    if(action == "create"){
        console.log(doesFollowAlreadyExists)
        if(doesFollowAlreadyExists){
            this.errors.push("You are already following this user")
        }
    }

    if(action == "delete"){
        if(!doesFollowAlreadyExists){
            this.errors.push("You cannot unfollow a user whom you're not following")
        }
    }

    if(this.followedId.equals(this.authorId)){
        this.errors.push("you cannot follow your own id")
    }
}

Follow.prototype.create = function(){
    return new Promise(async (resolve , reject) =>{
        this.cleanUp()
        await this.validate("create")
        if(!this.errors.length){
           await  followCollection.insertOne({followedId: this.followedId , authorId: new ObjectID(this.authorId)})
           resolve()
        }else{
            reject(this.errors)
        }
    })
}

Follow.prototype.delete = function(){
    return new Promise(async (resolve , reject) =>{
        this.cleanUp()
        await this.validate("delete")
        if(!this.errors.length){
           await  followCollection.deleteOne({followedId: this.followedId , authorId: new ObjectID(this.authorId)})
           resolve()
        }else{
            reject(this.errors)
        }
    })
}

Follow.isVisitorFollowing = async function(follwedId , visitoId){
    let followDoc = await followCollection.findOne({followedId: follwedId , authorId: new ObjectID(visitoId)})

    if(followDoc){
        return true
    }else{
        return false
    }
}

Follow.getFollowersById = function(id){
    return new Promise( async(resolve , reject) =>{
            // try{
                let followers = await followCollection.aggregate([
                    {$match: {followedId: id}},
                    {$lookup: {from: "users" , localField:"authorId" , foreignField: "_id" , as:"userDoc"}},
                    {$project: {
                        username: {$arrayElemAt: ["$userDoc.username" , 0]},
                        email: {$arrayElemAt: ["$userDoc.email" , 0]}
                    }}
                ]).toArray()
                // console.log(userDoc)
                // console.log(followers)
               followers = followers.map(function(follower){
                    // create a user.
                    let user = new User(follower , true)
                    return{username: follower.username , avatar: user.avatar}
                
                })
                resolve(followers)
            // }catch{
                // console.log("Follow try is not working")
                // reject()
            // }
            
        })
    
}

Follow.getFollowingById = function(id){
    return new Promise( async(resolve , reject) =>{
            // try{
                let followers = await followCollection.aggregate([
                    {$match: {authorId: id}},
                    {$lookup: {from: "users" , localField:"followedId" , foreignField: "_id" , as:"userDoc"}},
                    {$project: {
                        username: {$arrayElemAt: ["$userDoc.username" , 0]},
                        email: {$arrayElemAt: ["$userDoc.email" , 0]}
                    }}
                ]).toArray()
                // console.log(userDoc)
                // console.log(followers)
               followers = followers.map(function(follower){
                    // create a user.
                    let user = new User(follower , true)
                    return{username: follower.username , avatar: user.avatar}
                
                })
                resolve(followers)
            // }catch{
                // console.log("Follow try is not working")
                // reject()
            // }
            
        })
    
}


Follow.countFollowerById = function(id){
    return new Promise (async (resolve , reject) =>{
        let followerCount = await followCollection.countDocuments({followedId: id})
        resolve(followerCount)
    })
}

Follow.countFollowingById = function(id){
    return new Promise (async (resolve , reject) =>{
        let followingCount = await followCollection.countDocuments({authorId: id})
        resolve(followingCount)
    })
}
module.exports = Follow