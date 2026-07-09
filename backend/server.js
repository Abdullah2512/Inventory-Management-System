const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
});

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "Loaded ✅" : "Missing ❌");

const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Inventory Management System running at http://localhost:${PORT}`);
});
