const postController = require("../db").db().collection("posts")
const followController = require("../db").db().collection("follows")
const ObjectID = require("mongodb").ObjectID
const User = require("./User")
const SanitzeHTML = require("sanitize-html")

let Post = function(data , userId , requestedPostId){
    this.data = data
    this.error = []
    this.userId = userId
    this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function(){
    if(typeof(this.data.title) != "string"){
        this.data.title = ""
    }

    if(typeof(this.data.body) != "string"){
        this.data.body = ""
    }

    this.data = {
        title : SanitzeHTML(this.data.title.trim() , {allowedTags: [] , allowedAttributes:{}}),
        body : SanitzeHTML(this.data.body.trim() , {allowedTags: [] , allowedAttributes:{}}),
        createdDate : new Date(),
        author : ObjectID(this.userId)
    }
}

Post.prototype.validate = function(){
    if(this.data.title == ""){
        this.error.push("You must provide a Title")
    }

    if(this.data.body == ""){
        this.error.push("You must provide some details for the title")
    }
}


Post.prototype.create = function(){
    return new Promise ((resolve , reject) =>{
        this.cleanUp()
        this.validate()

        if(!this.error.length){
            postController.insertOne(this.data).then((info)=>{
                resolve(info.ops[0]._id)
            }).catch(() =>{
                this.error.push("Please try again later")
                reject(this.error)
            })  
        }else{
            reject(this.error)
        }
    })
}

Post.prototype.update = function(){
    return new Promise(async (resolve , reject) =>{
        try{
            let post = await Post.findSingleById(this.requestedPostId , this.userId)
            if(post.isVisitorOwner){
                // update the database
                let status = await this.actuallyUpdate()
                resolve(status)
            }else{
                reject()
            }
        }catch{
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function(){
    return new Promise(async (resolve , reject) =>{
        this.cleanUp()
        this.validate()
        if(!this.error.length){
          await postController.findOneAndUpdate({_id : new ObjectID(this.requestedPostId)} , {$set: {title: this.data.title , body: this.data.body}})
          resolve("success")
        }else{
            resolve("failure")
        }
    })
}

Post.reusablePostQuery = function(uniqueOperations , visitorId){

    let aggOperation = uniqueOperations.concat([
            
        {$lookup: {from: "users" , localField: "author" , foreignField: "_id" , as: "authorDocument"}},
        {$project: {
            title : 1,
            body: 1,
            createdDate: 1,
            authorId: "$author",
            author: {$arrayElemAt : ["$authorDocument" , 0]}
        }}
    ])
    return new Promise ( async function(resolve , reject){
        
        let post = await postController.aggregate(aggOperation).toArray()

        post = post.map(function(p){
            p.isVisitorOwner = p.authorId.equals(visitorId)
            p.authorId = undefined
            p.author = {
                username : p.author.username ,
                avatar: new User(p.author , true).avatar
            }
            return p
        })

       resolve(post)
    })
}

Post.findSingleById = function(id , visitorId){
    return new Promise ( async function(resolve , reject){
        if(typeof(id) != "string" || !ObjectID.isValid(id)){
            reject()
            return
        }
       
        let post = await Post.reusablePostQuery([
            {$match: {_id : new ObjectID(id)}}
        ] , visitorId) 

        if(post.length){
            console.log(post[0])
            resolve(post[0])
        }else{
            reject()
        }
    })
}

Post.findByAuthorId = function(authorId){
    return Post.reusablePostQuery([
        {$match: {author : authorId}} , 
        {$sort : {createdDate : -1}}
    ])
}

Post.delete = function(postIdToDelete , currentUserId){
    return new Promise(async (resolve , reject) =>{
        try{
            let post = await Post.findSingleById(postIdToDelete , currentUserId)
            if(post.isVisitorOwner){
                console.log("before database interraction")
              await postController.deleteOne({_id: new ObjectID(postIdToDelete)})
              resolve()
                
            }else{
                reject("from try blog")
            }
        }catch{
            reject("from catch blog")
        }
    })
}

Post.search = function(searchedTerm){
    return new Promise(async (resolve , reject) =>{
        if(typeof(searchedTerm == "string")){
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: searchedTerm}}},
                {$sort: {score: {$meta: "textScore"}}}
                
            ])
            // console.log("if Working")
            resolve(posts)
            // console.log("if working ..")
        }else{
            reject()
        }
    })
}

Post.countPostsByAuthor = function(id){
    return new Promise (async (resolve , reject) =>{
        let postCount = await postController.countDocuments({author: id})
        resolve(postCount)
    })
}

Post.getFeed = async function(id){
    
    // get the array of users whom the current user is following
        let followedUsers = await followController.find({authorId: new ObjectID(id)}).toArray()
        followedUsers = followedUsers.map(function(followDoc){
            return followDoc.followedId
        })

    // get the posts from the followed users .
    return Post.reusablePostQuery([
        {$match: {author: {$in: followedUsers}}},
        {$sort: {createdDate: -1}}
    ]) 
}

module.exports = Post