<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class Login extends Controller
{
    /**
     * Handle an authentication attempt.
     *
     * @param  \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function authenticate(Request $request)
    {
        $credentials = $request->only('email', 'password');

        // User::create([
        //     'name' => 'Gustavo',
        //     'email' => 'a@a.com',
        //     'password' => Hash::make('123456')
        // ]);


        $user = User::where('email', $credentials['email'])
            ->first();

        $someCustomValidate = $user !== null;

        Log::debug(json_encode($user));

        if ($someCustomValidate) {
            Auth::login($user, false);

            return response()->json(['success' => true]);
        }

        // if (Auth::attempt($credentials)) {
        //     return response()->json(['success' => true]);
        // }

        return response()->json([
            'message' => 'The provided credentials do not match our records.',
        ], 400);
    }
}
