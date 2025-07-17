#!/usr/bin/env node

/**
 * Database initialization script for todo feature
 * This script ensures the todo tables exist in your database
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const postgres = require('postgres');

// Load environment variables
require('dotenv').config();

async function initTodoTables() {
  console.log('🚀 Initializing todo tables...');
  
  try {
    // Create database connection
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL not found in environment variables');
    }

    const sql = postgres(connectionString, { max: 1 });
    const db = drizzle(sql);

    console.log('📋 Connected to database');

    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS "TodoList" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    console.log('✅ TodoList table created/verified');

    await sql`
      CREATE TABLE IF NOT EXISTS "Task" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "todoListId" UUID NOT NULL REFERENCES "TodoList"(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        priority INTEGER NOT NULL DEFAULT 1,
        "dueDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "order" INTEGER NOT NULL DEFAULT 0
      )
    `;

    console.log('✅ Task table created/verified');

    await sql`
      CREATE TABLE IF NOT EXISTS "TaskContext" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "taskId" UUID NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    console.log('✅ TaskContext table created/verified');

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS "TodoList_userId_idx" ON "TodoList"("userId")
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "Task_todoListId_idx" ON "Task"("todoListId")
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "Task_completed_idx" ON "Task"(completed)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "Task_priority_idx" ON "Task"(priority)
    `;

    console.log('✅ Indexes created');

    // Create updated_at trigger for Task table
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_task_updated_at ON "Task"
    `;

    await sql`
      CREATE TRIGGER update_task_updated_at
        BEFORE UPDATE ON "Task"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('✅ Updated_at trigger created');

    console.log('🎉 Todo tables initialized successfully!');
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error initializing todo tables:', error);
    process.exit(1);
  }
}

// Run the initialization
if (require.main === module) {
  initTodoTables();
}

module.exports = { initTodoTables };