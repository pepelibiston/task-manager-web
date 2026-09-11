<?php

namespace App\Services;

use App\Models\User;
use App\Support\Exceptions\OAuthException;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Throwable;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public function register(array $data): User
    {
        Log::debug('AuthService: creating user', [
            'email' => $data['email'],
        ]);

        try {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ]);

            Log::info('AuthService: user created', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            return $user;
        } catch (Throwable $e) {
            Log::error('AuthService: user creation failed', [
                'email' => $data['email'],
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function login(array $credentials): string
    {
        Log::debug('AuthService: authenticating user', [
            'email' => $credentials['email'] ?? null,
        ]);

        return $this->attempt($credentials);
    }

    public function tokenFor(User $user): string
    {
        try {
            $token = JWTAuth::claims([
                'iss' => config('jwt.issuer'),
            ])->fromUser($user);

            Log::debug('AuthService: JWT generated', [
                'user_id' => $user->id,
            ]);

            return $token;
        } catch (Throwable $e) {
            Log::error('AuthService: JWT generation failed', [
                'user_id' => $user->id,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    private function attempt(array $credentials): string
    {
        try {
            $token = JWTAuth::claims([
                'iss' => config('jwt.issuer'),
            ])->attempt($credentials);

            if (!$token) {
                Log::warning('AuthService: invalid credentials', [
                    'email' => $credentials['email'] ?? null,
                ]);

                throw new OAuthException(
                    code: 'invalid_credentials_provided',
                    statusCode: Response::HTTP_UNAUTHORIZED,
                );
            }

            Log::info('AuthService: authentication successful', [
                'email' => $credentials['email'] ?? null,
            ]);

            return $token;
        } catch (OAuthException $e) {
            // Ya hemos registrado el intento fallido.
            throw $e;
        } catch (Throwable $e) {
            Log::error('AuthService: authentication error', [
                'email' => $credentials['email'] ?? null,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}