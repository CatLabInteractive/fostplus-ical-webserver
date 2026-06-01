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
 * GET /api/zipcodes?q=<search term>
 * Search for zipcodes matching the given query.
 */
router.get('/zipcodes', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || q.trim().length === 0) {
    res.status(400).json({ error: 'Query parameter "q" is required.' });
    return;
  }

  try {
    const api = getApi();
    const result = await api.getZipcodes(q.trim());
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/streets?q=<search term>&zipcodeId=<zipcode id>
 * Search for streets matching the query within the given zipcode.
 */
router.get('/streets', async (req: Request, res: Response) => {
  const q = req.query.q as string;
  const zipcodeId = req.query.zipcodeId as string;

  if (!q || q.trim().length === 0) {
    res.status(400).json({ error: 'Query parameter "q" is required.' });
    return;
  }
  if (!zipcodeId || zipcodeId.trim().length === 0) {
    res.status(400).json({ error: 'Query parameter "zipcodeId" is required.' });
    return;
  }

  try {
    const api = getApi();
    const result = await api.getStreets(q.trim(), zipcodeId.trim());
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
