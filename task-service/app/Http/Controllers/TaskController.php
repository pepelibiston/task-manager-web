<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Obtiene el ID del usuario autenticado a partir del JWT.
     */
    private function getAuthenticatedUserId(Request $request): int
    {
        return $request->attributes->get('jwt')->sub;
    }

    /**
     * Obtiene una tarea únicamente si pertenece al usuario autenticado.
     *
     * Si la tarea no existe o pertenece a otro usuario,
     * firstOrFail() devolverá una respuesta 404.
     */
    private function getUserTask(Request $request, Task $task): Task
    {
        return Task::where('id', $task->id)
            ->where('user_id', $this->getAuthenticatedUserId($request))
            ->firstOrFail();
    }

    /**
     * Listar las tareas del usuario autenticado.
     */
    public function index(Request $request)
    {
        $tasks = Task::where(
            'user_id',
            $this->getAuthenticatedUserId($request)
        )
            ->orderByDesc('id')
            ->paginate(10);

        return response()->json($tasks);
    }

    /**
     * Mostrar una tarea concreta del usuario autenticado.
     */
    public function show(Request $request, Task $task)
    {
        $task = $this->getUserTask($request, $task);

        return response()->json($task);
    }

    /**
     * Crear una nueva tarea.
     *
     * El user_id y el status NO vienen del frontend.
     * Ambos son establecidos por el backend.
     */
    public function store(StoreTaskRequest $request)
    {
        $data = $request->validated();

        $data['user_id'] = $this->getAuthenticatedUserId($request);
        $data['status'] = 'pending';

        $task = Task::create($data);

        return response()->json($task, 201);
    }

    /**
     * Actualizar una tarea del usuario autenticado.
     */
    public function update( Task $task, UpdateTaskRequest $request)
    {
        $task = $this->getUserTask($request, $task);

        $task->update($request->validated());

        return response()->json($task);
    }

    /**
     * Eliminar una tarea del usuario autenticado.
     */
    public function destroy(Request $request, Task $task)
    {
        $task = $this->getUserTask($request, $task);

        $task->delete();

        return response()->noContent();
    }
}
