<?php

namespace Tests\Feature;

use App\Http\Middleware\VerifyJwt;
use App\Models\Task;
use Illuminate\Http\Request;
use Mockery;

/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

function actingAsUser(int $userId): void
{
    $middleware = Mockery::mock(VerifyJwt::class);

    $middleware
        ->shouldReceive('handle')
        ->zeroOrMoreTimes()
        ->andReturnUsing(
            function (
                Request $request,
                \Closure $next
            ) use ($userId) {
                $request->attributes->set('jwt', (object) [
                    'sub' => $userId,
                    'iss' => config('jwt.issuer'),
                ]);

                return $next($request);
            }
        );

    app()->instance(VerifyJwt::class, $middleware);
}


/*
|--------------------------------------------------------------------------
| GET /api/tasks
|--------------------------------------------------------------------------
*/

describe('GET /api/tasks', function () {

    it('requires authentication', function () {
        $response = $this->getJson('/api/tasks');

        $response
            ->assertUnauthorized()
            ->assertJson([
                'message' => 'Token no proporcionado',
            ]);
    });

    it('allows a user to list only their own tasks', function () {
        actingAsUser(1);

        Task::create([
            'title' => 'Mi tarea',
            'description' => 'Descripción de mi tarea',
            'user_id' => 1,
            'priority' => 'medium',
            'status' => 'pending',
        ]);

        Task::create([
            'title' => 'Tarea de otro usuario',
            'description' => 'No debería aparecer',
            'user_id' => 2,
            'priority' => 'high',
            'status' => 'pending',
        ]);

        $response = $this->getJson('/api/tasks');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Mi tarea')
            ->assertJsonPath('data.0.user_id', 1);
    });

    it('returns an empty list when the user has no tasks', function () {
        actingAsUser(1);

        Task::create([
            'title' => 'Tarea de otro usuario',
            'description' => null,
            'user_id' => 2,
            'priority' => 'medium',
            'status' => 'pending',
        ]);

        $response = $this->getJson('/api/tasks');

        $response
            ->assertOk()
            ->assertJsonCount(0, 'data');
    });

});


/*
|--------------------------------------------------------------------------
| GET /api/tasks/{task}
|--------------------------------------------------------------------------
*/

describe('GET /api/tasks/{task}', function () {

    it('allows a user to view their own task', function () {
        actingAsUser(1);

        $task = Task::create([
            'title' => 'Mi tarea',
            'description' => 'Descripción',
            'user_id' => 1,
            'priority' => 'medium',
            'status' => 'pending',
        ]);

        $response = $this->getJson(
            "/api/tasks/{$task->id}"
        );

        $response
            ->assertOk()
            ->assertJsonPath('id', $task->id)
            ->assertJsonPath('title', 'Mi tarea')
            ->assertJsonPath('user_id', 1);
    });

    it('prevents a user from viewing another users task', function () {
        actingAsUser(1);

        $task = Task::create([
            'title' => 'Tarea privada',
            'description' => 'No debería poder verla',
            'user_id' => 2,
            'priority' => 'high',
            'status' => 'pending',
        ]);

        $response = $this->getJson(
            "/api/tasks/{$task->id}"
        );

        $response->assertNotFound();
    });

    it('returns not found for a task that does not exist', function () {
        actingAsUser(1);

        $response = $this->getJson('/api/tasks/999999');

        $response->assertNotFound();
    });

});


/*
|--------------------------------------------------------------------------
| POST /api/tasks
|--------------------------------------------------------------------------
*/

describe('POST /api/tasks', function () {

    it('allows a user to create a task', function () {
        actingAsUser(1);

        $response = $this->postJson('/api/tasks', [
            'title' => 'Nueva tarea',
            'description' => 'Descripción de prueba',
            'priority' => 'high',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('title', 'Nueva tarea')
            ->assertJsonPath(
                'description',
                'Descripción de prueba'
            )
            ->assertJsonPath('user_id', 1)
            ->assertJsonPath('status', 'pending')
            ->assertJsonPath('priority', 'high');

        $this->assertDatabaseHas('tasks', [
            'title' => 'Nueva tarea',
            'description' => 'Descripción de prueba',
            'user_id' => 1,
            'priority' => 'high',
            'status' => 'pending',
        ]);
    });

    it('does not allow the client to set the user_id', function () {
        actingAsUser(1);

        $response = $this->postJson('/api/tasks', [
            'title' => 'Nueva tarea',
            'description' => 'Descripción',
            'priority' => 'medium',
            'user_id' => 999,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('user_id', 1);

        $this->assertDatabaseHas('tasks', [
            'title' => 'Nueva tarea',
            'user_id' => 1,
        ]);

        $this->assertDatabaseMissing('tasks', [
            'title' => 'Nueva tarea',
            'user_id' => 999,
        ]);
    });

    it('always creates a new task with pending status', function () {
        actingAsUser(1);

        $response = $this->postJson('/api/tasks', [
            'title' => 'Nueva tarea',
            'description' => 'Descripción',
            'priority' => 'medium',
            'status' => 'finished',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('status', 'pending');

        $this->assertDatabaseHas('tasks', [
            'title' => 'Nueva tarea',
            'user_id' => 1,
            'status' => 'pending',
        ]);
    });

    it('requires a title', function () {
        actingAsUser(1);

        $response = $this->postJson('/api/tasks', [
            'description' => 'Sin título',
            'priority' => 'medium',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'title',
            ]);
    });

    it('requires a valid priority', function () {
        actingAsUser(1);

        $response = $this->postJson('/api/tasks', [
            'title' => 'Nueva tarea',
            'description' => 'Descripción',
            'priority' => 'urgent',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'priority',
            ]);
    });

});


/*
|--------------------------------------------------------------------------
| PUT /api/tasks/{task}
|--------------------------------------------------------------------------
*/

describe('PUT /api/tasks/{task}', function () {

    it('allows a user to update their own task', function () {
        actingAsUser(1);

        $task = Task::create([
            'title' => 'Título original',
            'description' => 'Descripción original',
            'user_id' => 1,
            'priority' => 'medium',
            'status' => 'pending',
        ]);

        $response = $this->putJson(
            "/api/tasks/{$task->id}",
            [
                'title' => 'Título actualizado',
                'description' => 'Descripción actualizada',
                'priority' => 'high',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'title',
                'Título actualizado'
            )
            ->assertJsonPath(
                'description',
                'Descripción actualizada'
            )
            ->assertJsonPath(
                'priority',
                'high'
            )
            ->assertJsonPath('user_id', 1);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Título actualizado',
            'description' => 'Descripción actualizada',
            'priority' => 'high',
            'user_id' => 1,
        ]);
    });

    it('allows a user to change the task status', function () {
        actingAsUser(1);

        $task = Task::create([
            'title' => 'Mi tarea',
            'description' => 'Descripción',
            'user_id' => 1,
            'priority' => 'medium',
            'status' => 'pending',
        ]);

        $response = $this->putJson(
            "/api/tasks/{$task->id}",
            [
                'status' => 'in_progress',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'status',
                'in_progress'
            );

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'status' => 'in_progress',
        ]);
    });

    it('prevents a user from updating another users task', function () {
        actingAsUser(1);

        $task = Task::create([
            'title' => 'Tarea de otro usuario',
            'description' => 'Privada',
            'user_id' => 2,
            'priority' => 'medium',
            'status' => 'pending',
        ]);

        $response = $this->putJson(
            "/api/tasks/{$task->id}",
            [
                'title' => 'Intento de modificación',
            ]
        );

        $response->assertNotFound();

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'title' => 'Tarea de otro usuario',
            'user_id' => 2,
        ]);
    });

    it('does not allow changing the user_id', function () {
        actingAsUser(1);

        $task = Task::create([
            'title' => 'Mi tarea',
            'description' => 'Descripción',
            'user_id' => 1,
            'priority' => 'medium',
            'status' => 'pending',
        ]);

        $response = $this->putJson(
            "/api/tasks/{$task->id}",
            [
                'title' => 'Tarea modificada',
                'user_id' => 999,
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath('user_id', 1);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'user_id' => 1,
            'title' => 'Tarea modificada',
        ]);

        $this->assertDatabaseMissing('tasks', [
            'id' => $task->id,
            'user_id' => 999,
        ]);
    });

    it('returns not found when updating a non existing task', function () {
        actingAsUser(1);

        $response = $this->putJson(
            '/api/tasks/999999',
            [
                'title' => 'Tarea inexistente',
            ]
        );

        $response->assertNotFound();
    });

});


/*
|--------------------------------------------------------------------------
| DELETE /api/tasks/{task}
|--------------------------------------------------------------------------
*/

describe('DELETE /api/tasks/{task}', function () {

    it('allows a user to delete their own task', function () {
        actingAsUser(1);

        $task = Task::create([
            'title' => 'Tarea para eliminar',
            'description' => 'Descripción',
            'user_id' => 1,
            'priority' => 'medium',
            'status' => 'pending',
        ]);

        $response = $this->deleteJson(
            "/api/tasks/{$task->id}"
        );

        $response->assertNoContent();

        $this->assertDatabaseMissing('tasks', [
            'id' => $task->id,
        ]);
    });

    it('prevents a user from deleting another users task', function () {
        actingAsUser(1);

        $task = Task::create([
            'title' => 'Tarea privada',
            'description' => 'No debería eliminarla',
            'user_id' => 2,
            'priority' => 'high',
            'status' => 'pending',
        ]);

        $response = $this->deleteJson(
            "/api/tasks/{$task->id}"
        );

        $response->assertNotFound();

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'user_id' => 2,
        ]);
    });

    it('returns not found when deleting a non existing task', function () {
        actingAsUser(1);

        $response = $this->deleteJson(
            '/api/tasks/999999'
        );

        $response->assertNotFound();
    });

});