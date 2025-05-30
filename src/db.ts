import { Pool } from 'pg';

export const db = new Pool({
  host: '143.198.94.176',
  port: 5433,
  user: 'webrtc_user',
  password: 'webrtc_pass',
  database: 'webrtc_db',
});