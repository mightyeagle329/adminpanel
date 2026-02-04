import { NextResponse } from 'next/server';
import { initializeDefaultSources } from '@/lib/orchestrator';
import { loadChannelsFromFile } from '@/lib/channelLoader';
import { addChannel } from '@/lib/db';

/**
 * Initialize all default sources
 * - Load Telegram channels from file
 * - Add default Polymarket topics
 * - Add default Twitter accounts
 * - Add default RSS feeds
 */
export async function POST() {
  try {
    // Load Telegram channels from file (existing logic)
    const fileChannels = await loadChannelsFromFile();
    for (const url of fileChannels) {
      try {
        await addChannel(url, true); // Skip duplicate check
      } catch (error) {
        console.error(`Failed to add channel ${url}:`, error);
      }
    }

    // Initialize other default sources
    await initializeDefaultSources();

    return NextResponse.json({
      success: true,
      message: 'Default sources initialized successfully',
    });
  } catch (error: any) {
    console.error('Error initializing sources:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
