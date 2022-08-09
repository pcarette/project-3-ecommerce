const router = require('express').Router()
const jwt = require('jsonwebtoken')
require('dotenv').config()
const User = require('../models/User.model')

router.use( async (req,res,next)=>{
    try{
        const token = req.headers.authorization.split(' ')[1]
        const data = jwt.verify(token,process.env.TOKEN_SECRET)
        const user = await User.findById(data.userId)
        if(user===null){
            res.status(400).json({message: "wrong Token/user"})
            return 
        }
        req.user = {
            _id:user._id,
            email: user.email,
            accessLevel: user.accessLevel
        }
        next()
        
    }catch(e){
        res.status(403).json({message : 'not authorized'})
    }
})

module.exports = router