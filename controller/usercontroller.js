const User = require("../models/User")
const Post = require("../models/Post")
const Follow = require("../models/Follow")
const jwt = require('jsonwebtoken')

exports.doesUsernameExists = function(req , res){
    User.findByUsername(req.body.username).then(() =>{
        res.json(true)
    }).catch(() =>{
        res.json(false)
    })
}

exports.doesEmailExists = async function(req , res){
    let isEmail = User.doesEmailExists(req.body.email)
    res.json(isEmail)
}

exports.sharedProfileData = async function(req , res , next){
    let isvisitorProfile = false
    let isFollowing = false
    if(req.session.user){
        isvisitorProfile = req.profileUser._id.equals(req.session.user._id)
       isFollowing = await Follow.isVisitorFollowing(req.profileUser._id , req.visitorId)
       
    }

    req.isvisitorProfile = isvisitorProfile
    req.isFollowing = isFollowing

    // retrieve the count of posts , followers and following.
    let postCountPromise =  Post.countPostsByAuthor(req.profileUser._id)
    let followerCountPromise =  Follow.countFollowerById(req.profileUser._id)
    let followingCountPromise =  Follow.countFollowingById(req.profileUser._id)

    let [postCount , followerCount , followingCount] = await Promise.all([postCountPromise , followerCountPromise , followingCountPromise])
    req.postCount = postCount
    req.followerCount = followerCount
    req.followingCount = followingCount
    next()
}

exports.mustBeLoggedIn = function(req , res , next){
    if(req.session.user){
        next()
    }else{
        req.flash("errors" , "You must be logged in")
        req.session.save(function(){
            res.redirect("/")
        })
    }
}

exports.apiMustBeLoggedIn = function(req , res , next){
    try{
        req.apiUser = jwt.verify(req.body.token , process.env.JWTSECRET)
        next()
    }catch{
        res.json("sorry you must provide a valid Json token")
    }
}

exports.register = function(req , res){
    let user = new User(req.body)
    user.register().then(() =>{
        req.session.user = {username : user.data.username , avatar : user.avatar , _id : user.data._id}
        req.session.save(function(){
            res.redirect("/")
        })

    }).catch((catchedError) =>{
       Array.from(catchedError).forEach(function(e){
            req.flash("registrationError" , e)
        })
        req.session.save(function(){
            res.redirect("/")
        })
    })
  }

exports.login = function(req , res){
    let user = new User(req.body)
    user.login().then(function(result){
        req.session.user = {
            avatar : user.avatar,
            username : user.data.username,
            _id : user.data._id
        }
        req.session.save(function(){
            res.redirect("/")
        })
    }).catch(function(err){
        req.flash("errors" , err)
        req.session.save(function(){
            res.redirect("/")
        })
    })
}

exports.apiLogin = function(req , res){
    let user = new User(req.body)
    user.login().then(function(result){
        res.json(jwt.sign({_id: user.data._id} , process.env.JWTSECRET , {expiresIn: '7d'}))
    }).catch(function(err){
        res.json("login failed.")
    })
}

exports.logout = function(req , res){
    req.session.destroy(function(){
        res.redirect("/")
    })
    
}

exports.home = async function(req , res){
    if(req.session.user){
        // get the posts for the user.
        let posts = await Post.getFeed(req.session.user._id)
        res.render("home-dashboard" , {username : req.session.user.username , avatar : req.session.user.avatar , posts: posts})
    }else{
        res.render("home" , { regError : req.flash("registrationError")})
    }
}

exports.ifUserExists = function(req , res , next){
 User.findByUsername(req.params.username).then(function(userDocument){
     req.profileUser = userDocument
     next()
 }).catch(function(){
     res.render("404" , {avatar : req.session.user.avatar})
 })
}

exports.profilePostsScreen = function(req , res){
    // Collecction an array of Post from the Post.
        Post.findByAuthorId(req.profileUser._id).then(function(posts){
            res.render("profile" , {
                currentPage: "posts",
                posts : posts,
                avatar : req.session.user.avatar,
                profileuser: req.profileUser.username,
                isFollowing: req.isFollowing,
                isvisitorProfile: req.isvisitorProfile,
                counts: {postCount: req.postCount , followerCount: req.followerCount , followingCount:req.followingCount}
            })
        }).catch(function(){
            res.render("404" , {avatar : req.session.user.avatar})
        })

   
}

exports.profileFollowersScreen = async function(req , res){
    try{
        console.log("inside usercontroller try")
        console.log("another check statement")
        let followers = await Follow.getFollowersById(req.profileUser._id)
        // console.log("before rendering ")
        res.render("profile-followers" , {
            currentPage: "followers",
            avatar : req.session.user.avatar,
            profileuser: req.profileUser.username,
            isFollowing: req.isFollowing,
            isvisitorProfile: req.isvisitorProfile ,
            followers: followers,
            counts: {postCount: req.postCount , followerCount: req.followerCount , followingCount:req.followingCount}
        })
        // console.log("end of usercontroller try")
    }catch{
        res.render("404" , {avatar : req.session.user.avatar})
    }
}

exports.profileFollowingScreen = async function(req , res){
    try{
        console.log("inside usercontroller try")
        console.log("another check statement")
        let following = await Follow.getFollowingById(req.profileUser._id)
        // console.log("before rendering ")
        res.render("profile-following" , {
            currentPage: "following",
            avatar : req.session.user.avatar,
            profileuser: req.profileUser.username,
            isFollowing: req.isFollowing,
            isvisitorProfile: req.isvisitorProfile ,
            following: following,
            counts: {postCount: req.postCount , followerCount: req.followerCount , followingCount: req.followingCount}
        })
        // console.log("end of usercontroller try")
    }catch{
        res.render("404" , {avatar : req.session.user.avatar})
    }
}
