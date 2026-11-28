// Tiny stand-in for api.azpo.ru and the WordPress blog API, so CI builds don't depend on outside servers.
// Answers every request with an empty list. Usage: node scripts/mock-api.mjs &  (port 4010)
import { createServer } from "node:http";

createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url.includes("/wp/v2/")) return res.end("[]");
  if (req.url.includes("/locations")) return res.end("[]");
  res.end(JSON.stringify({ realEstates: [], count: 0 }));
}).listen(4010, () => console.log("mock API on http://localhost:4010"));
