const Post = require("../models/Post")

exports.viewCreateScreen = function(req , res){
    res.render("create-post" , {username : req.session.user.username , avatar : req.session.user.avatar})
}

exports.create = function(req , res){
    let post = new Post(req.body , req.session.user._id)
    post.create().then(function(newId){
        req.flash("success" , "Successfully created")
        req.session.save(() => res.redirect(`/post/${newId}`))
    }).catch(function(error){
        console.log(error)
        error.forEach(function(e){
            req.flash("errors" , e)
        })
        req.session.save(() => res.redirect("create-post"))
    })
}

exports.apiCreatePost = function(req , res){
    let post = new Post(req.body , req.apiUser._id)
    post.create().then(function(newId){
        res.json("Congrats succesfully created")
        
    }).catch(function(error){
        req.json(error)
    })
}

exports.viewSingle = async function(req  ,res){
    try{
        let post = await Post.findSingleById(req.params.id , req.visitorId)
    res.render("post" , {avatar : req.session.user.avatar , post : post})
    }catch{
        res.render("404.ejs" , {avatar : req.session.user.avatar})
    }
    
}

exports.viewEditScreen = async function(req , res){
    try{
        let post = await Post.findSingleById(req.params.id)
        if(post.authorId == req.visitorId){
            res.render("edit-post" ,  {avatar : req.session.user.avatar , post: post})
        }else{
            req.flash("errors" , "You Do not have the permission.")
            req.session.save(function(){
                res.redirect("/")
            })
        }
    }catch{
        res.render("404.ejs" , {avatar : req.session.user.avatar})
    }
}

exports.edit = function(req , res){
    let post = new Post(req.body , req.visitorId , req.params.id)
    post.update().then((status) =>{
        if(status == "success"){
            // The post is updated on the database 
            req.flash("success", "post successfully updated")
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }else{
            // There Might be some validation errors.
            post.errors.forEach(function(error){
                req.flash("errors" , error)
            })
            req.session.save(function(){
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(() =>{
        // If the requested id doesnt exist in the database Or
        // If the user is not the owner of teh post. 
        req.flash("errors" , "You are not allowed to update or delete the post")
        req.session.save(function(){
            res.redirect("/")
        })
    })
}

exports.delete = function(req , res){
    Post.delete(req.params.id , req.visitorId).then(() =>{
            req.flash("success" , "Post successfully deleted")
            req.session.save(function(){
                res.redirect(`/profile/${req.session.user.username}`)
            })
    }).catch((fromWhere) =>{
            console.log(fromWhere)
            req.flash("errors" , "You do not have the permission.")
            req.session.save(function(){
                res.redirect("/")
            })
    })
}

exports.search = function(req , res){
    Post.search(req.body.searchedTerm).then((posts) =>{
        // console.log("postcontroller WOrking")
        console.log(posts)
        res.json(posts)
    }).catch(() =>{
        res.json([])
    })
}