'use strict';

require('dotenv').config();
const app = require('./server_app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 E-FOR-RENT → http://localhost:${PORT}`);
  console.log(`📦 Database   → db.json (LowDB)`);
  console.log(`⚙️  Admin      → http://localhost:${PORT}/admin\n`);
});
