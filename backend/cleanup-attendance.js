const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.attendance.deleteMany({
    where: {
      employeeId: "EMP003",
    },
  });

  console.log(`Deleted ${result.count} attendance record(s).`);
}

main()
  .catch((error) => {
    console.error("CLEANUP ERROR:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });