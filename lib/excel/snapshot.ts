import crypto from "node:crypto";
export const hashWorkbook = (bytes: Buffer) => crypto.createHash("sha256").update(bytes).digest("hex");
