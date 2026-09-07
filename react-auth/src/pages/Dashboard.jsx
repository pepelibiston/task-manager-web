
import { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { apiTask } from "../api/axios";

const columnToStatus = {
  pending: "pending",
  inProgress: "in_progress",
  done: "finished",
};

const statusToColumn = {
  pending: "pending",
  in_progress: "inProgress",
  finished: "done",
};

const priorityLabels = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

const formatTask = (task) => ({
  id: String(task.id),
  title: task.title,
  description: task.description || "",
  priority: task.priority,
  status: task.status,
  date: task.created_at
    ? new Date(task.created_at).toLocaleDateString("es-ES")
    : "",
});

function Dashboard() {
  const [tasks, setTasks] = useState({
    pending: [],
    inProgress: [],
    done: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // MODAL
  // =========================================================

  const [showModal, setShowModal] = useState(false);

  const [modalMode, setModalMode] = useState("create");

  const [editingTask, setEditingTask] = useState(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // =========================================================
  // CARGAR TAREAS
  // =========================================================

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiTask.get("/tasks");

      let taskList = [];

      if (Array.isArray(response.data)) {
        taskList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        taskList = response.data.data;
      } else if (Array.isArray(response.data?.data?.data)) {
        taskList = response.data.data.data;
      }

      const formattedTasks = taskList.map(formatTask);

      const groupedTasks = {
        pending: [],
        inProgress: [],
        done: [],
      };

      formattedTasks.forEach((task) => {
        const column = statusToColumn[task.status];

        if (column) {
          groupedTasks[column].push(task);
        }
      });

      setTasks(groupedTasks);
    } catch (err) {
      console.error("Error al cargar las tareas:", err);

      setError(
        err.response?.data?.message ||
          "No se han podido cargar las tareas."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // =========================================================
  // ABRIR MODAL CREAR
  // =========================================================

  const openCreateModal = () => {
    setModalMode("create");
    setEditingTask(null);

    setNewTask({
      title: "",
      description: "",
      priority: "medium",
    });

    setShowModal(true);
  };

  // =========================================================
  // ABRIR MODAL EDITAR
  // =========================================================

  const openEditModal = (task) => {
    setModalMode("edit");
    setEditingTask(task);

    setNewTask({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "medium",
    });

    setShowModal(true);
  };

  // =========================================================
  // CERRAR MODAL
  // =========================================================

  const closeModal = () => {
    if (creating || updating) {
      return;
    }

    setShowModal(false);
    setEditingTask(null);

    setNewTask({
      title: "",
      description: "",
      priority: "medium",
    });
  };

  // =========================================================
  // CREAR TAREA
  // =========================================================

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!newTask.title.trim()) {
      return;
    }

    try {
      setCreating(true);

      const payload = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        priority: newTask.priority,
      };

      const response = await apiTask.post(
        "/task",
        payload
      );

      const createdTask = formatTask({
        ...response.data,
        status: response.data.status || "pending",
      });

      setTasks((prev) => ({
        ...prev,
        pending: [...prev.pending, createdTask],
      }));

      closeModal();
    } catch (err) {
      console.error(
        "Error al crear la tarea:",
        err
      );

      alert(
        err.response?.data?.message ||
          "No se ha podido crear la tarea."
      );
    } finally {
      setCreating(false);
    }
  };

  // =========================================================
  // EDITAR TAREA
  // =========================================================

  const handleUpdateTask = async (e) => {
    e.preventDefault();

    if (!editingTask) {
      return;
    }

    if (!newTask.title.trim()) {
      return;
    }

    try {
      setUpdating(true);

      const payload = {
        title: newTask.title.trim(),
        description:
          newTask.description.trim() || null,
        priority: newTask.priority,
      };

      const response = await apiTask.put(
        `/tasks/${editingTask.id}`,
        payload
      );

      const updatedTask = formatTask({
        ...editingTask,
        ...response.data,
        title:
          response.data.title ??
          payload.title,
        description:
          response.data.description ??
          payload.description,
        priority:
          response.data.priority ??
          payload.priority,
      });

      setTasks((prev) => ({
        ...prev,
        pending: prev.pending.map((task) =>
          task.id === editingTask.id
            ? updatedTask
            : task
        ),
      }));

      setShowModal(false);
      setEditingTask(null);

      setNewTask({
        title: "",
        description: "",
        priority: "medium",
      });
    } catch (err) {
      console.error(
        "Error al editar la tarea:",
        err
      );

      alert(
        err.response?.data?.message ||
          "No se ha podido actualizar la tarea."
      );
    } finally {
      setUpdating(false);
    }
  };

  // =========================================================
  // DRAG & DROP
  // =========================================================

  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const { source, destination } = result;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = Array.from(
      tasks[source.droppableId]
    );

    const destinationColumn =
      source.droppableId === destination.droppableId
        ? sourceColumn
        : Array.from(tasks[destination.droppableId]);

    const [movedTask] = sourceColumn.splice(
      source.index,
      1
    );

    destinationColumn.splice(
      destination.index,
      0,
      movedTask
    );

    const previousTasks = tasks;

    setTasks((prev) => ({
      ...prev,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destinationColumn,
    }));

    if (
      source.droppableId === destination.droppableId
    ) {
      return;
    }

    try {
      const newStatus =
        columnToStatus[destination.droppableId];

      await apiTask.put(
        `/tasks/${movedTask.id}`,
        {
          status: newStatus,
        }
      );

      setTasks((prev) => ({
        ...prev,
        [destination.droppableId]: prev[
          destination.droppableId
        ].map((task) =>
          task.id === movedTask.id
            ? {
                ...task,
                status: newStatus,
              }
            : task
        ),
      }));
    } catch (err) {
      console.error(
        "Error al actualizar el estado:",
        err
      );

      setTasks(previousTasks);

      alert(
        err.response?.data?.message ||
          "No se ha podido actualizar el estado de la tarea."
      );
    }
  };

  // =========================================================
  // CONFIGURACIÓN DE COLUMNAS
  // =========================================================

  const columns = [
    {
      id: "pending",
      title: "Pendiente",
      subtitle: "Por comenzar",
      icon: "○",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      headerBg: "bg-amber-50/70",
    },
    {
      id: "inProgress",
      title: "En progreso",
      subtitle: "Trabajando en ello",
      icon: "◐",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      headerBg: "bg-blue-50/70",
    },
    {
      id: "done",
      title: "Finalizado",
      subtitle: "Trabajo completado",
      icon: "✓",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      headerBg: "bg-emerald-50/70",
    },
  ];

  // =========================================================
  // CONTADORES
  // =========================================================

  const totalTasks =
    tasks.pending.length +
    tasks.inProgress.length +
    tasks.done.length;

  const completedTasks = tasks.done.length;

  const progress =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0;

  // =========================================================
  // CARD DE TAREA
  // =========================================================

  const renderTask = (task, index, columnId) => {
    const priorityConfig = {
      high: {
        label: "Alta",
        className:
          "bg-red-50 text-red-700 border-red-100",
        dot: "bg-red-500",
      },
      medium: {
        label: "Media",
        className:
          "bg-amber-50 text-amber-700 border-amber-100",
        dot: "bg-amber-500",
      },
      low: {
        label: "Baja",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-100",
        dot: "bg-emerald-500",
      },
    };

    const priority =
      priorityConfig[task.priority] ||
      priorityConfig.medium;

    const canEdit = columnId === "pending";

    return (
      <Draggable
        key={task.id}
        draggableId={task.id}
        index={index}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`group bg-white rounded-2xl border border-gray-200 p-4 mb-3 transition-all duration-200 ${
              snapshot.isDragging
                ? "shadow-2xl rotate-1 scale-[1.02] border-blue-300"
                : "shadow-sm hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {/* PRIORIDAD + ACCIONES */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${priority.className}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${priority.dot}`}
                />

                {priority.label}
              </span>

              <div className="flex items-center gap-1">
                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(task);
                    }}
                    onMouseDown={(e) =>
                      e.stopPropagation()
                    }
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Editar tarea"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                )}

                <span className="text-gray-300 group-hover:text-gray-400 transition px-1">
                  ⋮⋮
                </span>
              </div>
            </div>

            {/* TÍTULO */}
            <h3 className="font-semibold text-gray-900 leading-snug">
              {task.title}
            </h3>

            {/* DESCRIPCIÓN */}
            {task.description && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-3">
                {task.description}
              </p>
            )}

            {/* FOOTER */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              {task.date ? (
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span>◷</span>
                  {task.date}
                </span>
              ) : (
                <span />
              )}

              <span className="text-xs font-medium text-gray-300">
                #{task.id}
              </span>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  // =========================================================
  // COLUMNA
  // =========================================================

  const renderColumn = (column) => {
    const columnTasks = tasks[column.id];

    return (
      <div
        key={column.id}
        className="flex flex-col min-w-0"
      >
        {/* CABECERA */}
        <div
          className={`rounded-2xl ${column.headerBg} border border-gray-200/80 p-4 mb-3`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${column.iconBg} ${column.iconColor} flex items-center justify-center font-bold text-lg`}
              >
                {column.icon}
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  {column.title}
                </h2>

                <p className="text-xs text-gray-500 mt-0.5">
                  {column.subtitle}
                </p>
              </div>
            </div>

            <span className="min-w-7 h-7 px-2 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {columnTasks.length}
            </span>
          </div>
        </div>

        {/* DROP ZONE */}
        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`rounded-2xl p-2 min-h-[420px] transition-all duration-200 ${
                snapshot.isDraggingOver
                  ? "bg-blue-50/80 ring-2 ring-blue-200 ring-dashed"
                  : "bg-gray-100/70"
              }`}
            >
              {columnTasks.map((task, index) =>
                renderTask(
                  task,
                  index,
                  column.id
                )
              )}

              {columnTasks.length === 0 &&
                !snapshot.isDraggingOver && (
                  <div className="h-[380px] flex flex-col items-center justify-center text-center px-6">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xl mb-3">
                      +
                    </div>

                    <p className="text-sm font-medium text-gray-400">
                      Sin tareas
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Arrastra una tarea aquí
                    </p>
                  </div>
                )}

              {snapshot.isDraggingOver && (
                <div className="h-20 border-2 border-dashed border-blue-300 rounded-xl flex items-center justify-center text-sm font-medium text-blue-500 mb-3">
                  Soltar aquí
                </div>
              )}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fc]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-gray-200 rounded-lg" />

            <div className="h-4 w-72 bg-gray-200 rounded mt-3" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 bg-white rounded-2xl border border-gray-200"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[450px] bg-gray-100 rounded-2xl"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />

              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Task Manager
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-950">
              Mis tareas
            </h1>

            <p className="text-gray-500 mt-2">
              Organiza tu trabajo y mantén todo bajo control.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-gray-950 hover:bg-gray-800 text-white px-5 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md transition-all"
          >
            <span className="text-lg leading-none">
              +
            </span>

            Nueva tarea
          </button>
        </header>

        {/* ERROR */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                !
              </div>

              <div>
                <p className="text-sm font-semibold text-red-800">
                  No se han podido cargar las tareas
                </p>

                <p className="text-xs text-red-600 mt-0.5">
                  {error}
                </p>
              </div>
            </div>

            <button
              onClick={fetchTasks}
              className="text-sm font-semibold text-red-700 hover:text-red-900 underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* RESUMEN */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total de tareas
                </p>

                <p className="text-3xl font-bold text-gray-950 mt-2">
                  {totalTasks}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 text-lg">
                ≡
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Todas tus tareas
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Pendientes
                </p>

                <p className="text-3xl font-bold text-gray-950 mt-2">
                  {tasks.pending.length}
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
                ○
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Tareas por comenzar
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Progreso
                </p>

                <p className="text-3xl font-bold text-gray-950 mt-2">
                  {progress}%
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                ✓
              </div>
            </div>

            <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* KANBAN */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Tablero
            </h2>

            <p className="text-sm text-gray-400 mt-0.5">
              Arrastra las tareas para cambiar su estado
            </p>
          </div>

          <DragDropContext
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {columns.map((column) =>
                renderColumn(column)
              )}
            </div>
          </DragDropContext>
        </section>
      </div>

      {/* =====================================================
          MODAL CREAR / EDITAR
          ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-gray-950/50 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* MODAL */}
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* HEADER */}
            <div className="px-6 sm:px-7 pt-6 pb-5 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl mb-4">
                    {modalMode === "edit" ? "✎" : "+"}
                  </div>

                  <h2 className="text-xl font-bold text-gray-950">
                    {modalMode === "edit"
                      ? "Editar tarea"
                      : "Nueva tarea"}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {modalMode === "edit"
                      ? "Modifica los datos de tu tarea."
                      : "Añade una nueva tarea a tu tablero."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="w-9 h-9 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center text-xl transition"
                >
                  ×
                </button>
              </div>
            </div>

            {/* FORM */}
            <form
              onSubmit={
                modalMode === "edit"
                  ? handleUpdateTask
                  : handleCreateTask
              }
              className="p-6 sm:p-7 space-y-5"
            >
              {/* TÍTULO */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Título
                </label>

                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      title: e.target.value,
                    })
                  }
                  placeholder="¿Qué tienes que hacer?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  required
                  autoFocus
                />
              </div>

              {/* DESCRIPCIÓN */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Descripción
                  <span className="font-normal text-gray-400 ml-1">
                    (opcional)
                  </span>
                </label>

                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({
                      ...newTask,
                      description: e.target.value,
                    })
                  }
                  placeholder="Añade algunos detalles..."
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none transition focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 resize-none"
                />
              </div>

              {/* PRIORIDAD */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Prioridad
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      value: "low",
                      label: "Baja",
                      color:
                        "peer-checked:border-emerald-400 peer-checked:bg-emerald-50 peer-checked:text-emerald-700",
                    },
                    {
                      value: "medium",
                      label: "Media",
                      color:
                        "peer-checked:border-amber-400 peer-checked:bg-amber-50 peer-checked:text-amber-700",
                    },
                    {
                      value: "high",
                      label: "Alta",
                      color:
                        "peer-checked:border-red-400 peer-checked:bg-red-50 peer-checked:text-red-700",
                    },
                  ].map((priority) => (
                    <label
                      key={priority.value}
                      className="cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={
                          newTask.priority ===
                          priority.value
                        }
                        onChange={(e) =>
                          setNewTask({
                            ...newTask,
                            priority:
                              e.target.value,
                          })
                        }
                        className="peer sr-only"
                      />

                      <div
                        className={`border border-gray-200 bg-gray-50 rounded-xl py-3 text-center text-sm font-semibold text-gray-500 transition ${priority.color}`}
                      >
                        {priority.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* ESTADO */}
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                  ○
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {modalMode === "edit"
                      ? "Pendiente"
                      : "Pendiente"}
                  </p>

                  <p className="text-xs text-gray-400">
                    {modalMode === "edit"
                      ? "El estado se cambia arrastrando la tarea"
                      : "La nueva tarea comenzará aquí"}
                  </p>
                </div>
              </div>

              {/* BOTONES */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    creating || updating
                  }
                  className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    creating || updating
                  }
                  className="px-5 py-3 rounded-xl bg-gray-950 hover:bg-gray-800 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating
                    ? "Creando..."
                    : updating
                    ? "Guardando..."
                    : modalMode === "edit"
                    ? "Guardar cambios"
                    : "Crear tarea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;