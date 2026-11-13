
import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

import { db } from "../services/firebase";
import "./TaskDashboard.css";

// Formulario inicial
const initialForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "media"
};

// Estados disponibles para las tareas
const statusGroups = [
  {
    key: "pendiente",
    title: "Pendientes",
    icon: "○"
  },
  {
    key: "en_progreso",
    title: "En progreso",
    icon: "◷"
  },
  {
    key: "completada",
    title: "Completadas",
    icon: "✓"
  }
];

// Formatear fechas
function formatDate(date) {
  if (!date) return "Sin fecha";

  const parts = date.split("-");

  if (parts.length !== 3) return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Normalizar texto para las búsquedas
function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function TaskDashboard({ user, onLogout }) {
  // Datos del formulario de creación
  const [form, setForm] = useState(initialForm);

  // Lista de tareas
  const [tasks, setTasks] = useState([]);

  // Estados de carga y mensajes
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [notice, setNotice] = useState("");
  const [taskError, setTaskError] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  // Estados para editar tareas
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [savingEdit, setSavingEdit] = useState(false);

  // Estados para búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterPriority, setFilterPriority] = useState("todas");

  // Escuchar las tareas del usuario conectado
  useEffect(() => {
    if (!user?.uid) {
      setLoadingTasks(false);
      return;
    }

    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const documents = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data()
        }));

        // Ordenar de la más reciente a la más antigua
        documents.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;

          return dateB - dateA;
        });

        setTasks(documents);
        setTaskError("");
        setLoadingTasks(false);
      },
      (error) => {
        console.error("Error al consultar tareas:", error);

        setTaskError(
          "No fue posible cargar las tareas. Revisa los permisos de Firestore."
        );

        setLoadingTasks(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Actualizar campos del formulario de creación
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Crear una nueva tarea
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

      setNotice(
        error.code === "permission-denied"
          ? "No tienes permisos para guardar esta tarea."
          : "No se pudo guardar la tarea. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Abrir formulario de edición
  const handleStartEdit = (task) => {
    setEditingTask(task.id);

    setEditForm({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate || "",
      priority: task.priority || "media"
    });

    setActionNotice("");
  };

  // Actualizar campos del formulario de edición
  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Guardar cambios de una tarea
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingTask) return;

    setSavingEdit(true);
    setActionNotice("");

    try {
      await updateDoc(doc(db, "tasks", editingTask), {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        dueDate: editForm.dueDate,
        priority: editForm.priority
      });

      setEditingTask(null);
      setActionNotice("¡Tarea actualizada correctamente!");
    } catch (error) {
      console.error("Error al editar la tarea:", error);

      setActionNotice(
        "No se pudo actualizar la tarea. Inténtalo nuevamente."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // Eliminar una tarea
  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "¿Estás segura de que deseas eliminar esta tarea?"
    );

    if (!confirmed) return;

    setActionNotice("");

    try {
      await deleteDoc(doc(db, "tasks", taskId));

      setActionNotice("Tarea eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar la tarea:", error);

      setActionNotice(
        "No se pudo eliminar la tarea. Inténtalo nuevamente."
      );
    }
  };

  // Cambiar estado de una tarea
  const handleStatusChange = async (taskId, newStatus) => {
    setActionNotice("");

    try {
      await updateDoc(doc(db, "tasks", taskId), {
        status: newStatus
      });

      setActionNotice("¡Estado de la tarea actualizado!");
    } catch (error) {
      console.error("Error al cambiar el estado:", error);

      setActionNotice(
        "No se pudo cambiar el estado de la tarea."
      );
    }
  };

  // Buscar y filtrar tareas
  const filteredTasks = tasks.filter((task) => {
    const search = normalizeText(searchTerm);

    const titleMatches = normalizeText(task.title).includes(search);

    const descriptionMatches = normalizeText(
      task.description
    ).includes(search);

    const matchesSearch =
      !search || titleMatches || descriptionMatches;

    const matchesStatus =
      filterStatus === "todos" ||
      (task.status || "pendiente") === filterStatus;

    const matchesPriority =
      filterPriority === "todas" ||
      (task.priority || "media") === filterPriority;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority
    );
  });

  // Mostrar nombres de prioridades
  const priorityLabels = {
    baja: "Baja",
    media: "Media",
    alta: "Alta"
  };

  return (
    <main className="task-page">

      {/* ENCABEZADO */}

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

        {/* PRESENTACIÓN */}

        <div className="task-heading">
          <p className="task-eyebrow">
            TU ESPACIO PERSONAL
          </p>

          <h1>Organiza tus actividades ✨</h1>

          <p>
            Registra tus pendientes, establece prioridades
            y organiza tu tiempo.
          </p>
        </div>

        {/* FORMULARIO DE CREACIÓN */}

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
              {loading
                ? "Guardando tarea..."
                : "+ Crear tarea"}
            </button>

            {notice && (
              <p className="task-notice" role="status">
                {notice}
              </p>
            )}

          </form>
        </section>

        {/* SECCIÓN DE MIS TAREAS */}

        <section className="tasks-section">

          <div className="tasks-section-heading">
            <div>
              <p className="task-eyebrow">TU ORGANIZACIÓN</p>
              <h2>Mis tareas</h2>
            </div>

            <span className="tasks-total">
              {filteredTasks.length} resultados
            </span>
          </div>

          {actionNotice && (
            <p className="task-notice" role="status">
              {actionNotice}
            </p>
          )}

          {/* BUSCADOR Y FILTROS */}

          <div className="task-filters">

            <div className="task-search-field">
              <label htmlFor="task-search">
                Buscar tareas
              </label>

              <input
                id="task-search"
                type="search"
                placeholder="Buscar por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="task-filter-field">
              <label htmlFor="filter-status">
                Filtrar por estado
              </label>

              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
                <option value="completada">Completada</option>
              </select>
            </div>

            <div className="task-filter-field">
              <label htmlFor="filter-priority">
                Filtrar por prioridad
              </label>

              <select
                id="filter-priority"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="todas">Todas las prioridades</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <button
              type="button"
              className="clear-filters-button"
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("todos");
                setFilterPriority("todas");
              }}
            >
              Limpiar filtros
            </button>

          </div>

          {/* CARGA Y ERRORES */}

          {loadingTasks && (
            <p className="tasks-message">
              Cargando tus tareas...
            </p>
          )}

          {taskError && (
            <p className="task-notice" role="alert">
              {taskError}
            </p>
          )}

          {/* COLUMNAS DE TAREAS */}

          {!loadingTasks &&
            !taskError &&
            filteredTasks.length > 0 && (

            <div className="task-columns">

              {statusGroups.map((group) => {

                const groupedTasks = filteredTasks.filter(
                  (task) =>
                    (task.status || "pendiente") === group.key
                );

                return (
                  <section
                    className={`task-column status-${group.key}`}
                    key={group.key}
                  >

                    <div className="column-heading">
                      <span>{group.icon}</span>

                      <h3>{group.title}</h3>

                      <span className="column-count">
                        {groupedTasks.length}
                      </span>
                    </div>

                    {groupedTasks.length === 0 ? (

                      <p className="empty-column">
                        No hay tareas en esta sección.
                      </p>

                    ) : (

                      groupedTasks.map((task) => (

                        <article
                          className="task-item"
                          key={task.id}
                        >

                          <div className="task-item-top">
                            <h4>{task.title}</h4>

                            <span
                              className={`priority-badge priority-${task.priority || "media"}`}
                            >
                              {priorityLabels[task.priority] || "Media"}
                            </span>
                          </div>

                          <p className="task-item-description">
                            {task.description || "Sin descripción."}
                          </p>

                          <div className="task-item-date">
                            <span>📅</span>
                            <span>{formatDate(task.dueDate)}</span>
                          </div>

                          {/* CAMBIAR ESTADO */}

                          <div className="task-status-control">
                            <label htmlFor={`status-${task.id}`}>
                              Estado:
                            </label>

                            <select
                              id={`status-${task.id}`}
                              value={task.status || "pendiente"}
                              onChange={(e) =>
                                handleStatusChange(
                                  task.id,
                                  e.target.value
                                )
                              }
                            >
                              <option value="pendiente">
                                Pendiente
                              </option>

                              <option value="en_progreso">
                                En progreso
                              </option>

                              <option value="completada">
                                Completada
                              </option>
                            </select>
                          </div>

                          {/* EDITAR Y ELIMINAR */}

                          <div className="task-actions">

                            <button
                              type="button"
                              className="edit-task-button"
                              onClick={() => handleStartEdit(task)}
                            >
                              ✏️ Editar
                            </button>

                            <button
                              type="button"
                              className="delete-task-button"
                              onClick={() =>
                                handleDeleteTask(task.id)
                              }
                            >
                              🗑 Eliminar
                            </button>

                          </div>

                        </article>

                      ))

                    )}

                  </section>
                );

              })}

            </div>

          )}

          {/* CUANDO NO HAY RESULTADOS */}

          {!loadingTasks &&
            !taskError &&
            filteredTasks.length === 0 && (

            <p className="empty-results">
              {tasks.length === 0
                ? "Todavía no tienes tareas registradas."
                : "No encontramos tareas que coincidan con tu búsqueda o filtros."}
            </p>

          )}

        </section>

      </section>

      {/* VENTANA PARA EDITAR TAREAS */}

      {editingTask && (

        <div className="edit-modal-backdrop">

          <section
            className="edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
          >

            <div className="edit-modal-heading">

              <div>
                <p className="task-eyebrow">
                  ADMINISTRAR TAREA
                </p>

                <h2 id="edit-title">Editar tarea</h2>
              </div>

              <button
                type="button"
                className="close-modal-button"
                onClick={() => setEditingTask(null)}
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSaveEdit}>

              <div className="task-field">
                <label htmlFor="edit-title-field">
                  Título
                </label>

                <input
                  id="edit-title-field"
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  maxLength={100}
                  required
                />
              </div>

              <div className="task-field">
                <label htmlFor="edit-description">
                  Descripción
                </label>

                <textarea
                  id="edit-description"
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows={4}
                  maxLength={1000}
                  required
                />
              </div>

              <div className="task-form-row">

                <div className="task-field">
                  <label htmlFor="edit-date">
                    Fecha de vencimiento
                  </label>

                  <input
                    id="edit-date"
                    name="dueDate"
                    type="date"
                    value={editForm.dueDate}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="task-field">
                  <label htmlFor="edit-priority">
                    Prioridad
                  </label>

                  <select
                    id="edit-priority"
                    name="priority"
                    value={editForm.priority}
                    onChange={handleEditChange}
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>

              </div>

              <div className="edit-modal-actions">

                <button
                  type="button"
                  className="cancel-edit-button"
                  onClick={() => setEditingTask(null)}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="save-edit-button"
                  disabled={savingEdit}
                >
                  {savingEdit
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>

              </div>

            </form>

          </section>

        </div>

      )}

    </main>
  );
}

export default TaskDashboard;
