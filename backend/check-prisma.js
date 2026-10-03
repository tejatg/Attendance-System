const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Attendance model exists:", !!prisma.attendance);

  console.log(
    "Attendance model type:",
    typeof prisma.attendance
  );

  const records = await prisma.attendance.findMany();

  console.log("Attendance records:", records);
}

main()
  .catch((error) => {
    console.error("ERROR:");
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });