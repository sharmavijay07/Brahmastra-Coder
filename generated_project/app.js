// app.js
// Data model and persistence layer for task management

/**
 * Represents a single task.
 */
export class Task {
  /**
   * @param {string} id - Unique identifier for the task.
   * @param {string} title - Short title of the task.
   * @param {string} description - Detailed description of the task.
   * @param {boolean} completed - Completion status.
   * @param {number} order - Ordering index for UI display.
   */
  constructor({ id, title, description = "", completed = false, order = 0 } = {}) {
    this.id = id ?? generateId();
    this.title = title ?? "";
    this.description = description;
    this.completed = completed;
    this.order = order;
  }
}

/**
 * Generates a unique string identifier.
 * Uses current timestamp combined with a random component to minimise collisions.
 * @returns {string}
 */
export function generateId() {
  // Example: "1667890123456-3f9b2a"
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Loads tasks from the browser's localStorage.
 * The tasks are stored under the key "tasks" as a JSON array.
 * @returns {Task[]}
 */
export function loadTasks() {
  try {
    const raw = localStorage.getItem("tasks");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Ensure we return an array of Task instances
    if (Array.isArray(parsed)) {
      return parsed.map(item => new Task(item));
    }
    return [];
  } catch (e) {
    console.error("Failed to load tasks from localStorage:", e);
    return [];
  }
}

/**
 * Persists the provided array of tasks to localStorage.
 * @param {Task[]} tasks
 */
export function saveTasks(tasks) {
  try {
    const serialized = JSON.stringify(tasks);
    localStorage.setItem("tasks", serialized);
  } catch (e) {
    console.error("Failed to save tasks to localStorage:", e);
  }
}

/**
 * Renders the list of tasks into the DOM.
 * Clears the existing list, creates <li> elements for each task respecting the filter,
 * and wires up UI event listeners (completion toggle, edit, delete).
 *
 * @param {Task[]} tasks - Array of task objects to render.
 * @param {string} [filter='all'] - One of 'all', 'active', 'completed'.
 */
export function renderTasks(tasks, filter = 'all') {
  const listEl = document.getElementById('task-list');
  if (!listEl) return;

  // Clear existing content
  listEl.innerHTML = '';

  // Apply filter
  const filtered = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  // Sort by order for consistent UI layout
  filtered.sort((a, b) => a.order - b.order);

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) li.classList.add('completed');
    li.dataset.id = task.id;
+
+    // Enable drag-and-drop
+    li.draggable = true;
+    li.addEventListener('dragstart', handleDragStart);
+    li.addEventListener('dragover', handleDragOver);
+    li.addEventListener('drop', handleDrop);
+    li.addEventListener('dragend', handleDragEnd);

    // Completion checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!task.completed;
    checkbox.className = 'task-checkbox';

    // Title span
    const titleSpan = document.createElement('span');
    titleSpan.className = 'task-title';
    titleSpan.textContent = task.title;

    // Optional description paragraph
    let descParagraph = null;
    if (task.description && task.description.trim() !== '') {
      descParagraph = document.createElement('p');
      descParagraph.className = 'task-desc';
      descParagraph.textContent = task.description;
    }

    // Edit icon
    const editIcon = document.createElement('span');
    editIcon.className = 'task-edit icon'; // include generic icon class for CSS
    editIcon.title = 'Edit task';
    editIcon.innerHTML = '&#9998;'; // ✎

    // Delete icon
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'task-delete icon'; // include generic icon class for CSS
    deleteIcon.title = 'Delete task';
    deleteIcon.innerHTML = '&#128465;'; // 🗑️

    // Assemble the list item
    li.appendChild(checkbox);
    li.appendChild(titleSpan);
    if (descParagraph) li.appendChild(descParagraph);
    li.appendChild(editIcon);
    li.appendChild(deleteIcon);

    // --- Event listeners -------------------------------------------------
    // Toggle completion status
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      li.classList.toggle('completed', task.completed);
      document.dispatchEvent(new CustomEvent('taskToggle', { detail: { task } }));
    });

    // Edit task event
    editIcon.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('taskEdit', { detail: { task } }));
    });

    // Delete task event
    deleteIcon.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('taskDelete', { detail: { task } }));
    });

    listEl.appendChild(li);
  });

  // Update status bar with remaining active tasks count
  const statusEl = document.getElementById('task-count');
  if (statusEl) {
    const remaining = tasks.filter(t => !t.completed).length;
    statusEl.textContent = `${remaining} task${remaining !== 1 ? 's' : ''} left`;
  }
}
+
+/**
+ * Global reference to the element being dragged.
+ * @type {HTMLElement|null}
+ */
+let draggedEl = null;
+
+/**
+ * Drag start handler – stores the dragged element and sets the drag data.
+ * @param {DragEvent} e
+ */
+function handleDragStart(e) {
+  draggedEl = e.currentTarget;
+  e.dataTransfer.effectAllowed = 'move';
+  // Use the task id as payload (not strictly needed for UI reordering)
+  e.dataTransfer.setData('text/plain', draggedEl.dataset.id);
+  draggedEl.classList.add('dragging');
+}
+
+/**
+ * Drag over handler – allows dropping and moves the placeholder position.
+ * @param {DragEvent} e
+ */
+function handleDragOver(e) {
+  e.preventDefault(); // Necessary to allow a drop
+  e.dataTransfer.dropEffect = 'move';
+  const target = e.currentTarget;
+  if (!draggedEl || target === draggedEl) return;
+  if (!target.classList.contains('task-item')) return;
+
+  const bounding = target.getBoundingClientRect();
+  const offset = e.clientY - bounding.top;
+  const after = offset > bounding.height / 2;
+  const list = target.parentNode;
+  if (after) {
+    if (target.nextSibling !== draggedEl) {
+      list.insertBefore(draggedEl, target.nextSibling);
+    }
+  } else {
+    if (target !== draggedEl) {
+      list.insertBefore(draggedEl, target);
+    }
+  }
+}
+
+/**
+ * Drop handler – finalizes the drop. The actual order update occurs on dragend.
+ * @param {DragEvent} e
+ */
+function handleDrop(e) {
+  e.preventDefault();
+  // No additional logic needed here; dragend will handle persisting order.
+}
+
+/**
+ * Drag end handler – recalculates the order of all tasks based on DOM order,
+ * persists the new ordering, and re-renders the list.
+ * @param {DragEvent} e
+ */
+function handleDragEnd(e) {
+  if (draggedEl) {
+    draggedEl.classList.remove('dragging');
+  }
+  draggedEl = null;
+
+  // Recompute order based on current DOM sequence
+  const listEl = document.getElementById('task-list');
+  if (!listEl) return;
+  const items = Array.from(listEl.querySelectorAll('.task-item'));
+  items.forEach((item, index) => {
+    const id = item.dataset.id;
+    const task = tasks.find(t => t.id === id);
+    if (task) {
+      task.order = index + 1; // start ordering at 1
+    }
+  });
+
+  // Persist and refresh UI
+  saveTasks(tasks);
+  refresh();
+}
*** End of File ***
*** End Patch ***