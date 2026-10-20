import { seedInitialWorkspaceData } from "../src/lib/bootstrap";

async function main() {
  const res = await seedInitialWorkspaceData();
  console.log("Seeded UX Pilot Studio database for:", res.adminEmail);
}

main().catch((err) => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
