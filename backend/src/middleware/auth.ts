/**
 * Authentication middleware.
 * Verifies the Supabase JWT from the Authorization header
 * and attaches the user to the request object.
 */

import { Request, Response, NextFunction } from 'express';
import { isSupabaseConfigured, supabaseAdmin, supabaseSetupError } from '../config/supabase';

// Extend Express Request to include our user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      };
      accessToken?: string;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!isSupabaseConfigured) {
      res.status(503).json({ data: null, error: supabaseSetupError });
      return;
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ data: null, error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ data: null, error: 'Invalid or expired token' });
      return;
    }

    // Attach user info and token to request
    req.user = { id: user.id, email: user.email };
    req.accessToken = token;

    next();
  } catch (err) {
    res.status(500).json({ data: null, error: 'Authentication error' });
  }
};
