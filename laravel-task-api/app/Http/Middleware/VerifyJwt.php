<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class VerifyJwt
{
public function handle(
        Request $request,
        Closure $next
    ): Response {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'message' => 'Token no proporcionado',
            ], 401);
        }

        try {
            $publicKey = file_get_contents(
                config('jwt.public_key')
            );

            $payload = JWT::decode(
                $token,
                new Key(
                    $publicKey,
                    config('jwt.algo')
                )
            );

            if ($payload->iss !== config('jwt.issuer')) {
                return response()->json([
                    'message' => 'Invalid token issuer',
                ], 401);
            }

            $request->attributes->set('jwt', $payload);

            return $next($request);

        } catch (ExpiredException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 401);

        } catch (Throwable $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 401);
        }
    }
}