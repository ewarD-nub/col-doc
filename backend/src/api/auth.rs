use ::axum::Json;
use serde::{Deserialize, Serialize};

pub async fn signup() {}

#[derive(Debug, Deserialize)]
pub enum UsernameOrEmail {
    Username(String),
    Email(String),
}

#[derive(Debug, Deserialize)]
pub struct LoginParams {
    username_or_email: UsernameOrEmail,
    password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    username: String,
    email: String,
    preferences: Preferences,
}

pub async fn login(
    db: Db,
    Json(LoginParams {
        username_or_email,
        password,
    }): Json<LoginParams>,
) {
    let row = match username_or_email {
        UsernameOrEmail::Email(email) => {
            sqlx::query("SELECT * FROM user WHERE email = ?")
                .bind(email.to_owned())
                .fetch_one(&db)
                .await?
        }
        UsernameOrEmail::Username(username) => {
            sqlx::query("SELECT * FROM user WHERE username = ?")
                .bind(username.to_owned())
                .fetch_one(&db)
                .await?
        }
    };

    let salt: Vec<u8> = row.get("salt");
    let password_hash: Vec<u8> = row.get("password_hash");
    let preferences: String = row.get("preferences");
    let preferences = Preferences::from(preferences);

    if super::password_hash(&password, &salt) != password_hash {
        return Err(SignInError::InvalidSignInParams);
    }

    let user_id = row.get("id");
    let username: String = row.get("username");
    let email: String = row.get("email");

    let auth_token: AuthToken = AuthToken::new(user_id, &username, &email);
    Ok((
        auth_token,
        Json(LoginResponse {
            username,
            email,
            preferences,
        }),
    ))
}

pub struct AuthToken {
    exp: u64,
    pub user_id: u32,
    pub username: String,
    pub email: String,
}

#[derive(Debug)]
pub enum SignInError {
    InvalidSignInParams,
    Other,
}

pub async fn refresh() {}
