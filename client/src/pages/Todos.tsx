import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trash } from 'lucide-react';
import type { Todo, UserSession } from '../types';

interface TodoContextType {
  currentUser: UserSession;
  todos: Todo[];
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  fetchData: () => void;
  fetchActivities: () => void;
}

export const Todos: React.FC = () => {
  const {
    currentUser,
    todos,
    setTodos,
    fetchData,
    fetchActivities
  } = useOutletContext<TodoContextType>();

  const [newTodoText, setNewTodoText] = useState('');
  const [todoLoading, setTodoLoading] = useState(false);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim() || !currentUser) return;
    setTodoLoading(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: newTodoText })
      });
      const data = await res.json();
      if (res.ok) {
        setTodos([data, ...todos]);
        setNewTodoText('');
        fetchActivities();
      }
    } catch (err) {
      console.error('Error adding todo:', err);
    } finally {
      setTodoLoading(false);
    }
  };

  const handleToggleTodo = async (id: number) => {
    if (!currentUser) return;
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    try {
      const res = await fetch(`/api/todos/${id}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (!res.ok) fetchData();
    } catch (err) {
      console.error('Error toggling todo:', err);
      fetchData();
    }
  };

  const handleDeleteTodo = async (id: number) => {
    if (!currentUser) return;
    setTodos(todos.filter(t => t.id !== id));
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (!res.ok) fetchData();
    } catch (err) {
      console.error('Error deleting todo:', err);
      fetchData();
    }
  };

  return (
    <div className="content-scroll-container padding-20" style={{ maxWidth: '640px', margin: '0 auto', padding: '20px' }}>
      <div className="todo-widget-card">
        <h3 className="todo-widget-title">📌 Kunlik Vazifalar (Reja)</h3>
        
        <form onSubmit={handleAddTodo} className="todo-input-form">
          <input
            type="text"
            className="admin-input todo-input"
            placeholder="Yangi vazifa..."
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            disabled={todoLoading}
            required
          />
          <button type="submit" className="admin-submit-btn todo-add-btn" disabled={todoLoading} style={{ marginTop: 0 }}>
            Qo'shish
          </button>
        </form>

        <div className="todo-list-scroll" style={{ maxHeight: 'none', overflowY: 'visible' }}>
          {todos.length > 0 ? (
            <div className="todo-items-list">
              {todos.map((todo) => (
                <div key={todo.id} className={`todo-item-row ${todo.completed ? 'completed' : ''}`}>
                  <label className="todo-checkbox-label">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleTodo(todo.id)}
                    />
                    <span className="todo-text">{todo.text}</span>
                  </label>
                  <button
                    className="admin-delete-btn"
                    style={{ padding: '6px', border: 'none', color: '#DC2626', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => handleDeleteTodo(todo.id)}
                    title="Vazifani o'chirish"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="todo-empty-text">Kunlik vazifalar ro'yxati bo'sh. Rejalar qo'shish uchun yuqoridagi maydondan foydalaning.</p>
          )}
        </div>
      </div>
    </div>
  );
};
export default Todos;
