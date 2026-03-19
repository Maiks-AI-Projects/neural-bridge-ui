import { createPool } from "mariadb";

async function test() {
  console.log("Testing DIRECT connection to Master (192.168.187.50:3306)...");
  try {
    const pool = createPool({
      host: "192.168.187.50",
      user: "nb_app",
      password: "NB_App_Pass_2026!",
      database: "neural_bridge",
      port: 3306,
      connectionLimit: 1,
    });
    const conn = await pool.getConnection();
    const rows = await conn.query("SELECT 1 as result");
    console.log("Query result:", rows);
    await conn.release();
    await pool.end();
    console.log("DIRECT connection to Master successful!");
  } catch (err) {
    console.error("DIRECT connection to Master FAILED:", err);
  }
}

test();
