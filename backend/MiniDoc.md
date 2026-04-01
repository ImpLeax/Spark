# Spark API Mini Documentation

## Base URL
All API requests should be prefixed with:
`http://127.0.0.1:8000/api/v1/`

## Authentication (JWT)
This API uses JSON Web Tokens (JWT). For protected routes, include the Access Token in the HTTP Headers:
`Authorization: Bearer <your_access_token>`

> **Note:** Our Access Token contains custom claims. Decode it on the frontend (e.g., using `jwt-decode`) to instantly get the user's `profile_id`, `first_name`, and `last_name`.

---

## Auth & Account Endpoints

### 1. User Registration
Creates a new User, Profile, and Gallery. Validates age (18+) and requires 2-4 photos and at least 2 interests.
* **URL:** `user/register/`
* **Method:** `POST`
* **Auth Required:** No
* **Content-Type:** `multipart/form-data` *(Important: Do not send JSON)*
* **FormData Example:**
  ```javascript
  username: "username"
  email: "email@spark.com"
  password: "SuperSecretPassword123!"
  first_name: "Name"
  last_name: "Name"
  surname: "Name"
  birth_date: "2000-01-01"
  location: "Kyiv"
  gender_id: 1
  looking_for_id: 2
  intention_id: 1
  interests: 1     // append multiple times for multiple interests
  interests: 2
  photos: [file1]  // input type="file", min: 2, max: 4
  photos: [file2]
  ```
* **Success Response (201 Created):** Returns the created user object data.

### 2. Account Activation
Activates the user's account via email link.
* **URL:** `user/activate/<uidb64>/<token>/`
* **Method:** `GET`
* **Auth Required:** No
* **Success Response (200 OK):** `{"message": "Your account has been successfully activated! You can now log in."}`

### 3. Login (Obtain Tokens)
* **URL:** `user/login/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body (JSON):** `{"username": "email@spark.com", "password": "SecretPassword!"}`
* **Success Response (200 OK):** `{"access": "eyJhbGci...", "refresh": "eyJhbGci..."}`

### 4. Refresh Token
* **URL:** `user/token/refresh/`
* **Method:** `POST`
* **Auth Required:** No
* **Request Body (JSON):** `{"refresh": "<your_current_refresh_token>"}`
* **Success Response (200 OK):** Returns NEW `access` and NEW `refresh` tokens.

### 4.5. Logout (Blacklist Token)
Invalidates the user's refresh token so it can no longer be used. The frontend should also clear tokens from local storage.
* **URL:** `user/logout/`
* **Method:** `POST`
* **Auth Required:** **Yes**
* **Request Body (JSON):** `{"refresh": "<your_current_refresh_token>"}`
* **Success Response (205 Reset Content / 200 OK):** `{"message": "Successfully logged out."}`

---

## Profile Management

### 5. Get My Profile
Retrieves full profile info of the currently authenticated user.
* **URL:** `user/profile/`
* **Method:** `GET`
* **Auth Required:** **Yes**
* **Success Response (200 OK):**
  ```json
  {
      "id": 1,
      "first_name": "Name",
      "location": "Kyiv",
      "gender": "Male",
      "looking_for": "Female",
      "intention": "Serious relationships",
      "avatar": "http://.../media/users/user_1/avatar/pic.jpg",
      "additional_info": { "birth_date": "2000-01-01", "bio": "" },
      "interests": ["Sport", "Music"]
  }
  ```
  
### 5.1. Update My Profile
Updates basic profile info and additional info (height, bio, etc.). You can send partial data using `PATCH`.
* **URL:** `user/profile/`
* **Method:** `PATCH` / `PUT`
* **Auth Required:** **Yes**
* **Request Body (JSON):** Flat structure (no nested objects required). Coordinates will be automatically converted to a GeoDjango `Point`.
  ```json
  {
      "first_name": "New Name",
      "bio": "Updated bio text",
      "height": 185,
      "weight": 80,
      "latitude": 50.4501,
      "longitude": 30.5234,
      "intention_id": 2
  }
  ```
* **Success Response (200 OK):** Returns the updated profile object.

### 5.2. Sync Interests
Completely replaces the user's current interests with the provided list.
* **URL:** `user/profile/interests/`
* **Method:** `PATCH` / `PUT`
* **Auth Required:** **Yes**
* **Request Body (JSON):** Must contain between 2 and 100 unique interest IDs.
  ```json
  {
      "interest_ids": [2, 5, 12, 18]
  }
  ```
* **Success Response (200 OK):** Returns the updated profile object with the new interests list.


### 6. Manage Avatar
Upload, replace, or delete the profile avatar.
* **URL:** `user/profile/avatar/`
* **Auth Required:** **Yes**
* **Methods:**
  * `PUT` / `POST` (Content-Type: `multipart/form-data`): Send `avatar: [file]` to upload/replace. Returns `200 OK`.
  * `DELETE`: Deletes the current avatar (sets to null). Returns `200 OK`.

### 7. Manage Gallery (Photos)
Manage the profile's photo gallery (limit: 2 to 4 photos).
* **URL:** `user/profile/gallery/`
* **Auth Required:** **Yes**
* **Methods:**
  * `GET`: Retrieves list of photos.
    ```json
    [ {"id": 15, "photo": "http://.../media/.../img1.jpg"} ]
    ```
  * `POST` (Content-Type: `multipart/form-data`): Send `photos: [file]` to add photos. Enforces max limit (4).

### 8. Delete Gallery Photo
Delete a specific photo by its ID. Enforces min limit (2).
* **URL:** `user/profile/gallery/<id>/`
* **Method:** `DELETE`
* **Auth Required:** **Yes**
* **Success Response (200 OK):** `{"message": "Photo successfully deleted."}`

### 9. Manage Search Settings
View or update the matching filters (distance and age range).
* **URL:** `user/settings/`
* **Auth Required:** **Yes**
* **Methods:**
  * **`GET` (Retrieve Settings):**
    Returns the settings in a frontend-friendly format.
    ```json
    {
        "search_distance": 50,
        "age_range": {
            "min": 18,
            "max": 50
        }
    }
    ```
  * **`PATCH` / `PUT` (Update Settings):**
    Send `min_age` and `max_age` as separate integers. The backend will automatically validate and convert them to a database range.
    ```json
    {
        "search_distance": 25,
        "min_age": 20,
        "max_age": 35
    }
    ```
* **Success Response (200 OK):** Returns the updated settings.


---

## Directories (For Registration Forms)

### 9. Get Genders
* **URL:** `user/genders/`
* **Method:** `GET`
* **Success Response:** `[ {"id": 1, "name": "Male"} ]`

### 10. Get Intentions
* **URL:** `user/intentions/`
* **Method:** `GET`
* **Success Response:** `[ {"id": 1, "name": "Serious relationships"} ]`

### 11. Get Interests (Paginated)
* **URL:** `user/interests/`
* **Method:** `GET`
* **Query Params:** `?page=1&page_size=50`
* **Success Response:** `{"count": 150, "next": "...", "previous": null, "results": [ {"id": 1, "name": "Sport"} ]}`