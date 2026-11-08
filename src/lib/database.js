import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

if (!global.mongoose) global.mongoose = { conn: null, promise: null };
const cached = global.mongoose;

export async function connectDB() {
  if (cached.conn) {
    console.log("[MongoDB] 🔄 Using cached connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("[MongoDB] 🌐 Connecting to database...");
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        // Di serverless (Vercel) tiap instance punya pool sendiri dan bisa ada
        // banyak instance sekaligus. Pool kecil mencegah kuota koneksi Atlas
        // habis; batas waktu pendek membuat gangguan jaringan cepat ketahuan
        // daripada menggantung sampai fungsi timeout.
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((mongooseInstance) => {
        console.log("[MongoDB] ✅ Connection established");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("[MongoDB] ❌ Connection failed:", err);
        throw err;
      });
  } else {
    console.log("[MongoDB] ⏳ Waiting for ongoing connection promise");
  }

  cached.conn = await cached.promise;
  global.mongoose = cached;

  return cached.conn;
}
