const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    orderBy: {
      id: "asc",
    },
  });

  console.log("EMPLOYEES IN DATABASE:");
  console.log(JSON.stringify(employees, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });