import { Request, Response } from 'express';
import { loginService } from '../../services/auth/login';


const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
  
    try {
      const token = await loginService(email, password);
  
      if (!token) {
        res.status(401).json({ msg: 'Correo o Contraseña inválidos' });
        return;
      }
      res.status(200).json({token});
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Error en el servidor' });
    }
  };


export { login}

