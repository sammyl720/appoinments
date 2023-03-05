import { Handler } from "express";
import { AuthService } from "@services/auth.service";

export const getAuthMiddleware = (authService: AuthService): Handler => {
  return async (req, res, next) => {
    try {

      const token = req.get('Authorization')?.split(' ')?.[1] ?? '';

      const payload = await authService.verifyAdmin(token);

      if (!payload) {
        return res.status(401).json({ message: 'Please login' })
      };

      req.user = payload;
      return next()
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Please login' })
    }

  }
}