import { neon } from "@neondatabase/serverless"
const sql = neon(process.env.DATABASE_URL)
await sql`DELETE FROM room_messages WHERE client_id = 'c_pushtest'`
console.log("done")
