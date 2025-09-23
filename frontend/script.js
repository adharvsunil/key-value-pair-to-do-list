document.addEventListener('DOMContentLoaded', () => {
  const taskList = document.getElementById('taskList');
  const taskForm = document.getElementById('taskForm');
  const taskNameInput = document.getElementById('taskName');

  const apiUrl = "http://localhost:3000";
  const username = localStorage.getItem("username");

  if (!username) {
    window.location.href = "login.html";
    return;
  }

  // Fetch existing tasks
  fetch(`${apiUrl}/tasks/${username}`)
    .then(response => response.json())
    .then(tasks => {
      tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = task.task;
        taskList.appendChild(li);
      });
    })
    .catch(err => console.error("Fetch tasks error:", err));

  // Add new task
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskName = taskNameInput.value.trim();
    if (!taskName) return;

    fetch(`${apiUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        taskId: Date.now().toString(),
        task: taskName
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const li = document.createElement('li');
        li.textContent = taskName;
        taskList.appendChild(li);
        taskNameInput.value = '';
      } else {
        alert(data.error || "Could not add task");
      }
    })
    .catch(err => {
      console.error("Add task error:", err);
      alert("Error adding task");
    });
  });
});
