import { Router, Request, Response } from 'express';
import FostPlusAPI from '@leventhan/fostplus-api-wrapper';

const router = Router();

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

const MAX_ICAL_EVENTS = 500;

/**
 * GET /ical/:zipcodeId/:streetId/:houseNumber
 * Generate an iCalendar file for the upcoming 12 months of waste collections
 * for the given address.
 */
router.get('/:zipcodeId/:streetId/:houseNumber', async (req: Request, res: Response) => {
  const zipcodeId = req.params['zipcodeId'] as string;
  const streetId = req.params['streetId'] as string;
  const houseNumber = req.params['houseNumber'] as string;

  if (!zipcodeId || !streetId || !houseNumber) {
    res.status(400).type('text/plain').send('Missing required parameters: zipcodeId, streetId, houseNumber');
    return;
  }

  const fromDate = new Date();
  const untilDate = new Date();
  untilDate.setMonth(untilDate.getMonth() + 12);

  try {
    const api = getApi();
    const icsContent = await api.generateICalendar(
      zipcodeId,
      streetId,
      houseNumber,
      formatDate(fromDate),
      formatDate(untilDate),
      MAX_ICAL_EVENTS
    );

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="fostplus-collections.ics"');
    res.send(icsContent);
  } catch (err: unknown) {
    console.error('Error generating iCalendar:', err);
    res.status(500).type('text/plain').send('Failed to generate iCalendar. Please check your address parameters and try again.');
  }
});

export default router;
