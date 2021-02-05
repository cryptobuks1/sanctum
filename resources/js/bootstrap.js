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
