<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use Illuminate\Support\Facades\Hash;
use App\Support\Traits\Authenticatable;
use App\Support\Exceptions\OAuthException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    use Authenticatable;

    /**
     * Registro de usuario con JWT inmediato.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Usamos el mismo mecanismo JWT que funciona en login()
        $token = JWTAuth::claims([
            'iss' => config('jwt.issuer'),
        ])->attempt([
            'email' => $user['email'],
            'password' => $user['password'],
        ]);

        if (!$token) {
            throw new OAuthException(
                code: 'invalid_credentials_provided'
            );
        }

        return $this->responseWithToken($token);
    }

    /**
     * Get a JWT via given credentials.
     *
     * @return JsonResponse
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $token = JWTAuth::claims([
            'iss' => config('jwt.issuer'),
        ])->attempt($request->credentials());

        if (!$token) {
            throw new OAuthException(
                code: 'invalid_credentials_provided'
            );
        }

        return $this->responseWithToken($token);
    }

    public function me()
    {
        // Devuelve el usuario autenticado a partir del token JWT
        return response()->json(auth()->user());
    }

    /**
     * Refresh a token.
     *
     * @return \App\Modules\Auth\Collections\TokenResource
     */
    public function refresh(): JsonResponse
    {
        return $this->responseWithToken(access_token: auth()->refresh());
    }

    /**
     * Log the user out (Invalidate the token).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(): JsonResponse
    {
        auth()->logout();

        return new JsonResponse(['sucess' => true]);
    }
}
