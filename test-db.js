const postgres = require('postgres');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'Found' : 'Missing');
    
    if (!process.env.POSTGRES_URL) {
      console.error('POSTGRES_URL is not set in environment variables');
      return;
    }

    const client = postgres(process.env.POSTGRES_URL);
    
    // Test basic connection
    const result = await client`SELECT NOW()`;
    console.log('Database connection successful:', result[0]);
    
    // Test if tables exist
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Available tables:', tables.map(t => t.table_name));
    
    // Test todoList table specifically
    const todoListExists = tables.some(t => t.table_name === 'TodoList');
    console.log('TodoList table exists:', todoListExists);
    
    await client.end();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

testConnection();