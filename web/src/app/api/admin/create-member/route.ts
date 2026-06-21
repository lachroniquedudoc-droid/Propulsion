import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, whatsapp, role, status, city } = await req.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY manquant dans les variables d'environnement)." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Create the user in Auth
    // We generate a random password, they will reset it via email.
    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      }
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insert into members table
    const { error: dbError } = await supabaseAdmin
      .from('members')
      .update({
        first_name: firstName,
        last_name: lastName,
        whatsapp: whatsapp || null,
        role: role || 'Standard',
        status: status || 'Actif',
        city: city || null,
      })
      .eq('id', userId);
      
    // Note: The members row is usually auto-created by a trigger on auth.users insert.
    // So we just update the newly created row.

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    // 3. Send password reset email so they can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    // Alternatively, we could just send the tempPassword via email if we had an email service.
    // Or we let the admin copy it. We'll return it so the admin can copy it.

    return NextResponse.json({ 
      success: true, 
      user: { id: userId, email }, 
      tempPassword 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
