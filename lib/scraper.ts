// Telegram scraper adapted to TypeScript
import * as cheerio from 'cheerio';
import { fetch } from 'undici';

interface Channel {
  url: string;
  username: string;
  scrapeUrl: string;
}

interface Post {
  messageId: string;
  date: Date;
  text: string;
  views?: number;
  forwards?: number;
  replies?: number;
  permalink: string;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  return response.text();
}

function parseTelegramDate(val: string | undefined): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
}

function cleanText($msg: cheerio.Cheerio<any>): string {
  $msg.find('br').replaceWith('\n');
  const txt = $msg.text();
  const cleaned = txt
    .replace(/\u00A0/g, ' ')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned;
}

function parseCount(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  
  const m = s.match(/^([0-9]+(?:\.[0-9]+)?)([KM])?$/i);
  if (!m) {
    const n = Number(s.replace(/,/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  
  const base = Number(m[1]);
  const suf = (m[2] || '').toUpperCase();
  if (!Number.isFinite(base)) return undefined;
  if (suf === 'K') return Math.round(base * 1_000);
  if (suf === 'M') return Math.round(base * 1_000_000);
  return Math.round(base);
}

function extractChannelTitle($: cheerio.CheerioAPI): string | null {
  const title = $('.tgme_channel_info_header_title').first().text().trim();
  return title || null;
}

function extractPostsFromHtml({
  html,
  username,
  cutoffDate,
}: {
  html: string;
  username: string;
  cutoffDate: Date;
}) {
  const $ = cheerio.load(html);
  const channelTitle = extractChannelTitle($);

  const posts: Post[] = [];
  $('.tgme_widget_message_wrap').each((_, wrap) => {
    const $wrap = $(wrap);
    const $msg = $wrap.find('.tgme_widget_message').first();
    if (!$msg.length) return;

    const msgId = $msg.attr('data-post');
    let messageId: string | null = null;
    if (msgId && msgId.includes('/')) {
      messageId = msgId.split('/')[1];
    }

    const $time = $wrap.find('time[datetime]').first();
    const dt = parseTelegramDate($time.attr('datetime'));
    if (!dt) return;

    if (dt < cutoffDate) return;

    const $text = $wrap.find('.tgme_widget_message_text').first();
    const text = $text.length ? cleanText($text) : '';
    if (!text) return;

    const permalink = `https://t.me/${username}/${messageId || ''}`.replace(/\/$/, '');

    const views = parseCount(
      $wrap.find('.tgme_widget_message_views').first().text()
    );
    const forwards = parseCount(
      $wrap.find('.tgme_widget_message_forwarded_from').first().text()
    );
    const replies = parseCount(
      $wrap.find('.tgme_widget_message_replies').first().text()
    );

    posts.push({
      messageId: messageId!,
      date: dt,
      text,
      views,
      forwards,
      replies,
      permalink,
    });
  });

  posts.sort((a, b) => b.date.getTime() - a.date.getTime());

  const oldestOnPage = posts.length ? posts[posts.length - 1].date : null;

  return { channelTitle, posts, oldestOnPage };
}

export async function scrapeChannelRecentPosts({
  channel,
  daysBack = 2,
  maxPages = 20,
  requestDelayMs = 800,
  onProgress,
}: {
  channel: Channel;
  daysBack?: number;
  maxPages?: number;
  requestDelayMs?: number;
  onProgress?: (current: number, total: number) => void;
}) {
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const allPosts: Post[] = [];
  let channelTitle: string | null = null;
  let before: string | null = null;

  for (let page = 1; page <= maxPages; page++) {
    if (onProgress) {
      onProgress(page, maxPages);
    }

    const url = before
      ? `${channel.scrapeUrl}?before=${encodeURIComponent(before)}`
      : channel.scrapeUrl;

    const html = await fetchText(url);
    const parsed = extractPostsFromHtml({
      html,
      username: channel.username,
      cutoffDate,
    });
    if (!channelTitle) channelTitle = parsed.channelTitle || channel.username;

    const existing = new Set(allPosts.map((p) => p.messageId));
    for (const p of parsed.posts) {
      if (!p.messageId) continue;
      if (existing.has(p.messageId)) continue;
      allPosts.push(p);
    }

    const $ = cheerio.load(html);
    const moreHref = $('a.tgme_widget_message_more').attr('href');
    let nextBefore: string | null = null;
    if (moreHref) {
      const m = moreHref.match(/before=([0-9]+)/);
      if (m) nextBefore = m[1];
    }

    const oldest = parsed.oldestOnPage;
    const anyWithin = parsed.posts.length > 0;
    if (!nextBefore) break;
    if (!anyWithin) break;
    if (oldest && oldest < cutoffDate) break;

    before = nextBefore;
    await new Promise(resolve => setTimeout(resolve, requestDelayMs));
  }

  allPosts.sort((a, b) => b.date.getTime() - a.date.getTime());
  return {
    channel,
    channelTitle: channelTitle || channel.username,
    cutoffDate,
    posts: allPosts,
  };
}

export function prepareChannel(url: string, username: string): Channel {
  return {
    url,
    username,
    scrapeUrl: `https://t.me/s/${username}`,
  };
}
