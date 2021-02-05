#### Laravel Auth

```
composer require laravel/ui

php artisan ui:auth
```

#### Laravel Sanctum

```
composer require laravel/sanctum

php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

php artisan migrate
```

Add Sanctum's middleware to your api middleware group within your `app/Http/Kernel.php` file:

```php
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

'api' => [
    EnsureFrontendRequestsAreStateful::class,
    'throttle:60,1',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

To begin issuing tokens for users, your User model should use the `HasApiTokens` trait:

```php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;
}
```

##### Create a User

```
php artisan tinker

App\User::create(['name'=>'John Doe', 'email'=>'johndoe@example.org', 'password'=>Hash::make('secret')]);
```

##### Issuing API Tokens

In routes/api.php

```php
use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/sanctum/token', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    return $user->createToken($request->email)->plainTextToken;
});
```

##### Request

```
POST /api/sanctum/token HTTP/1.1
Host: 127.0.0.1:8000
Accept: application/json
Content-Type: application/json

{
    "email": "johndoe@example.org",
    "password": "secret"
}
```

##### Response

```
27|XHATyNgZAslFhmE3Z3HBXWN86zJH3vaauNTwriBaPFAcroIDDCe1SJ1ysTLoE08ZrpuUgOYp7U5vtLo2
```

### Laravel Websockets

```
composer require beyondcode/laravel-websockets

php artisan vendor:publish --provider="BeyondCode\LaravelWebSockets\WebSocketsServiceProvider" --tag="migrations"

php artisan migrate

php artisan vendor:publish --provider="BeyondCode\LaravelWebSockets\WebSocketsServiceProvider" --tag="config"
```

#### Pusher

```
composer require pusher/pusher-php-server "~3.0"
```

`.env`

```
BROADCAST_DRIVER=pusher
PUSHER_APP_KEY=s3cr3t
PUSHER_APP_SECRET=s3cr3t
PUSHER_APP_ID=local
PUSHER_APP_CLUSTER=mt1
```

`config/broadcasting.php`

```php
'pusher' => [
    'driver' => 'pusher',
    'key' => env('PUSHER_APP_KEY'),
    'secret' => env('PUSHER_APP_SECRET'),
    'app_id' => env('PUSHER_APP_ID'),
    'options' => [
        'cluster' => env('PUSHER_APP_CLUSTER'),
        'encrypted' => true,
        'host' => '127.0.0.1',
        'port' => 6001,
        'scheme' => 'http'
    ],
],
```

`config/app.php` uncomment

```php
App\Providers\BroadcastServiceProvider::class
```

#### Dashboard

`http://127.0.0.1:8000/laravel-websockets`

#### Event & Channel

```
php artisan make:event Chat
```

```php
class Chat implements ShouldBroadcast{

public $payload = 'Hello World!';
...
public function broadcastOn()
    {
        return new PrivateChannel('App.User.3');
    }
...
}

```

In `routes/channels.php`

```php
Broadcast::channel('App.User.{id}', function ($user, $id) {
    //Check User's Authorization to listen on the channel.
    return true;
}
```

### Authorizing Private Broadcast Channels

You should place the `Broadcast::routes` method call within your `routes/api.php` file:

`Broadcast::routes(['middleware' => ['auth:sanctum']]);`

### Running Laravel & Websocket Server

```
php artisan serve
php artisan websockets:serve
```

### UI

```
npm i laravel-echo pusher-js axios
```

```js
<script>
import Echo from "laravel-echo";
import io from "socket.io-client";

window.io = io;

window._ = require("lodash");

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our Laravel back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

window.axios = require("axios");

window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

window.axios.defaults.withCredentials = true;

/**
 * Echo exposes an expressive API for subscribing to channels and listening
 * for events that are broadcast by Laravel. Echo and event broadcasting
 * allows your team to easily build robust real-time web applications.
 */

// Requisita o endpoint para gerar um cookie
window.axios.get("/sanctum/csrf-cookie").then(() => {
    const data = {
        email: "a@a.com",
        password: "123456",
    };

    // Retorna a promessa da requisição
    return (
        window.axios
            .post("/api/auth/login", data)
            // Caso sucesso no login
            .then(() => {
                // Conecta com o servidor de socket
                echo();
            })
    );
});

const echo = () => {
    // Faz require do pusherjs
    window.Pusher = require("pusher-js");

    // Inicia uma instância do Echo
    window.Echo = new Echo({
        // Seta o broadcaster
        broadcaster: "pusher",
        // Secret key
        key: "2398dsf1",
        // Websocket host
        wsHost: "127.0.0.1",
        // Websocket port
        wsPort: 6001,

        // General configs
        forceTLS: false,
        cluster: "mt1",
        disableStats: true,
        /**
         * Autorizador
         */
        authorizer: (channel) => ({
            // Função que autoriza os canais private e presence
            authorize: (socketId, callback) =>
                // Retorna a promessa da requisição
                axios
                    .post(window.location.origin + "/api/broadcasting/auth", {
                        // Informa o id do socket
                        socket_id: socketId,
                        // e o nome do canal que está tentando conectar
                        channel_name: channel.name,
                    })
                    // Caso sucesso, retorna callback e libera o acesso
                    .then((response) => callback(false, response.data))
                    // Caso erro, retorna callback e bloqueia o acesso
                    .catch((error) => callback(true, error)),
        }),
    });
};

</script>
```

### Fire an Event

```
php artisan tinker
event(new App\Events\Chat())
```
