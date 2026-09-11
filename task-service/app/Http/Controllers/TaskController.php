<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

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
    private function getUserTask(
        Request $request,
        Task $task
    ): Task {
        return Task::where('id', $task->id)
            ->where(
                'user_id',
                $this->getAuthenticatedUserId($request)
            )
            ->firstOrFail();
    }

    /**
     * Listar las tareas del usuario autenticado.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $this->getAuthenticatedUserId($request);

        try {
            Log::info('Task: listing user tasks', [
                'user_id' => $userId,
            ]);

            $tasks = Task::where(
                'user_id',
                $userId
            )
                ->orderByDesc('id')
                ->paginate(10);

            Log::info('Task: user tasks listed successfully', [
                'user_id' => $userId,
                'total' => $tasks->total(),
            ]);

            return response()->json($tasks);
        } catch (Throwable $e) {
            Log::error('Task: failed to list user tasks', [
                'user_id' => $userId,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Mostrar una tarea concreta del usuario autenticado.
     */
    public function show(
        Request $request,
        Task $task
    ): JsonResponse {
        $userId = $this->getAuthenticatedUserId($request);

        try {
            Log::info('Task: retrieving task', [
                'user_id' => $userId,
                'task_id' => $task->id,
            ]);

            $task = $this->getUserTask(
                $request,
                $task
            );

            Log::info('Task: task retrieved successfully', [
                'user_id' => $userId,
                'task_id' => $task->id,
            ]);

            return response()->json($task);
        } catch (Throwable $e) {
            Log::error('Task: failed to retrieve task', [
                'user_id' => $userId,
                'task_id' => $task->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Crear una nueva tarea.
     *
     * El user_id y el status NO vienen del frontend.
     * Ambos son establecidos por el backend.
     */
    public function store(
        StoreTaskRequest $request
    ): JsonResponse {
        $userId = $this->getAuthenticatedUserId($request);

        try {
            Log::info('Task: creating task', [
                'user_id' => $userId,
            ]);

            $data = $request->validated();

            $data['user_id'] = $userId;
            $data['status'] = 'pending';

            $task = Task::create($data);

            Log::info('Task: task created successfully', [
                'user_id' => $userId,
                'task_id' => $task->id,
            ]);

            return response()->json($task, 201);
        } catch (Throwable $e) {
            Log::error('Task: failed to create task', [
                'user_id' => $userId,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Actualizar una tarea del usuario autenticado.
     */
    public function update(
        UpdateTaskRequest $request,
        Task $task
    ): JsonResponse {
        $userId = $this->getAuthenticatedUserId($request);

        try {
            Log::info('Task: updating task', [
                'user_id' => $userId,
                'task_id' => $task->id,
            ]);

            $task = $this->getUserTask(
                $request,
                $task
            );

            $task->update(
                $request->validated()
            );

            Log::info('Task: task updated successfully', [
                'user_id' => $userId,
                'task_id' => $task->id,
            ]);

            return response()->json($task);
        } catch (Throwable $e) {
            Log::error('Task: failed to update task', [
                'user_id' => $userId,
                'task_id' => $task->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Eliminar una tarea del usuario autenticado.
     */
    public function destroy(
        Request $request,
        Task $task
    ): \Symfony\Component\HttpFoundation\Response {
        $userId = $this->getAuthenticatedUserId($request);

        try {
            Log::info('Task: deleting task', [
                'user_id' => $userId,
                'task_id' => $task->id,
            ]);

            $task = $this->getUserTask(
                $request,
                $task
            );

            $task->delete();

            Log::info('Task: task deleted successfully', [
                'user_id' => $userId,
                'task_id' => $task->id,
            ]);

            return response()->noContent();
        } catch (Throwable $e) {
            Log::error('Task: failed to delete task', [
                'user_id' => $userId,
                'task_id' => $task->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}