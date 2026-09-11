<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password'
        ]);

        $response->assertSuccessful();

        $response
            ->assertOk()
            ->assertJsonStructure([
                'user',
                'authorization' => [
                    'access_token',
                    'token_type',
                    'expires_in',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);
    }

    public function test_user_cannot_register_with_existing_email(): void
    {
        
        User::factory()->create([
            'email' => 'john@example.com',
            'password' => "John Doe",
            'name' => "password"
        ]);

        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password'
        ]);

        $response->assertUnprocessable();

        $response->assertJsonValidationErrors([
            'email',
        ]);
    }

    public function test_user_cannot_register_without_required_fields(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertUnprocessable();

        $response->assertJsonValidationErrors([
            'name',
            'email',
            'password',
        ]);
    }

    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'password',
        ]);

        $response->assertSuccessful();

        $response
            ->assertOk()
            ->assertJsonStructure([
                'user',
                'authorization' => [
                    'access_token',
                    'token_type',
                    'expires_in',
                ],
            ]);
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
            'password' => "password",
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'wrong-password',
        ]);
 
        $response->assertUnauthorized();
    }

    public function test_user_cannot_login_with_non_existing_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'does-not-exist@example.com',
            'password' => 'password',
        ]);

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_get_their_profile(): void
    {
        $user = User::factory()->create([
            'email' => "test@gmail.com",
            'name' => "test",
            'password' => 'test'
        ]);

        $token = auth()->login($user);

        $response = $this
            ->withToken($token)
            ->getJson('/api/user');

        $response
            ->assertOk()
            ->assertJson([
                'id' => $user->id,
                'email' => $user->email,
            ]);
    }

    public function test_guest_cannot_get_user_profile(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertUnauthorized();
    }

    public function test_authenticated_user_can_refresh_token(): void
    {
        $user = User::factory()->create([
            'email' => "test@gmail.com",
            'name' => "test",
            'password' => 'test'
        ]);

        $token = auth()->login($user);

        $response = $this
            ->withToken($token)
            ->getJson('/api/refresh');

        $response->assertOk();

        $response
            ->assertOk()
            ->assertJsonStructure([
                'user',
                'authorization' => [
                    'access_token',
                    'token_type',
                    'expires_in',
                ],
            ]);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create([
            'email' => "test@gmail.com",
            'name' => "test",
            'password' => 'test'
        ]);

        $token = auth()->login($user);

        $response = $this
            ->withToken($token)
            ->postJson('/api/logout');

        $response
            ->assertOk();
    }

    public function test_guest_cannot_logout(): void
    {
        $response = $this->postJson('/api/logout');

        $response->assertUnauthorized();
    }
}