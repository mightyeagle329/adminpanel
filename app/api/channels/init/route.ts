// API route to initialize channels from tel_channel_links.txt
import { NextResponse } from 'next/server';
import { loadChannelsFromFile } from '@/lib/channelLoader';
import { addChannel, getChannels } from '@/lib/db';

export async function POST() {
  try {
    const fileChannels = await loadChannelsFromFile();
    const existingChannels = await getChannels();
    const existingUrls = new Set(existingChannels.map(ch => ch.url));
    
    let addedCount = 0;
    
    for (const url of fileChannels) {
      if (!existingUrls.has(url)) {
        try {
          await addChannel(url, true);
          addedCount++;
        } catch (error) {
          console.error(`Failed to add channel ${url}:`, error);
        }
      }
    }
    
    const allChannels = await getChannels();
    
    return NextResponse.json({
      success: true,
      addedCount,
      totalChannels: allChannels.length,
      channels: allChannels,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
