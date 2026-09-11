<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Support\Exceptions\OAuthException;
use Illuminate\Http\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public function register(array $data): User
    {
        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
    }

    public function login(array $credentials): string
    {
        return $this->attempt($credentials);
    }

    public function tokenFor(User $user): string
    {
        return JWTAuth::claims([
            'iss' => config('jwt.issuer'),
        ])->fromUser($user);
    }

    private function attempt(array $credentials): string
    {
        $token = JWTAuth::claims([
            'iss' => config('jwt.issuer'),
        ])->attempt($credentials);

        if (!$token) {
            throw new OAuthException(
                code: 'invalid_credentials_provided',
                statusCode: Response::HTTP_UNAUTHORIZED,
            );
        }

        return $token;
    }
}