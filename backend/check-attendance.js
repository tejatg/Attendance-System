const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const attendance = await prisma.attendance.findMany({
    include: {
      employee: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  console.log("\nATTENDANCE RECORDS:\n");

  console.table(
    attendance.map((record) => ({
      ID: record.id,
      EmployeeID: record.employeeId,
      Name: record.employee?.name,
      Date: record.date,
      CheckIn: record.checkIn,
      CheckOut: record.checkOut,
      Status: record.status,
    }))
  );
}

main()
  .catch((error) => {
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });