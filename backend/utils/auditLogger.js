const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * TALENTRONAUT SMART ATTENDANCE
 * ATTENDANCE CONTROL CORE
 *
 * Central Audit Logger
 *
 * Records important security and business events
 * into the AuditEvent table.
 */

async function logAuditEvent({
  eventType,
  employeeId = null,
  actor = null,
  description = null,
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) {
  try {
    if (!eventType) {
      console.warn(
        "[AUDIT] Audit event skipped: eventType is required."
      );

      return null;
    }

    const auditEvent = await prisma.auditEvent.create({
      data: {
        eventType,
        employeeId,
        actor,
        description,
        ipAddress,
        userAgent,
        metadata,
      },
    });

    console.log(
      `[AUDIT] ${eventType} | ${description || "Event recorded"}`
    );

    return auditEvent;
  } catch (error) {
    /*
     * Audit failure must never crash the main
     * attendance or employee operation.
     */
    console.error(
      "[AUDIT] Failed to record audit event:"
    );

    console.error(error.message);

    return null;
  }
}

module.exports = {
  logAuditEvent,
};