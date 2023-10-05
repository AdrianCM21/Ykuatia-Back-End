import {Request,Response,NextFunction} from 'express';

export default  (req:Request,res:Response,next:NextFunction)=>{
    if(req.headers['x-api-key']===process.env.API_KEY){
        return next();
    }
    res.status(401)
    return res.json({message:'Unauthorized'})
}