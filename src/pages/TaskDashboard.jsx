
import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

import { db } from "../services/firebase";
import "./TaskDashboard.css";

const initialForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "media"
};

function TaskDashboard({ user, onLogout }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice("");

    if (!user?.uid) {
      setNotice("Debes iniciar sesión para crear una tarea.");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "tasks"), {
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate,
        priority: form.priority,
        status: "pendiente",
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setForm(initialForm);
      setNotice("¡Tarea creada correctamente! 🎉");
    } catch (error) {
      console.error("Error al crear la tarea:", error);

      if (error.code === "permission-denied") {
        setNotice(
          "No tienes permisos para guardar la tarea. Revisa las reglas de Firestore."
        );
      } else {
        setNotice(
          "No se pudo guardar la tarea. Comprueba tu conexión e inténtalo nuevamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="task-page">
      <header className="task-topbar">
        <div className="task-brand">
          <span className="task-brand-icon">✓</span>
          <span>Taskly</span>
        </div>

        <div className="user-section">
          <span>
            Hola, {user.displayName || user.email}
          </span>

          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="task-main">
        <div className="task-heading">
          <p className="task-eyebrow">TU ESPACIO PERSONAL</p>

          <h1>Organiza tus actividades ✨</h1>

          <p>
            Registra tus pendientes, establece prioridades
            y organiza tu tiempo.
          </p>
        </div>

        <section className="task-form-card">
          <div className="form-heading">
            <span className="form-icon">📝</span>

            <div>
              <h2>Crear nueva tarea</h2>
              <p>Completa la información de tu actividad.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="task-field">
              <label htmlFor="title">
                Título de la tarea
              </label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="Ej. Entregar trabajo de programación"
                value={form.title}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>

            <div className="task-field">
              <label htmlFor="description">
                Descripción
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Describe los detalles de tu actividad..."
                value={form.description}
                onChange={handleChange}
                rows={4}
                maxLength={1000}
                required
              />
            </div>

            <div className="task-form-row">
              <div className="task-field">
                <label htmlFor="dueDate">
                  Fecha de vencimiento
                </label>

                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="task-field">
                <label htmlFor="priority">
                  Prioridad
                </label>

                <select
                  id="priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
            </div>

            <div className="task-default-status">
              <span className="status-dot"></span>
              Estado inicial: <strong>Pendiente</strong>
            </div>

            <button
              type="submit"
              className="create-task-button"
              disabled={loading}
            >
              {loading ? "Guardando tarea..." : "+ Crear tarea"}
            </button>

            {notice && (
              <p className="task-notice" role="status">
                {notice}
              </p>
            )}
          </form>
        </section>
      </section>
    </main>
  );
}

export default TaskDashboard;
