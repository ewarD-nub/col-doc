mod api;
mod state;
mod ws;

use axum::{Router, routing::{get, post}};
use tower_http::cors::{CorsLayer, Any};

use state::AppState;

use axum::http::{HeaderValue, Method};
use axum::http::header::CONTENT_TYPE;

// TODO: add an `errors` module for unified error types (thiserror + IntoResponse)
// TODO: add a `db` module for sqlx connection pool + migrations
// TODO: add an `auth` middleware module (JWT extraction, role guards)
// TODO: add a `config` module (dotenv → typed Config struct)

#[tokio::main]
async fn main() {
    // TODO: load .env file → tracing level from RUST_LOG env var
    tracing_subscriber::fmt::init();

    let state = AppState::new();
    state.seed().await;

    // TODO: pass a PgPool to AppState once db module is ready
    // TODO: run sqlx migrations on startup (sqlx::migrate!().run(&pool))

    let cors = CorsLayer::new()
        .allow_origin(
            "http://localhost:3000"
            .parse::<HeaderValue>()
            .expect("no error"),
        )
        .allow_methods([Method::POST, Method::GET])
        .allow_headers([CONTENT_TYPE])
        .allow_credentials(true);
    // TODO: restrict allow_origin to FRONTEND_URL env var in production

    let app = Router::new()
        // WebSocket (Yjs sync)
        .route("/ws/:room_id", get(ws::ws_handler))
        // Documents REST API
        .route("/api/docs",     get(api::docs::list).post(api::docs::create))
        .route("/api/docs/:id", get(api::docs::get)
                                    .patch(api::docs::update_title)
                                    .delete(api::docs::delete))
        .route("/api/auth/signup", post(api::auth::signup))
        // TODO: .route("/api/auth/login",  post(api::auth::login))
        // TODO: .route("/api/auth/refresh",post(api::auth::refresh))
        // TODO: .route("/api/auth/logout", post(api::auth::logout))
        // TODO: .nest("/api/users", api::users::router())
        .layer(cors)
        .with_state(state);

    let addr = std::env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".into());
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    tracing::info!("listening on {addr}");
    axum::serve(listener, app).await.unwrap();
}
