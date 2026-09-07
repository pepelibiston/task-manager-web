<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request){

        $payload = $request->attributes->get('jwt');

        $userId = $payload->sub;

        $tasks = Task::orderBy("id","desc")->paginate(10);

        return response()->json($tasks, 200);
    }

    public function show(Task $task){
        return response()->json($task, 200);
    }

    public function store(StoreTaskRequest $request)
    {
        $data = $request->validated();

        $jwt = $request->attributes->get('jwt');

        $data['user_id'] = $jwt->sub;
        $data['status'] = 'pending';

        $task = Task::create($data);

        return response()->json($task, 201);
    }

    public function update(Task $task, UpdateTaskRequest $request){
        $task->update($request->validated());

        return response()->json($task, 200);
    }

    public function destroy(Task $task){
        $task->delete();

        return response()->noContent();
    }
}
