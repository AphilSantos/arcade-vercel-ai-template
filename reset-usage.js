// Simple script to reset usage counters
// Run this with: node reset-usage.js

async function resetUsage() {
  try {
    const response = await fetch('http://localhost:3000/api/subscription/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('Success:', data.message);
    } else {
      console.error('Error:', data.message || data.error || 'Failed to reset usage counters');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

resetUsage();