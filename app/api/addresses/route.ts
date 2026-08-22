import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: addresses, error: addrErr } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (addrErr) {
      return NextResponse.json(
        { success: false, error: addrErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      addresses: addresses || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipient_name, phone, street, city, state, postal_code, is_default } = body;

    if (!recipient_name || !phone || !street || !city || !state || !postal_code) {
      return NextResponse.json(
        { success: false, error: 'All address fields are required.' },
        { status: 400 }
      );
    }

    // If setting this as default, unset previous default
    if (is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data: newAddr, error: insertErr } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        recipient_name: recipient_name.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postal_code.trim(),
        is_default: Boolean(is_default),
      })
      .select('*')
      .single();

    if (insertErr) {
      return NextResponse.json(
        { success: false, error: insertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      address: newAddr,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Address ID required.' },
        { status: 400 }
      );
    }

    const { error: delErr } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (delErr) {
      return NextResponse.json(
        { success: false, error: delErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
