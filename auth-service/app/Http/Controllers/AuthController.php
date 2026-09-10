<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use App\Support\Traits\Authenticatable;

class AuthController extends Controller
{
    use Authenticatable;

    public function __construct(
        private AuthService $authService
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authService->register(
            $request->validated()
        );

        return $this->responseWithToken(
            $this->authService->tokenFor($user)
        );
    }

    public function login(LoginRequest $request): JsonResponse
    {
        return $this->responseWithToken(
            $this->authService->login($request->credentials())
        );
    }

    public function me(): JsonResponse
    {
        return response()->json(auth()->user());
    }

    public function refresh(): JsonResponse
    {
        return $this->responseWithToken(
            auth()->refresh()
        );
    }

    public function logout(): JsonResponse
    {
        auth()->logout();

        return response()->json(['success' => true]);
    }
}
