#!/usr/bin/env node

/**
 * Simple test script for the todo feature
 * Tests basic CRUD operations
 */

const API_BASE = 'http://localhost:3000/api';

async function testTodoFeature() {
  console.log('🧪 Testing Todo Feature...');
  
  try {
    // Test 1: Get all todo lists
    console.log('\n1. Fetching todo lists...');
    const listsResponse = await fetch(`${API_BASE}/todos`, {
      credentials: 'include'
    });
    
    if (!listsResponse.ok) {
      throw new Error(`Failed to fetch lists: ${listsResponse.status}`);
    }
    
    const lists = await listsResponse.json();
    console.log(`✅ Found ${lists.length} todo lists`);
    
    // Test 2: Create a new todo list
    console.log('\n2. Creating new todo list...');
    const newListResponse = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: 'Test List' })
    });
    
    if (!newListResponse.ok) {
      throw new Error(`Failed to create list: ${newListResponse.status}`);
    }
    
    const newList = await newListResponse.json();
    console.log(`✅ Created list: ${newList.title} (ID: ${newList.id})`);
    
    // Test 3: Create a task
    console.log('\n3. Creating new task...');
    const newTaskResponse = await fetch(`${API_BASE}/todos/${newList.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: 'Test Task' })
    });
    
    if (!newTaskResponse.ok) {
      throw new Error(`Failed to create task: ${newTaskResponse.status}`);
    }
    
    const newTask = await newTaskResponse.json();
    console.log(`✅ Created task: ${newTask.title} (ID: ${newTask.id})`);
    
    // Test 4: Toggle task completion
    console.log('\n4. Toggling task completion...');
    const toggleResponse = await fetch(`${API_BASE}/todos/${newList.id}/tasks/${newTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ completed: true })
    });
    
    if (!toggleResponse.ok) {
      throw new Error(`Failed to toggle task: ${toggleResponse.status}`);
    }
    
    const toggledTask = await toggleResponse.json();
    console.log(`✅ Task completion: ${toggledTask.completed}`);
    
    // Test 5: Delete task
    console.log('\n5. Deleting task...');
    const deleteTaskResponse = await fetch(`${API_BASE}/todos/${newList.id}/tasks/${newTask.id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!deleteTaskResponse.ok) {
      throw new Error(`Failed to delete task: ${deleteTaskResponse.status}`);
    }
    
    console.log('✅ Task deleted');
    
    // Test 6: Delete list
    console.log('\n6. Deleting todo list...');
    const deleteListResponse = await fetch(`${API_BASE}/todos/${newList.id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!deleteListResponse.ok) {
      throw new Error(`Failed to delete list: ${deleteListResponse.status}`);
    }
    
    console.log('✅ List deleted');
    
    console.log('\n🎉 All tests passed! Todo feature is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testTodoFeature();
}

module.exports = { testTodoFeature };