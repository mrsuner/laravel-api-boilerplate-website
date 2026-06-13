---
title: API Responses & Errors
description: One JSON envelope for intentional responses and thrown exceptions.
section: API Surface
order: 1
---

# API Responses & Errors

The boilerplate ships a base `Controller` with reusable JSON response
helpers and a **global exception renderer** that converts framework
exceptions into the same envelope — so thrown errors and intentional
responses share one schema.

## Why

- Every endpoint speaks the same JSON dialect, whether it returned data or
  threw a `ModelNotFoundException`.
- Defaults are configurable; any project can tweak wording, disable
  defaults, or add i18n without touching code.
- Messages run through Laravel's translator (`__()`), so adding a
  `lang/<locale>/...` file is enough to localise.

## The envelope

**Success**

```json
{ "message": "Resource created.", "data": { "...": "..." } }
```

**Error**

```json
{ "message": "Resource not found.", "errors": { "email": ["already taken"] } }
```

**Pagination**

```json
{
  "data": [ "..." ],
  "meta": { "current_page": 1, "last_page": 5, "per_page": 15, "total": 75 },
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." }
}
```

## Helpers

The base `App\Http\Controllers\Controller` exposes:

**Success** — `respondOk`, `respondCreated`, `respondAccepted`,
`respondNoContent`, `respondPaginated(LengthAwarePaginator)`.

**Error** — `respondBadRequest`, `respondUnauthorized`, `respondForbidden`,
`respondNotFound`, `respondMethodNotAllowed`, `respondConflict`,
`respondUnprocessable(array $errors)`, `respondTooManyRequests`,
`respondServerError`, and `respondError($code, …)` for runtime codes.

```php
class UsersController extends Controller
{
    public function show(int $id): JsonResponse
    {
        $user = User::find($id);
        return $user ? $this->respondOk($user) : $this->respondNotFound();
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        return $this->respondCreated(User::create($request->validated()));
    }

    public function index(): JsonResponse
    {
        return $this->respondPaginated(User::paginate());
    }
}
```

## Global exception handler

`ApiExceptionRenderer` (wired in `bootstrap/app.php`) runs only for
`/api/*` requests or those expecting JSON. It maps:

| Exception | Status |
|---|---|
| `AuthenticationException` | 401 |
| `AuthorizationException` | 403 |
| `ModelNotFoundException` | 404 (never leaks `[App\Models\User] 99`) |
| `MethodNotAllowedHttpException` | 405 |
| `ValidationException` | 422 (`{message, errors}`) |
| Throttle exceptions | 429 (sets `Retry-After`) |
| Any other `Throwable` | 500 (debug block when `API_EXPOSE_DEBUG=true`) |

`abort(403, 'Custom reason.')` keeps the custom message; `abort(404)` falls
back to the configured default.

## Configuration

```php
'responses' => [
    'use_defaults' => true,
    'default_messages' => [
        'ok' => 'Success.',
        'created' => 'Resource created.',
        'not_found' => 'Resource not found.',
        'unprocessable' => 'The given data was invalid.',
        // ...
    ],
],

'exceptions' => [
    'render_for_api' => true,
    'expose_debug_in_response' => env('API_EXPOSE_DEBUG', false),
],
```

## Localisation

Default messages pass through `__()`, with the English string as the key.
Drop a `lang/<locale>/...` file with matching keys, or switch
`default_messages` to namespaced keys (`messages.not_found`) and provide
the translation file.
