import { NextRequest, NextResponse } from 'next/server';
import { 
  getTwitterAccounts, 
  addTwitterAccount, 
  deleteTwitterAccount,
  toggleTwitterAccountEnabled 
} from '@/lib/db';

export async function GET() {
  try {
    const accounts = await getTwitterAccounts();
    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, accountType = 'other', enabled = true } = body;

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    const account = await addTwitterAccount({
      username: username.replace('@', ''),
      displayName: displayName || username,
      accountType,
      enabled,
    });

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Account ID required' },
        { status: 400 }
      );
    }

    await deleteTwitterAccount(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Account ID required' },
        { status: 400 }
      );
    }

    if (action === 'toggle') {
      await toggleTwitterAccountEnabled(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
