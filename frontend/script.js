document.addEventListener("DOMContentLoaded", () => {
  const taskList = document.getElementById("taskList");
  const taskForm = document.getElementById("taskForm");
  const taskNameInput = document.getElementById("taskName");

  const apiUrl = "http://localhost:3000";
  const username = localStorage.getItem("username");

  if (!username) {
    window.location.href = "login.html";
    return;
  }

  // --- LOGOUT BUTTON ---
  const logoutBtn = document.createElement("button");
  logoutBtn.textContent = "Logout";
  logoutBtn.style.cssText =
    "float:right; padding:0.5rem 1rem; margin-bottom:1rem; cursor:pointer;";
  document.body.insertBefore(logoutBtn, document.body.firstChild);

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "login.html";
  });

  // Helper to create task element
  function createTaskElement(task) {
    const li = document.createElement("li");
    if (task.completed) li.classList.add("completed");

    // ✅ Checkbox for completion
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleCompleted(task.taskId, checkbox.checked, li));

    const taskText = document.createElement("span");
    taskText.textContent = task.task;

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "delete-btn";
    delBtn.addEventListener("click", () => deleteTask(task.taskId, li));

    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(delBtn);
    return li;
  }

  // Fetch tasks
  fetch(`${apiUrl}/tasks/${encodeURIComponent(username)}`)
    .then((res) => res.json())
    .then((tasks) => {
      tasks.forEach((task) => taskList.appendChild(createTaskElement(task)));
    })
    .catch((err) => console.error("Fetch tasks error:", err));

  // Add task
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const taskName = taskNameInput.value.trim();
    if (!taskName) return;

    const newTask = { username, taskId: Date.now().toString(), task: taskName };

    fetch(`${apiUrl}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          newTask.completed = false;
          taskList.appendChild(createTaskElement(newTask));
          taskNameInput.value = "";
        } else {
          alert(data.error || "Could not add task");
        }
      })
      .catch((err) => console.error("Add task error:", err));
  });

  // ✅ Toggle completion
  function toggleCompleted(taskId, completed, liElement) {
    fetch(`${apiUrl}/tasks/${encodeURIComponent(username)}/${encodeURIComponent(taskId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          completed ? liElement.classList.add("completed") : liElement.classList.remove("completed");
        } else {
          alert("Could not update task");
        }
      })
      .catch((err) => console.error("Toggle error:", err));
  }

  // Delete task
  function deleteTask(taskId, liElement) {
    fetch(`${apiUrl}/tasks/${encodeURIComponent(username)}/${encodeURIComponent(taskId)}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          liElement.classList.add("fade-out");
          setTimeout(() => liElement.remove(), 500);
        } else {
          alert(data.error || "Could not delete task");
        }
      })
      .catch((err) => console.error("Delete task error:", err));
  }
});
