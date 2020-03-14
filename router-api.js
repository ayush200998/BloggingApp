const apiRouter = require("express").Router()
const userController = require("./controller/usercontroller")
const postController = require("./controller/postcontroller")
const followController = require("./controller/followcontroller")

apiRouter.post('/login' , userController.apiLogin)
apiRouter.post('/create-post' , userController.apiMustBeLoggedIn , postController.apiCreatePost)
module.exports = apiRouter