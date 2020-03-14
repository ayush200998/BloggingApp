import axios from 'axios'

export default class RegistrationForm{
    constructor(){
        this.form = document.querySelector("#registration-form")
        this.allFields = document.querySelectorAll("#registration-form .form-control")
        this.username = document.querySelector("#username-register")
        this.username.previousValue = ""
        this.email = document.querySelector("#email-register")
        this.email.previousValue = ""
        this.password = document.querySelector("#password-register")
        this.password.previousValue = ""
        this.username.isUnique = false
        this.password.isUnique = false
        this.insertValidationElements()
        this.events()
    }


    // Events
        events(){
              this.form.addEventListener("submit" , event =>{
                event.preventDefault()
                this.formSubmitHandler()
              })

              this.username.addEventListener("keyup" , () =>{
                  this.isDifferent(this.username , this.usernameHandler)
              })

              this.email.addEventListener("keyup" , () =>{
                this.isDifferent(this.email , this.emailHandler)
            })

            this.password.addEventListener("keyup" , () =>{
                this.isDifferent(this.password , this.passwordHandler)
            })
        }



    // Methods
        formSubmitHandler(){
            this.usernameImmediately()
            this.usernameAfterDelay()
            this.emailAfterDelay()
            this.passwordImmediately()
            this.passwordAfterDelay()
            
            if(this.username.isUnique && !this.username.error && this.email.isUnique && !this.email.error && !this.password.error){
                this.form.submit()
            }
        }
        
        isDifferent(el , handler){
            if(el.previousValue != el.value){
                handler.call(this)
            }
            el.previousValue = el.value
        }

        usernameHandler(){
            this.username.error = false
            this.usernameImmediately()
            clearTimeout(this.username.timer)
            this.username.timer = setTimeout(() =>this.usernameAfterDelay() , 1000)
        }

        passwordHandler(){
            this.password.error = false
            this.passwordImmediately()
            clearTimeout(this.password.timer)
            this.password.timer = setTimeout(() =>this.passwordAfterDelay() , 1000)
        }

        passwordImmediately(){
            if(this.password.value.length > 30){
                this.showValidationError(this.password , "password cannot exceeds 30 character")
            }
            if(!this.password.error)
                this.hideValidationError(this.password)
        }

        passwordAfterDelay(){
            if(this.password.value.length < 8){
                this.showValidationError(this.password , "password should contain atleast 8  character")
            }
        }

        emailHandler(){
            this.email.error = false
            
            clearTimeout(this.email.timer)
            this.email.timer = setTimeout(() =>this.emailAfterDelay() , 3000)
        }

        emailAfterDelay(){
          if(!/^\S+@\S+$/.test(this.email.value)){
              this.showValidationError(this.email , "Invalid email entered please check again")
              this.email.error = true
            }
            
          if(!this.email.error){
                this.hideValidationError(this.email)

              axios.post('/doesEmailExists' , {email: this.email.value}).then((response) =>{
                if(response.data){
                    this.showValidationError(this.email , "Email already exists, please enter a different email")
                    this.email.isUnique = false
                }else{
                    this.email.isUnique = true
                }
              }).catch(() =>{
                console.log("please try again later.")
              })
          }
        }

        usernameImmediately(){
            // console.log("immediate method just ran .")

            //for immediate verification. 
            if(this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value))
            {
                this.showValidationError(this.username , "username only contains alphanumeric characters.")
            }

            if(this.username.value.length >30){
                this.showValidationError(this.username , "username cannot exceeds 30 characters")
            }

            // to hide the popup box
            if(!this.username.error){
                this.hideValidationError(this.username)
            }
        }

        hideValidationError(el){
            el.nextElementSibling.classList.remove("liveValidateMessage--visible")
        }

        showValidationError(el , message){
            el.nextElementSibling.innerHTML = message
            el.nextElementSibling.classList.add("liveValidateMessage--visible")
            el.error = true
        }

        usernameAfterDelay(){
            if(this.username.value.length < 3){
                this.showValidationError(this.username , "username should contain atleast 3 characters.")
            }

            if(!this.username.error){
                axios.post('/doesUsernameExists' , {username:this.username.value}).then((response) =>{
                    if(response.data){
                        this.showValidationError(this.username , "The username is already taken")
                        this.username.isUnique = false
                    }else{
                        this.username.isUnique = true
                    }

                }).catch(() =>{
                    console.log("please try later.")
                })
            }
        }

    insertValidationElements(){
        this.allFields.forEach(function(element){
            element.insertAdjacentHTML('afterend' , `<div class="alert alert-danger small liveValidateMessage"> </div>`)
        })
    }
}