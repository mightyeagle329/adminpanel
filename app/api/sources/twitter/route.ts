// API route for Twitter accounts – uses FastAPI backend when available
import { NextRequest, NextResponse } from 'next/server';
import {
  getTwitterAccounts,
  addTwitterAccount,
  deleteTwitterAccount,
  toggleTwitterAccountEnabled,
} from '@/lib/db';
import { fastApiClient } from '@/lib/fastApiClient';

const USE_FASTAPI = !!process.env.NEXT_PUBLIC_FASTAPI_URL;

function toAccountFrontend(a: Record<string, unknown>) {
  return {
    id: a.id,
    username: a.username,
    displayName: (a as Record<string, string>).display_name ?? a.displayName,
    accountType: (a as Record<string, string>).account_type ?? a.accountType ?? 'person',
    addedAt: (a as Record<string, string>).added_at ?? a.addedAt,
    enabled: a.enabled !== false,
  };
}

export async function GET() {
  try {
    if (USE_FASTAPI) {
      try {
        const list = await fastApiClient.getTwitterAccounts();
        const accounts = (list || []).map(toAccountFrontend);
        return NextResponse.json({ success: true, accounts });
      } catch (e) {
        console.error('FastAPI twitter GET failed:', e);
      }
    }
    const accounts = await getTwitterAccounts();
    return NextResponse.json({ success: true, accounts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, accountType = 'person', enabled = true, userId } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    if (USE_FASTAPI) {
      try {
        const acc = await fastApiClient.addTwitterAccount({
          username: username.replace('@', ''),
          displayName: displayName || username,
          accountType,
          userId: userId || undefined,
        });
        const account = toAccountFrontend(acc as Record<string, unknown>);
        return NextResponse.json({ success: true, account });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }
    }

    const account = await addTwitterAccount({
      username: username.replace('@', ''),
      displayName: displayName || username,
      accountType,
      enabled,
    });
    return NextResponse.json({ success: true, account });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Account ID required' }, { status: 400 });
    }

    if (USE_FASTAPI) {
      try {
        await fastApiClient.deleteTwitterAccount(id);
        return NextResponse.json({ success: true });
      } catch (e) {
        return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
      }
    }

    await deleteTwitterAccount(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Account ID required' }, { status: 400 });
    }

    if (action === 'toggle') {
      if (USE_FASTAPI) {
        try {
          const acc = await fastApiClient.toggleTwitterAccount(id);
          return NextResponse.json({ success: true, account: toAccountFrontend(acc as Record<string, unknown>) });
        } catch (e) {
          return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
        }
      }
      await toggleTwitterAccountEnabled(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
