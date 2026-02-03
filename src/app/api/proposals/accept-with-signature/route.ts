import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, signerName, signatureData } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }
    if (!signerName || typeof signerName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Signer name is required' },
        { status: 400 }
      );
    }
    if (!signatureData || typeof signatureData !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Signature is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('accept_proposal_with_signature', {
      token_input: token,
      signer_name_input: signerName.trim(),
      signature_data_input: signatureData,
    });

    if (error) {
      console.error('accept_proposal_with_signature error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to record signature' },
        { status: 500 }
      );
    }

    const result = data as { success: boolean; error?: string } | null;
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Unexpected response' },
        { status: 500 }
      );
    }
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to record signature' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('accept-with-signature error:', err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
