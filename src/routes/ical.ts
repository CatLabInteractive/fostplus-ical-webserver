import { Router, Request, Response } from 'express';
import FostPlusAPI from '@leventhan/fostplus-api-wrapper';
import { ICalCalendar } from 'ical-generator';

const router = Router();

type Language = 'nl' | 'en' | 'fr';

const SUPPORTED_LANGUAGES: Language[] = ['nl', 'en', 'fr'];

/**
 * Emoji mapping based on common Belgian waste fraction names (matched against English name).
 * Keys are lowercase substrings to match against the English fraction name.
 */
const FRACTION_EMOJI_MAP: { keywords: string[]; emoji: string }[] = [
  { keywords: ['vegetable', 'fruit', 'garden', 'gft', 'organic', 'compost', 'bio'], emoji: '🌿' },
  { keywords: ['paper', 'cardboard', 'carton', 'papier'], emoji: '📄' },
  { keywords: ['pmd', 'plastic', 'metal', 'drink carton', 'beverage', 'can', 'tin', 'aluminium'], emoji: '♻️' },
  { keywords: ['glass', 'glas', 'bottle'], emoji: '🫙' },
  { keywords: ['residual', 'rest', 'general', 'household', 'huishoud', 'black bag', 'grey'], emoji: '🗑️' },
  { keywords: ['bulky', 'large', 'grof', 'furniture'], emoji: '🚛' },
  { keywords: ['textile', 'clothing', 'clothes', 'textiel'], emoji: '👕' },
  { keywords: ['chemical', 'hazardous', 'klein gevaarlijk', 'kga'], emoji: '⚗️' },
  { keywords: ['christmas', 'tree', 'kerstboom'], emoji: '🎄' },
];

/**
 * Return an emoji for the given English fraction name, or fall back to the text label.
 */
function fractionEmoji(englishName: string): string {
  const lower = englishName.toLowerCase();
  for (const entry of FRACTION_EMOJI_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) {
      return entry.emoji;
    }
  }
  return '🗑️';
}

function getApi(): FostPlusAPI {
  const consumerKey = process.env.FOSTPLUS_CONSUMER_KEY;
  if (!consumerKey) {
    throw new Error('FOSTPLUS_CONSUMER_KEY environment variable is not set.');
  }
  return new FostPlusAPI({ xConsumer: consumerKey });
}

/**
 * Format a Date as YYYY-MM-DD.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Return the date portion (YYYY-MM-DD) of a timestamp string.
 */
function dateKey(timestamp: string): string {
  return timestamp.substring(0, 10);
}

const MAX_ICAL_EVENTS = 200;

/**
 * GET /ical/:zipcodeId/:streetId/:houseNumber
 * Generate an iCalendar file for the upcoming 12 months of waste collections
 * for the given address.
 *
 * Query parameters:
 *   lang  – Language for fraction names: nl (default), en, fr
 *   emoji – Show emojis instead of text labels: true / false (default)
 *   group – Group all fractions of the same day into one event: true / false (default)
 */
router.get('/:zipcodeId/:streetId/:houseNumber', async (req: Request, res: Response) => {
  const zipcodeId = req.params['zipcodeId'] as string;
  const streetId = req.params['streetId'] as string;
  const houseNumber = req.params['houseNumber'] as string;

  if (!zipcodeId || !streetId || !houseNumber) {
    res.status(400).type('text/plain').send('Missing required parameters: zipcodeId, streetId, houseNumber');
    return;
  }

  const rawLang = (req.query['lang'] as string | undefined) ?? 'nl';
  const lang: Language = SUPPORTED_LANGUAGES.includes(rawLang as Language) ? (rawLang as Language) : 'nl';
  const useEmoji = req.query['emoji'] === 'true';
  const groupByDay = req.query['group'] === 'true';

  const fromDate = new Date();
  const untilDate = new Date();
  untilDate.setMonth(untilDate.getMonth() + 12);

  try {
    const api = getApi();
    const collectionsResponse = await api.getCollections(
      zipcodeId,
      streetId,
      houseNumber,
      formatDate(fromDate),
      formatDate(untilDate),
      MAX_ICAL_EVENTS
    );

    const calendar = new ICalCalendar({
      prodId: '//fostplus-ical-webserver//EN',
      name: 'Trash Collection Calendar',
    });

    if (groupByDay) {
      // Group fractions by day into a single event per day
      const dayMap = new Map<string, { timestamp: string; labels: string[] }>();
      for (const item of collectionsResponse.items) {
        const key = dateKey(item.timestamp);
        const label = useEmoji
          ? fractionEmoji(item.fraction.name.en)
          : item.fraction.name[lang] || item.fraction.name.en;
        if (!dayMap.has(key)) {
          dayMap.set(key, { timestamp: item.timestamp, labels: [label] });
        } else {
          dayMap.get(key)!.labels.push(label);
        }
      }
      for (const { timestamp, labels } of dayMap.values()) {
        const summary = labels.join(' + ');
        calendar.createEvent({
          start: new Date(timestamp),
          end: new Date(timestamp),
          summary,
          description: summary,
          allDay: true,
        });
      }
    } else {
      for (const item of collectionsResponse.items) {
        const label = useEmoji
          ? fractionEmoji(item.fraction.name.en)
          : item.fraction.name[lang] || item.fraction.name.en;
        calendar.createEvent({
          start: new Date(item.timestamp),
          end: new Date(item.timestamp),
          summary: label,
          description: label,
          allDay: true,
        });
      }
    }

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="fostplus-collections.ics"');
    res.send(calendar.toString());
  } catch (err: unknown) {
    console.error('Error generating iCalendar:', err);
    res.status(500).type('text/plain').send('Failed to generate iCalendar. Please check your address parameters and try again.');
  }
});

export default router;
