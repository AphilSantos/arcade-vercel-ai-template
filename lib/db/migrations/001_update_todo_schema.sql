-- Migration: Update todo schema with enhanced features
-- This migration adds new columns to existing tables and creates new tables

-- Add new columns to task table
ALTER TABLE task 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1 CHECK (priority IN (1, 2, 3)),
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add new columns to todo_list table
ALTER TABLE todo_list
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create task_context table for detailed task content
CREATE TABLE IF NOT EXISTS task_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_todo_list_id ON task(todo_list_id);
CREATE INDEX IF NOT EXISTS idx_task_completed ON task(completed);
CREATE INDEX IF NOT EXISTS idx_task_priority ON task(priority);
CREATE INDEX IF NOT EXISTS idx_task_due_date ON task(due_date);
CREATE INDEX IF NOT EXISTS idx_task_order ON task("order");
CREATE INDEX IF NOT EXISTS idx_todo_list_user_id ON todo_list(user_id);
CREATE INDEX IF NOT EXISTS idx_task_context_task_id ON task_context(task_id);

-- Update existing tasks to have proper order
UPDATE task SET "order" = (
    SELECT COUNT(*) 
    FROM task t2 
    WHERE t2.todo_list_id = task.todo_list_id AND t2.id < task.id
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_task_updated_at BEFORE UPDATE ON task
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todo_list_updated_at BEFORE UPDATE ON todo_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_context_updated_at BEFORE UPDATE ON task_context
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN task.description IS 'Optional detailed description of the task';
COMMENT ON COLUMN task.priority IS 'Task priority: 1=Low, 2=Medium, 3=High';
COMMENT ON COLUMN task.due_date IS 'Optional due date for the task';
COMMENT ON COLUMN task."order" IS 'Order for sorting tasks within a list';
COMMENT ON COLUMN task.created_at IS 'When the task was created';
COMMENT ON COLUMN task.updated_at IS 'When the task was last updated';
COMMENT ON TABLE task_context IS 'Stores additional context/content for tasks';