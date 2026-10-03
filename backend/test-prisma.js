const prisma = require("./lib/prisma");

async function test() {
  try {
    await prisma.$connect();
    console.log("Prisma connected successfully");
  } catch (error) {
    console.error("Prisma connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();