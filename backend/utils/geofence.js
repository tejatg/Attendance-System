function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000; // meters

  const toRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
  };

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function isInsideGeofence(latitude, longitude) {
  const officeLatitude = Number(process.env.ATTENDANCE_LATITUDE);
  const officeLongitude = Number(process.env.ATTENDANCE_LONGITUDE);
  const radius = Number(process.env.ATTENDANCE_RADIUS_METERS);

  if (
    !Number.isFinite(officeLatitude) ||
    !Number.isFinite(officeLongitude) ||
    !Number.isFinite(radius)
  ) {
    throw new Error("Geofence configuration is missing or invalid.");
  }

  const distance = calculateDistance(
    latitude,
    longitude,
    officeLatitude,
    officeLongitude
  );

  return {
    allowed: distance <= radius,
    distance,
    radius,
  };
}

module.exports = {
  calculateDistance,
  isInsideGeofence,
};