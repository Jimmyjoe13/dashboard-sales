import { google } from 'googleapis';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), 'credentials', 'service-account.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = '1oThuV40f0y5rKAMlmyiLVviZ-ITNAQAl0zMevO4fjlg';
    const range = 'RDV!A1:J1000';
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    res.status(200).json({ data: response.data.values });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
