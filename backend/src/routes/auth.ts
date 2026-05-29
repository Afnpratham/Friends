import { Router } from 'express';
import { isSupabaseConfigured, supabaseAdmin, supabaseSetupError } from '../config/supabase';

const router = Router();

/**
 * POST /api/auth/signup
 * Registers a new user with email and password.
 * Supabase automatically creates the auth user; we create the profile.
 */
router.post('/signup', async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.status(503).json({ data: null, error: supabaseSetupError });
    }

    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ data: null, error: 'Email and password are required' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now (production: set up email templates)
      user_metadata: { full_name },
    });

    if (error) return res.status(400).json({ data: null, error: error.message });

    // Create profile (also handled by DB trigger, but explicit here for reliability)
    if (data.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        full_name: full_name || null,
        plan: 'free',
        credits_used: 0,
      });
    }

    return res.status(201).json({
      data: { user: { id: data.user?.id, email: data.user?.email } },
      error: null,
      message: 'Account created successfully',
    });
  } catch (err: any) {
    return res.status(500).json({ data: null, error: err.message });
  }
});

/**
 * POST /api/auth/me
 * Returns the current user's profile data.
 */
router.get('/me', async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.status(503).json({ data: null, error: supabaseSetupError });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ data: null, error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ data: null, error: 'Invalid token' });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return res.json({ data: { user: { id: user.id, email: user.email }, profile }, error: null });
  } catch (err: any) {
    return res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
