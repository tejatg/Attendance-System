require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const bcrypt = require("bcrypt");
const { stdin, stdout } = require("process");
const prisma = require("../lib/prisma");

function promptHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
      reject(new Error("Run this script directly in a PowerShell terminal."));
      return;
    }

    let value = "";
    let finished = false;

    function cleanup() {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    }

    function onData(chunk) {
      for (const char of chunk.toString("utf8")) {
        if (char === "\u0003") {
          finished = true;
          cleanup();
          stdout.write("\nCancelled.\n");
          reject(new Error("Password entry cancelled."));
          return;
        }

        if (char === "\r" || char === "\n") {
          if (finished) return;
          finished = true;
          cleanup();
          stdout.write("\n");
          resolve(value);
          return;
        }

        if (char === "\u0008" || char === "\u007f") {
          value = value.slice(0, -1);
        } else if (char >= " " && char !== "\u007f") {
          value += char;
        }
      }
    }

    stdout.write(prompt);
    stdin.setEncoding("utf8");
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function main() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is missing from backend/.env");
    }

    if (!process.env.ADMIN_JWT_SECRET) {
      throw new Error("ADMIN_JWT_SECRET is missing from backend/.env");
    }

    // Verify that the intended existing account is present.
    const admin = await prisma.admin.findUnique({
      where: { username: "admin" },
      select: {
        id: true,
        username: true,
        isActive: true,
      },
    });

    if (!admin) {
      throw new Error(
        'Admin account "admin" does not exist. No changes were made.'
      );
    }

    if (!admin.isActive) {
      throw new Error(
        'Admin account "admin" is inactive. No changes were made.'
      );
    }

    console.log('Existing admin account found: "admin".');
    console.log("Enter a new password of at least 12 characters.");
    console.log("Password characters will not be displayed.");

    const password = await promptHidden("New password: ");

    if (password.length < 12) {
      throw new Error("Password must contain at least 12 characters.");
    }

    const confirmation = await promptHidden("Confirm new password: ");

    if (password !== confirmation) {
      throw new Error("Passwords do not match. No changes were made.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Change only the password hash of the existing admin.
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash },
    });

    console.log('\nPassword reset successfully for admin "admin".');
    console.log("Your employee and attendance records were not modified.");
    console.log("Sign in with username: admin and your new password.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nAdmin password reset failed:", error.message);
  process.exitCode = 1;
});