import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// PATCH: Update user trade (close manually or trigger updates)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore Server Component sets
            }
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const { data, error } = await supabase
      .from('user_trades')
      .update({
        ...body,
        closed_at: body.status === 'closed' ? new Date().toISOString() : undefined
      })
      .eq('id', id)
      .eq('user_id', session.user.id) // Ensure security
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, trade: data });
  } catch (error: any) {
    console.error('Error in PATCH /api/user-trades/[id]:', error);
    return NextResponse.json(
      { error: 'حدث خطأ، حاول مرة أخرى' },
      { status: 500 }
    );
  }
}
