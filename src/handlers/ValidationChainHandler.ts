import {Request,Response,NextFunction} from 'express';
import {ValidationChain, validationResult } from 'express-validator';

const handleValidationResults = (request:Request,response:Response, next: NextFunction)=>{
    const errors = validationResult(request);
    if(!errors.isEmpty())
    {
        response.status(422)
        return response.send(errors);
    }
    return next()
}

const Request = (validations:ValidationChain[])=>{
    return [
        ...validations,
        handleValidationResults
    ]
}

export default Request