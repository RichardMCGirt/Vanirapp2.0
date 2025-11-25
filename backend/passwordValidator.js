const crypto = require("crypto");

function verifyAspNetIdentityPassword(password, hashedPassword) {
  const buffer = Buffer.from(hashedPassword, "base64");

  // Format marker (0x01)
  const formatMarker = buffer.readUInt8(0);
  if (formatMarker !== 1) return false;

  // Extract values
  const prf = buffer.readUInt32BE(1); // 0x00000001 = HMAC-SHA256
  const iterCount = buffer.readUInt32BE(5);
  const saltLength = buffer.readUInt32BE(9);

  const salt = buffer.slice(13, 13 + saltLength);
  const storedSubkey = buffer.slice(13 + saltLength);

  // Re-derive key
  const derived = crypto.pbkdf2Sync(password, salt, iterCount, storedSubkey.length, "sha256");

  return crypto.timingSafeEqual(storedSubkey, derived);
}

module.exports = { verifyAspNetIdentityPassword };
