require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const prisma = require("./lib/prisma");

async function test() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is missing or empty in backend/.env"
      );
    }

    await prisma.$connect();

    console.log(
      "Prisma connected successfully to the configured database."
    );
  } catch (error) {
    console.error("Prisma connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();