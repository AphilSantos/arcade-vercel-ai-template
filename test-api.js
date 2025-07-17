async function testCreateTodoList() {
  try {
    console.log('Testing POST /api/todos...');
    
    const response = await fetch('http://localhost:3000/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Todo List'
      }),
      credentials: 'include' // Include cookies for auth
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (!response.ok) {
      console.error('API Error:', response.status, text);
    } else {
      console.log('Success:', JSON.parse(text));
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testCreateTodoList();