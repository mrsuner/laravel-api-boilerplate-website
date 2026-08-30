---
title: Redeeming & Reacting
description: Provide your own redeem endpoint and apply effects via the CouponRedeemed event.
section: Usage
order: 2
---

# Redeeming & reacting to redemptions

The package ships **no** user-facing redeem endpoint and **no** default
listener. You own both ends: a controller that calls `redeem()`, and a
listener that applies the effect.

## Provide a redeem endpoint

```php
// routes/api.php
Route::post('/redeem-coupon', RedeemCouponController::class)
    ->middleware('auth:sanctum');
```

```php
// app/Http/Controllers/RedeemCouponController.php
use Mrsuner\Coupon\Services\CouponService;

public function __invoke(Request $request, CouponService $coupons): JsonResponse
{
    $request->validate(['code' => ['required', 'string']]);

    $result = $coupons->validate($request->code, $request->user());

    if (! $result->valid) {
        return response()->json(['message' => __('coupon.'.$result->error)], 422);
    }

    $redemption = $coupons->redeem($request->code, $request->user(), [
        'ip' => $request->ip(),
    ]);

    return response()->json([
        'message'    => 'Coupon applied.',
        'redemption' => $redemption->id,
    ]);
}
```

Validating before redeeming lets you return a precise error to the client
before any write happens.

## Listen for CouponRedeemed

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Support\Facades\Event;
use Mrsuner\Coupon\Events\CouponRedeemed;
use App\Listeners\ApplyCouponEffect;

public function boot(): void
{
    Event::listen(CouponRedeemed::class, ApplyCouponEffect::class);
}
```

The event carries everything you need:

```php
final class CouponRedeemed
{
    public function __construct(
        public readonly CouponCode $coupon,
        public readonly Model $redeemable,        // e.g. App\Models\User
        public readonly CouponRedemption $redemption,
    ) {}
}
```

## Apply the effect (Stripe Cashier example)

The package never touches your billing stack — your listener decides what a
coupon `type` means.

```php
// app/Listeners/ApplyCouponEffect.php
public function handle(CouponRedeemed $event): void
{
    $type  = $event->coupon->type;
    $value = $event->coupon->value;
    $user  = $event->redeemable;

    match ($type) {
        'percent_off' => $this->applyStripePromo($user, $value),
        'free_months' => $this->extendTrial($user, $value['months']),
        'amount_off'  => $this->applyCredit($user, $value['amount']),
        default       => Log::info('Unhandled coupon type', ['type' => $type]),
    };

    // Emit a host-side audit entry with billing context.
    audit_log('coupon.redeemed', $event->coupon, [
        'user'     => $user,
        'metadata' => ['redemption_id' => $event->redemption->id, 'type' => $type],
    ]);
}

private function applyStripePromo(User $user, array $value): void
{
    $promoId = $value['stripe_promo_code_id'] ?? null;

    if ($promoId && $user->subscribed('default')) {
        $user->subscription('default')
            ->updateStripeSubscription(['promotion_code' => $promoId]);
    }
}

private function extendTrial(User $user, int $months): void
{
    if ($user->onTrial()) {
        $user->subscription('default')->extendTrial(now()->addMonths($months));
    }
}
```

> Emitting `coupon.redeemed` from **your** listener (rather than the package)
> is deliberate: only your application knows the billing context — subscription
> id, order id — worth recording in the [audit log](../../../docs/audit).
