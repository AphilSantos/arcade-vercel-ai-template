#!/usr/bin/env node

/**
 * Create proper todo tables with correct schema
 */

const postgres = require('postgres');

// Load environment variables
require('dotenv').config();

async function createTodoTables() {
  console.log('🚀 Creating proper todo tables...');
  
  try {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('POSTGRES_URL not found in environment variables');
    }

    const sql = postgres(connectionString, { max: 1 });

    console.log('📋 Connected to database');

    // Create proper todo tables with correct schema
    await sql`
      CREATE TABLE IF NOT EXISTS "UserTodoList" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    console.log('✅ UserTodoList table created');

    await sql`
      CREATE TABLE IF NOT EXISTS "UserTask" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "todoListId" UUID NOT NULL REFERENCES "UserTodoList"(id) ON DELETE CASCADE,
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

    console.log('✅ UserTask table created');

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS "UserTodoList_userId_idx" ON "UserTodoList"("userId")
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "UserTask_todoListId_idx" ON "UserTask"("todoListId")
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "UserTask_completed_idx" ON "UserTask"(completed)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS "UserTask_priority_idx" ON "UserTask"(priority)
    `;

    console.log('✅ Indexes created');

    // Create updated_at trigger
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
      DROP TRIGGER IF EXISTS update_user_task_updated_at ON "UserTask"
    `;

    await sql`
      CREATE TRIGGER update_user_task_updated_at
        BEFORE UPDATE ON "UserTask"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('✅ Updated_at trigger created');

    console.log('🎉 Todo tables created successfully!');
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error creating todo tables:', error);
    process.exit(1);
  }
}

// Run the creation
if (require.main === module) {
  createTodoTables();
}

module.exports = { createTodoTables };