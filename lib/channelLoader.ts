// Utility to load channels from tel_channel_links.txt
import fs from 'fs/promises';
import path from 'path';

export async function loadChannelsFromFile(): Promise<string[]> {
  const filePath = path.join(process.cwd(), '..', 'tel_channel_links.txt');
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const channels = content
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    return channels;
  } catch (error) {
    console.error('Error loading channels from file:', error);
    return [];
  }
}

export async function saveChannelToFile(url: string): Promise<void> {
  const filePath = path.join(process.cwd(), '..', 'tel_channel_links.txt');
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const channels = content
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    if (!channels.includes(url)) {
      channels.push(url);
      await fs.writeFile(filePath, channels.join(', '));
    }
  } catch (error) {
    console.error('Error saving channel to file:', error);
  }
}
