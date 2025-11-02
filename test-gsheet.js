import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'credentials', 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const spreadsheetId = '1oThuV40f0y5rKAMlmyiLVviZ-ITNAQAl0zMevO4fjlg'; // ID Sheet test
  const range = 'RDV!A1:J10';

  try {
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    console.log(response.data.values);
  } catch (e) {
    console.error('Node test error:', e);
  }
})();
