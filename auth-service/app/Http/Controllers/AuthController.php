<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use App\Support\Traits\Authenticatable;
use Throwable;

class AuthController extends Controller
{
    use Authenticatable;

    public function __construct(
        private AuthService $authService
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        Log::info('Auth: registration attempt', [
            'email' => $request->input('email'),
        ]);

        try {
            $user = $this->authService->register(
                $request->validated()
            );

            Log::info('Auth: user registered successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            return $this->responseWithToken(
                $this->authService->tokenFor($user)
            );
        } catch (Throwable $e) {
            Log::error('Auth: registration failed', [
                'email' => $request->input('email'),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function login(LoginRequest $request): JsonResponse
    {
        Log::info('Auth: login attempt', [
            'email' => $request->input('email'),
        ]);

        try {
            $token = $this->authService->login(
                $request->credentials()
            );

            Log::info('Auth: login successful', [
                'email' => $request->input('email'),
            ]);

            return $this->responseWithToken($token);
        } catch (Throwable $e) {
            Log::warning('Auth: login failed', [
                'email' => $request->input('email'),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function me(): JsonResponse
    {
        try {
            $user = auth()->user();

            Log::debug('Auth: authenticated user requested', [
                'user_id' => $user?->id,
            ]);

            return response()->json($user);
        } catch (Throwable $e) {
            Log::error('Auth: failed to retrieve authenticated user', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function refresh(): JsonResponse
    {
        try {
            $token = auth()->refresh();

            Log::info('Auth: token refreshed');

            return $this->responseWithToken($token);
        } catch (Throwable $e) {
            Log::error('Auth: token refresh failed', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function logout(): JsonResponse
    {
        try {
            $userId = auth()->id();

            auth()->logout();

            Log::info('Auth: logout successful', [
                'user_id' => $userId,
            ]);

            return response()->json([
                'success' => true,
            ]);
        } catch (Throwable $e) {
            Log::error('Auth: logout failed', [
                'user_id' => auth()->id(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}