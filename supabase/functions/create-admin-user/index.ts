import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing service role key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user: callerUser }, error: callerError } = await supabaseClient.auth.getUser(token);

    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid session or token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify caller has admin privileges in profiles table
    const { data: callerProfile } = await supabaseClient
      .from('profiles')
      .select('role, is_active')
      .eq('id', callerUser.id)
      .single();

    if (!callerProfile || !callerProfile.is_active || !['super_admin', 'project_admin'].includes(callerProfile.role)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: only active administrators can create new admin accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse payload
    const { email, password, full_name, role = 'super_admin' } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const displayName = full_name ? full_name.trim() : trimmedEmail.split('@')[0];

    // Create user via Supabase Auth Admin API (automatically confirms email)
    const { data: newUserData, error: createError } = await supabaseClient.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: displayName,
        role: 'super_admin',
      },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = newUserData.user.id;

    // Ensure profile is marked as super_admin
    await supabaseClient
      .from('profiles')
      .upsert({
        id: newUserId,
        email: trimmedEmail,
        full_name: displayName,
        role: 'super_admin',
        is_active: true,
        updated_at: new Date().toISOString(),
      });

    // Write audit log
    await supabaseClient.from('audit_logs').insert({
      actor_id: callerUser.id,
      entity_type: 'user',
      entity_id: newUserId,
      action: 'create_admin',
      previous_data: null,
      new_data: { email: trimmedEmail, full_name: displayName, role: 'super_admin' },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Admin user ${trimmedEmail} created successfully`,
        user: {
          id: newUserId,
          email: trimmedEmail,
          full_name: displayName,
          role: 'super_admin',
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Error creating admin user:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
