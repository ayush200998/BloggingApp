const express = require("express")
const app = express()
const router = require("./router")
const session = require("express-session")
const MongoStore = require("connect-mongo")(session)
const flash = require("connect-flash")
const markedDown = require("marked")
const SanitizeHTML = require("sanitize-html")

app.use(express.urlencoded({extended : false}))
app.use(express.json())
app.use('/api' , require("./router-api"))

let sessionOptions = session({
    secret : "JavaScript is very cool",
    store : new MongoStore({client : require("./db")}),
    resave : false,
    saveUninitialized : false,
    cookie : {maxAge : 1000 * 60 * 60 * 24,
        httpOnly : true
    }
})
    app.use(sessionOptions)
    app.use(express.static("public"))
   
    app.use(flash())
    app.use(function(req , res , next){
        // To display markeddown from the ejs template itself .
        res.locals.filterUserHTML = function(content){
            return SanitizeHTML(markedDown(content) , {allowedTags: ['p' , 'br' , 'ul' , 'ol' , 'li' , 'strong' , 'bold' , 'i' , 'em' , 'h1' , 'h2' , 'h3' , 'h4' , 'h5' , 'h6'] , allowedAttributes:{}})
        }

        // To display the flash messages.
        res.locals.errors = req.flash("errors")
        res.locals.success = req.flash("success")

        // To know the current visitor.
        if(req.session.user){
            req.visitorId = req.session.user._id
        }else{
            req.visitedId = 0
        }

        res.locals.user = req.session.user 
        next()
    })
    

    
    app.set('views' , 'views')
    app.set('view engine' , 'ejs')

    app.use("/" , router)

    
    const myserver = require('http').createServer(app)
    const io = require('socket.io')(myserver)

    io.use(function(socket , next){
        sessionOptions(socket.request , socket.request.res , next)
    })

    io.on('connection' , function(socket){
        // socket is the connection between the browser and the server.

        // this method is used to recieve data from browser
        if(socket.request.session.user){
            let user = socket.request.session.user

            socket.emit('welcome' , {username: user.username , avatar: user.avatar})
            socket.on('chatMessageFromBrowser' , function(data){
                // console.log(data.message)
    
                // io.emit() - this method is used to send the data to all the browsers in which users are logged in .
                // socket.broadcast.emit() - is used to send data to all the browser except to the user who is sending the data. 
                socket.broadcast.emit('chatMessageFromServer' , {message: SanitizeHTML(data.message , {allowedTags:[] , allowedAttributes: {}}) , username: user.username , avatar: user.avatar})
            })
        }
    })
   module.exports = myserver