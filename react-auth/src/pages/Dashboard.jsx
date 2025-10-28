import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Estado de las tareas
  const [tasks, setTasks] = useState({
    pending: [
      { id: '1', title: 'Revisar emails', description: 'Responder correos urgentes', priority: 'alta', date: '2025-10-28' },
    ],
    inProgress: [
      { id: '2', title: 'Desarrollar feature X', description: 'Implementar login social', priority: 'media', date: '2025-10-28' },
    ],
    done: [
      { id: '3', title: 'Actualizar documentación', description: 'Revisar README', priority: 'baja', date: '2025-10-27' },
    ],
  });

  // Modal de creación de tarea
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'media', column: 'pending' });

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = Array.from(tasks[source.droppableId]);
    const destColumn = Array.from(tasks[destination.droppableId]);
    const [movedTask] = sourceColumn.splice(source.index, 1);

    destColumn.splice(destination.index, 0, movedTask);

    setTasks((prev) => ({
      ...prev,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn,
    }));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    const task = {
      id: Date.now().toString(),
      ...newTask,
      date: new Date().toISOString().split('T')[0],
    };
    setTasks((prev) => ({
      ...prev,
      [newTask.column]: [...prev[newTask.column], task],
    }));
    setNewTask({ title: '', description: '', priority: 'media', column: 'pending' });
    setShowModal(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-200 text-red-800';
      case 'media':
        return 'bg-yellow-200 text-yellow-800';
      case 'baja':
        return 'bg-green-200 text-green-800';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Tablero de Tareas</h1>
        <div className="flex items-center space-x-4">
          {user && <span className="text-gray-600">{user.email}</span>}
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            Cerrar sesión
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            + Nueva Tarea
          </button>
        </div>
      </header>

      {/* Kanban */}
      <main className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col md:flex-row gap-6">
            {['pending', 'inProgress', 'done'].map((columnKey) => {
              const columnName = columnKey === 'pending' ? 'Pendientes' : columnKey === 'inProgress' ? 'En curso' : 'Finalizadas';
              return (
                <Droppable droppableId={columnKey} key={columnKey}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 bg-gray-50 rounded-2xl p-4 shadow-inner min-h-[400px]"
                    >
                      <h2 className="text-lg font-semibold mb-4 text-gray-700">{columnName}</h2>
                      <div className="space-y-4">
                        {tasks[columnKey].map((task, index) => (
                          <Draggable draggableId={task.id} index={index} key={task.id}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-white p-4 rounded-xl shadow hover:shadow-md transition"
                              >
                                <div className={`inline-block px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)} mb-2`}>
                                  {task.priority.toUpperCase()}
                                </div>
                                <h3 className="font-semibold text-gray-800">{task.title}</h3>
                                <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                                <p className="text-gray-400 text-xs mt-1">Fecha: {task.date}</p>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </main>

      {/* Modal Crear Tarea */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Crear Nueva Tarea</h3>
            <form className="space-y-4" onSubmit={handleAddTask}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  required
                  value={newTask.description}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Columna</label>
                <select
                  value={newTask.column}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, column: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="pending">Pendientes</option>
                  <option value="inProgress">En curso</option>
                  <option value="done">Finalizadas</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
