<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
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

    public function store(StoreTaskRequest $request){
        $task = Task::create($request->validated());

        return response()->json($task, 201);
    }

    public function update(Task $task, Request $request){
        $task->update($request->all());

        return response()->json($task, 200);
    }

    public function destroy(Task $task){
        $task->delete();

        return response()->noContent();
    }
}
