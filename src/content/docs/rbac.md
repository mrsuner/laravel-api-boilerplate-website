---
title: Roles & Permissions
description: Config-seeded RBAC via Laratrust with default-role assignment.
section: API Surface
order: 3
---

# Roles & Permissions (RBAC)

Role-based access control via [Laratrust](https://laratrust.santigarcor.me/)
v8. Defaults are seeded from `config/boilerplate.php`, new users are
auto-assigned a role on registration, and the standard `role:` /
`permission:` middleware integrate with the [JSON error envelope](/docs/api-responses).

## Out of the box

| | |
|---|---|
| Roles | `admin`, `user` |
| Default role on register | `user` |
| Permissions | `users.read`, `users.write`, `roles.read`, `roles.write` |
| `admin` | all permissions (`*`) |
| `user` | none |

These are starting points — edit config for your domain.

## Configuration

```php
'rbac' => [
    'enabled' => env('RBAC_ENABLED', true),
    'default_role' => env('RBAC_DEFAULT_ROLE', 'user'),

    'permissions' => [
        ['name' => 'users.read',  'display_name' => 'View Users'],
        ['name' => 'users.write', 'display_name' => 'Manage Users'],
    ],
    'roles' => [
        ['name' => 'admin', 'display_name' => 'Administrator', 'permissions' => ['*']],
        ['name' => 'user',  'display_name' => 'User',          'permissions' => []],
    ],
],
```

| Key | Effect |
|---|---|
| `enabled = false` | Seeder is a no-op; registration doesn't auto-assign. |
| `default_role = null` | Disable auto-assignment without disabling RBAC. |
| `roles[].permissions` | List of permission names; `['*']` grants all. |

## Seeder

`RolesAndPermissionsSeeder` upserts roles & permissions and syncs each
role's list. Idempotent — safe on every deploy, and run by
`migrate --seed`.

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

## Route middleware

```php
// Single role
Route::middleware(['auth:sanctum', 'role:admin'])->get('/admin/users', ...);

// Single permission
Route::middleware(['auth:sanctum', 'permission:users.write'])->post('/users', ...);

// Any of multiple roles (OR)
Route::middleware(['auth:sanctum', 'role:admin|editor'])->get('/dashboard', ...);

// All of multiple permissions (AND)
Route::middleware(['auth:sanctum', 'permission:users.read|users.write|require_all'])->put('/users/{id}', ...);
```

A failed check raises `HttpException(403)`, rendered as the standard JSON
envelope:

```json
{ "message": "User does not have any of the necessary access rights." }
```

## Programmatic checks

```php
$user->hasRole('admin');
$user->hasRole('admin|editor');           // any (OR)
$user->isAbleTo('users.write');           // permission via role or direct
$user->addRole('admin');
$user->syncRoles(['user', 'editor']);
$user->givePermission('users.write');     // direct grant (bypasses roles)
```

## Default-role assignment

On register / first OTP / social signup, the `Registered` event triggers
the `AssignDefaultRole` listener. It runs **synchronously** (so the role is
attached before the response returns) and only acts when RBAC is enabled,
`default_role` is set, and the role exists. A missing role logs a warning
and is skipped — registration still succeeds.

## Caching

Laratrust caches lookups when `LARATRUST_ENABLE_CACHE=true` (default in
production). After mutating roles/permissions in production, call
`$user->flushCache()`.
