#!/usr/bin/env node

/**
 * Database diagnostic script to check table structure
 */

const postgres = require('postgres');

// Load environment variables
require('dotenv').config();

async function checkTableStructure() {
  console.log('🔍 Checking table structure...');
  
  try {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL not found in environment variables');
    }

    const sql = postgres(connectionString, { max: 1 });

    console.log('📋 Connected to database');

    // Check TodoList table structure
    console.log('\n📋 TodoList table columns:');
    const todoListColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'TodoList'
      ORDER BY ordinal_position
    `;
    console.table(todoListColumns);

    // Check Task table structure
    console.log('\n📋 Task table columns:');
    const taskColumns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Task'
      ORDER BY ordinal_position
    `;
    console.table(taskColumns);

    // Check if tables have data
    console.log('\n📊 Data counts:');
    const todoListCount = await sql`SELECT COUNT(*) as count FROM "TodoList"`;
    console.log(`TodoList records: ${todoListCount[0].count}`);

    const taskCount = await sql`SELECT COUNT(*) as count FROM "Task"`;
    console.log(`Task records: ${taskCount[0].count}`);

    // Check foreign key constraints
    console.log('\n🔑 Foreign key constraints:');
    const foreignKeys = await sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('TodoList', 'Task')
    `;
    console.table(foreignKeys);

    await sql.end();
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
    process.exit(1);
  }
}

// Run the check
if (require.main === module) {
  checkTableStructure();
}

module.exports = { checkTableStructure };