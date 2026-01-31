# Photo Order (Webshop) - Backend API Specifikáció

> Laravel backend API végpontok a fénykép rendelés webshop-hoz

---

## 📋 Áttekintés

### Cart API
| Method | Endpoint | Leírás |
|--------|----------|--------|
| POST | `/api/cart/init` | Kosár létrehozása/visszatöltése |
| GET | `/api/cart/{id}` | Kosár lekérése |
| POST | `/api/cart/{id}/items` | Tétel hozzáadása |
| PATCH | `/api/cart/items/{itemId}` | Tétel módosítása |
| DELETE | `/api/cart/items/{itemId}` | Tétel törlése |
| DELETE | `/api/cart/{id}/items` | Kosár kiürítése |
| POST | `/api/cart/{id}/coupon/validate` | Kupon ellenőrzése |
| POST | `/api/cart/{id}/coupon` | Kupon alkalmazása |
| DELETE | `/api/cart/{id}/coupon` | Kupon eltávolítása |
| GET | `/api/cart/{id}/summary` | Összesítő lekérése |

### Checkout API
| Method | Endpoint | Leírás |
|--------|----------|--------|
| GET | `/api/checkout/options` | Szállítási/fizetési módok |
| POST | `/api/checkout/place-order` | Rendelés leadása |
| GET | `/api/checkout/payment-callback` | Fizetési callback |

### Orders API
| Method | Endpoint | Leírás |
|--------|----------|--------|
| GET | `/api/orders` | Rendelés lista |
| GET | `/api/orders/{id}` | Rendelés részletek |
| GET | `/api/orders/{id}/invoice` | Számla letöltése |

---

## 🔐 Autentikáció

A webshop **opcionális** autentikációval működik:
- Guest user-ek: `session_token` a kosárhoz
- Bejelentkezett user-ek: Bearer token + user_id

```
Header: Authorization: Bearer {token}  (opcionális)
Header: X-Cart-Session: {session_token}  (guest-eknek)
```

---

## 📝 Cart API Részletek

### 1. Kosár Inicializálás

**Endpoint**: `POST /api/cart/init`

**Request Body**:
```json
{
  "work_session_id": 123,
  "session_token": "abc123..."  // Opcionális, meglévő session folytatása
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cart": {
      "id": 456,
      "user_id": null,
      "work_session_id": 123,
      "package_id": null,
      "coupon_id": null,
      "coupon_discount": 0,
      "status": "active",
      "session_token": "abc123def456...",
      "expires_at": "2024-01-22T10:00:00Z"
    },
    "items": [],
    "photos": [
      {
        "id": 1,
        "album_id": 10,
        "filename": "IMG_0001.jpg",
        "thumbnail_url": "https://cdn.example.com/thumbs/1.jpg",
        "preview_url": "https://cdn.example.com/preview/1.jpg"
      }
    ],
    "printSizes": [
      {
        "id": 1,
        "name": "10x15",
        "width_mm": 100,
        "height_mm": 150,
        "price": 290,
        "weight_grams": 15
      },
      {
        "id": 2,
        "name": "13x18",
        "width_mm": 130,
        "height_mm": 180,
        "price": 390,
        "weight_grams": 20
      }
    ],
    "pricingMode": "pricelist",
    "package": null
  }
}
```

**Response with Package Mode** (200 OK):
```json
{
  "success": true,
  "data": {
    "cart": { ... },
    "items": [],
    "photos": [ ... ],
    "printSizes": [ ... ],
    "pricingMode": "package",
    "package": {
      "id": 5,
      "name": "Tablócsomag - 10 kép",
      "price": 4990,
      "max_photos": 10,
      "description": "Válassz 10 képet egy fix áron!"
    }
  }
}
```

**Backend Logic**:
```php
// CartController.php
public function init(Request $request)
{
    $validated = $request->validate([
        'work_session_id' => 'required|exists:work_sessions,id',
        'session_token' => 'nullable|string|size:64'
    ]);

    $workSession = WorkSession::findOrFail($validated['work_session_id']);

    // Try to restore existing cart
    if ($validated['session_token']) {
        $cart = Cart::where('session_token', $validated['session_token'])
            ->where('status', 'active')
            ->where('expires_at', '>', now())
            ->first();
    }

    // Create new cart if not found
    if (!isset($cart)) {
        $cart = Cart::create([
            'user_id' => auth()->id(),
            'work_session_id' => $workSession->id,
            'package_id' => $workSession->active_package_id,
            'status' => 'active',
            'session_token' => Str::random(64),
            'expires_at' => now()->addDays(7)
        ]);
    }

    // Determine pricing mode
    $pricingMode = $cart->package_id ? 'package' : 'pricelist';
    $package = $cart->package_id ? Package::find($cart->package_id) : null;

    return response()->json([
        'success' => true,
        'data' => [
            'cart' => new CartResource($cart),
            'items' => CartItemResource::collection($cart->items),
            'photos' => PhotoResource::collection($workSession->album->photos),
            'printSizes' => PrintSizeResource::collection(PrintSize::all()),
            'pricingMode' => $pricingMode,
            'package' => $package ? new PackageResource($package) : null
        ]
    ]);
}
```

---

### 2. Tétel Hozzáadása

**Endpoint**: `POST /api/cart/{cartId}/items`

**Request Body**:
```json
{
  "photo_id": 5,
  "print_size_id": 2,
  "qty": 2
}
```

**Validáció**:
- `photo_id` kötelező, létező photo a session-ben
- `print_size_id` kötelező, létező print size
- `qty` kötelező, min: 1, max: 99
- Package mode: unique photo count <= max_photos

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "item": {
      "id": 789,
      "cart_id": 456,
      "photo_id": 5,
      "print_size_id": 2,
      "qty": 2,
      "type": "print"
    },
    "cart_summary": {
      "item_count": 3,
      "unique_photo_count": 2,
      "subtotal": 1070,
      "discount": 0,
      "total": 1070
    }
  }
}
```

**Response** (422 - Package limit exceeded):
```json
{
  "success": false,
  "error": {
    "code": "PACKAGE_LIMIT_EXCEEDED",
    "message": "Elérted a csomag maximumát (10 kép).",
    "max_photos": 10,
    "current_photos": 10
  }
}
```

**Backend Logic**:
```php
public function addItem(Request $request, int $cartId)
{
    $cart = Cart::findOrFail($cartId);
    $this->authorize('update', $cart);

    $validated = $request->validate([
        'photo_id' => [
            'required',
            Rule::exists('photos', 'id')->where('album_id', $cart->workSession->album_id)
        ],
        'print_size_id' => 'required|exists:print_sizes,id',
        'qty' => 'required|integer|min:1|max:99'
    ]);

    // Package mode: check photo limit
    if ($cart->package_id) {
        $package = $cart->package;
        $currentUniquePhotos = $cart->items->pluck('photo_id')->unique()->count();
        $isNewPhoto = !$cart->items->contains('photo_id', $validated['photo_id']);

        if ($isNewPhoto && $currentUniquePhotos >= $package->max_photos) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'PACKAGE_LIMIT_EXCEEDED',
                    'message' => "Elérted a csomag maximumát ({$package->max_photos} kép).",
                    'max_photos' => $package->max_photos,
                    'current_photos' => $currentUniquePhotos
                ]
            ], 422);
        }
    }

    // Upsert: if same photo + size exists, update qty
    $existingItem = $cart->items()
        ->where('photo_id', $validated['photo_id'])
        ->where('print_size_id', $validated['print_size_id'])
        ->first();

    if ($existingItem) {
        $existingItem->update([
            'qty' => $existingItem->qty + $validated['qty']
        ]);
        $item = $existingItem->fresh();
    } else {
        $item = $cart->items()->create([
            'photo_id' => $validated['photo_id'],
            'print_size_id' => $validated['print_size_id'],
            'qty' => $validated['qty'],
            'type' => 'print'
        ]);
    }

    return response()->json([
        'success' => true,
        'data' => [
            'item' => new CartItemResource($item),
            'cart_summary' => $this->buildCartSummary($cart->fresh())
        ]
    ]);
}
```

---

### 3. Tétel Módosítása

**Endpoint**: `PATCH /api/cart/items/{itemId}`

**Request Body**:
```json
{
  "qty": 5
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "item": {
      "id": 789,
      "qty": 5
    }
  }
}
```

---

### 4. Tétel Törlése

**Endpoint**: `DELETE /api/cart/items/{itemId}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": null
}
```

---

### 5. Kupon Validálás

**Endpoint**: `POST /api/cart/{cartId}/coupon/validate`

**Request Body**:
```json
{
  "code": "NYAR2024"
}
```

**Response** (200 OK - Valid):
```json
{
  "success": true,
  "data": {
    "valid": true,
    "type": "percentage",
    "value": 15,
    "message": "15% kedvezmény alkalmazva!",
    "restrictions": {
      "min_order_value": 3000,
      "valid_until": "2024-08-31"
    }
  }
}
```

**Response** (200 OK - Invalid):
```json
{
  "success": true,
  "data": {
    "valid": false,
    "error": "A kupon lejárt vagy nem létezik."
  }
}
```

**Response** (200 OK - Min order not met):
```json
{
  "success": true,
  "data": {
    "valid": false,
    "error": "A kupon minimum 5000 Ft rendelési értéktől érvényes.",
    "min_order_value": 5000,
    "current_order_value": 3500
  }
}
```

**Backend Logic**:
```php
public function validateCoupon(Request $request, int $cartId)
{
    $cart = Cart::findOrFail($cartId);

    $validated = $request->validate([
        'code' => 'required|string|max:32'
    ]);

    $coupon = Coupon::where('code', strtoupper($validated['code']))
        ->where('is_active', true)
        ->first();

    // Not found or inactive
    if (!$coupon) {
        return response()->json([
            'success' => true,
            'data' => [
                'valid' => false,
                'error' => 'A kupon lejárt vagy nem létezik.'
            ]
        ]);
    }

    // Check expiry
    if ($coupon->valid_until && $coupon->valid_until < now()) {
        return response()->json([
            'success' => true,
            'data' => [
                'valid' => false,
                'error' => 'A kupon lejárt.'
            ]
        ]);
    }

    // Check usage limit
    if ($coupon->max_uses && $coupon->used_count >= $coupon->max_uses) {
        return response()->json([
            'success' => true,
            'data' => [
                'valid' => false,
                'error' => 'A kupon kerete elfogyott.'
            ]
        ]);
    }

    // Check minimum order value
    $cartTotal = $this->calculateCartTotal($cart);
    if ($coupon->min_order_value && $cartTotal < $coupon->min_order_value) {
        return response()->json([
            'success' => true,
            'data' => [
                'valid' => false,
                'error' => "A kupon minimum {$coupon->min_order_value} Ft rendelési értéktől érvényes.",
                'min_order_value' => $coupon->min_order_value,
                'current_order_value' => $cartTotal
            ]
        ]);
    }

    return response()->json([
        'success' => true,
        'data' => [
            'valid' => true,
            'type' => $coupon->type, // 'percentage' or 'fixed'
            'value' => $coupon->value,
            'message' => $this->formatCouponMessage($coupon),
            'restrictions' => [
                'min_order_value' => $coupon->min_order_value,
                'valid_until' => $coupon->valid_until?->toDateString()
            ]
        ]
    ]);
}
```

---

### 6. Kosár Összesítő

**Endpoint**: `GET /api/cart/{cartId}/summary`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "item_count": 5,
    "unique_photo_count": 3,
    "subtotal": 2450,
    "discount": 367,
    "discount_label": "15% kupon (NYAR2024)",
    "total": 2083
  }
}
```

---

## 📝 Checkout API Részletek

### 1. Checkout Opciók

**Endpoint**: `GET /api/checkout/options`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "shippingMethods": [
      {
        "id": 1,
        "name": "Házhoz szállítás",
        "type": "home",
        "price": 1290,
        "delivery_days": "2-3 munkanap",
        "description": "GLS futárszolgálattal"
      },
      {
        "id": 2,
        "name": "Foxpost automata",
        "type": "foxpost",
        "price": 890,
        "delivery_days": "1-2 munkanap",
        "description": "Válassz automatát a térképen"
      },
      {
        "id": 3,
        "name": "Személyes átvétel",
        "type": "pickup",
        "price": 0,
        "delivery_days": "Egyeztetés szerint",
        "description": "A fotós stúdiójában"
      }
    ],
    "paymentMethods": [
      {
        "id": 1,
        "name": "Bankkártya",
        "type": "card",
        "fee": 0,
        "description": "SimplePay biztonságos fizetés"
      },
      {
        "id": 2,
        "name": "Utánvét",
        "type": "cod",
        "fee": 490,
        "description": "+490 Ft kezelési díj"
      },
      {
        "id": 3,
        "name": "Átutalás",
        "type": "transfer",
        "fee": 0,
        "description": "Előre utalással, 48h-n belül"
      }
    ]
  }
}
```

---

### 2. Rendelés Leadása

**Endpoint**: `POST /api/checkout/place-order`

**Request Body**:
```json
{
  "cart_id": 456,
  "guest_email": "guest@example.com",
  "shipping_method_id": 1,
  "payment_method_id": 1,
  "shipping_address": {
    "name": "Kovács Anna",
    "phone": "+36301234567",
    "zip": "1111",
    "city": "Budapest",
    "address": "Fő utca 1. 2/3",
    "note": "Kapucsengő: 23"
  },
  "package_point_id": null,
  "coupon_code": "NYAR2024",
  "accept_terms": true
}
```

**Validáció**:
- `cart_id` kötelező, active cart
- `guest_email` kötelező ha nincs auth
- `shipping_method_id` kötelező, létező method
- `payment_method_id` kötelező, létező method
- `shipping_address` kötelező home delivery-nél
- `package_point_id` kötelező foxpost-nál
- `accept_terms` kötelező, true

**Response** (200 OK - Card Payment):
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1001,
      "order_number": "TB-2024-001001",
      "status": "pending",
      "subtotal": 2450,
      "discount": 367,
      "shipping": 1290,
      "total": 3373,
      "created_at": "2024-01-15T14:30:00Z"
    },
    "payment_url": "https://sandbox.simplepay.hu/pay/...",
    "payment_timeout": 1200
  }
}
```

**Response** (200 OK - COD/Transfer):
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1001,
      "order_number": "TB-2024-001001",
      "status": "confirmed",
      "total": 3373
    },
    "payment_url": null,
    "message": "Köszönjük a rendelésed! Hamarosan felvesszük veled a kapcsolatot."
  }
}
```

**Backend Logic**:
```php
public function placeOrder(Request $request)
{
    $validated = $request->validate([
        'cart_id' => 'required|exists:carts,id',
        'guest_email' => 'required_without:user|email',
        'shipping_method_id' => 'required|exists:shipping_methods,id',
        'payment_method_id' => 'required|exists:payment_methods,id',
        'shipping_address' => 'required_if:shipping_type,home|array',
        'shipping_address.name' => 'required_with:shipping_address|string|max:100',
        'shipping_address.zip' => 'required_with:shipping_address|string|size:4',
        'shipping_address.city' => 'required_with:shipping_address|string|max:100',
        'shipping_address.address' => 'required_with:shipping_address|string|max:200',
        'package_point_id' => 'required_if:shipping_type,foxpost|string',
        'coupon_code' => 'nullable|string',
        'accept_terms' => 'required|accepted'
    ]);

    $cart = Cart::with(['items.photo', 'items.printSize'])->findOrFail($validated['cart_id']);

    // Verify cart is not empty
    if ($cart->items->isEmpty()) {
        return $this->errorResponse('EMPTY_CART', 'A kosár üres.');
    }

    // Verify stock (if applicable)
    // ...

    DB::beginTransaction();
    try {
        // Calculate totals
        $shippingMethod = ShippingMethod::find($validated['shipping_method_id']);
        $paymentMethod = PaymentMethod::find($validated['payment_method_id']);

        $subtotal = $this->calculateSubtotal($cart);
        $discount = $this->calculateDiscount($cart, $validated['coupon_code'] ?? null);
        $shipping = $shippingMethod->price;
        $codFee = $paymentMethod->type === 'cod' ? ($paymentMethod->fee ?? 0) : 0;
        $total = $subtotal - $discount + $shipping + $codFee;

        // Create order
        $order = Order::create([
            'order_number' => $this->generateOrderNumber(),
            'user_id' => auth()->id(),
            'guest_email' => $validated['guest_email'] ?? null,
            'cart_id' => $cart->id,
            'shipping_method_id' => $shippingMethod->id,
            'payment_method_id' => $paymentMethod->id,
            'shipping_address' => $validated['shipping_address'] ?? null,
            'package_point_id' => $validated['package_point_id'] ?? null,
            'subtotal' => $subtotal,
            'discount' => $discount,
            'shipping' => $shipping,
            'cod_fee' => $codFee,
            'total' => $total,
            'status' => 'pending',
            'coupon_code' => $validated['coupon_code'] ?? null
        ]);

        // Copy cart items to order items
        foreach ($cart->items as $cartItem) {
            $order->items()->create([
                'photo_id' => $cartItem->photo_id,
                'print_size_id' => $cartItem->print_size_id,
                'qty' => $cartItem->qty,
                'unit_price' => $cartItem->printSize->price,
                'line_total' => $cartItem->printSize->price * $cartItem->qty
            ]);
        }

        // Mark cart as converted
        $cart->update(['status' => 'converted']);

        // Increment coupon usage
        if ($validated['coupon_code']) {
            Coupon::where('code', $validated['coupon_code'])->increment('used_count');
        }

        DB::commit();

        // Handle payment
        if ($paymentMethod->type === 'card') {
            $paymentUrl = $this->initiateSimplePay($order);
            return response()->json([
                'success' => true,
                'data' => [
                    'order' => new OrderResource($order),
                    'payment_url' => $paymentUrl,
                    'payment_timeout' => 1200
                ]
            ]);
        }

        // COD or Transfer - confirm immediately
        $order->update(['status' => 'confirmed']);

        // Send confirmation email
        $this->sendOrderConfirmation($order);

        // Notify photographer
        $order->workSession->photographer->notify(new NewOrderNotification($order));

        return response()->json([
            'success' => true,
            'data' => [
                'order' => new OrderResource($order),
                'payment_url' => null,
                'message' => 'Köszönjük a rendelésed!'
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Order placement failed', ['error' => $e->getMessage()]);
        throw $e;
    }
}
```

---

### 3. Payment Callback

**Endpoint**: `GET /api/checkout/payment-callback`

**Query Params** (from SimplePay):
```
?r=BASE64_ENCODED_RESPONSE&s=SIGNATURE
```

**Backend Logic**:
```php
public function paymentCallback(Request $request)
{
    $response = json_decode(base64_decode($request->get('r')), true);
    $signature = $request->get('s');

    // Verify signature
    if (!$this->verifySimplePaySignature($response, $signature)) {
        Log::warning('Invalid SimplePay signature', $response);
        return redirect('/checkout/cancel?error=invalid_signature');
    }

    $order = Order::where('order_number', $response['orderRef'])->first();

    if (!$order) {
        return redirect('/checkout/cancel?error=order_not_found');
    }

    if ($response['e'] === 'SUCCESS') {
        $order->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_transaction_id' => $response['t']
        ]);

        // Send confirmation
        $this->sendOrderConfirmation($order);

        // Notify photographer
        $order->workSession->photographer->notify(new NewOrderNotification($order));

        return redirect("/checkout/success?orderId={$order->id}");
    }

    // Payment failed
    $order->update([
        'status' => 'payment_failed',
        'payment_error' => $response['e']
    ]);

    return redirect("/checkout/cancel?orderId={$order->id}&error={$response['e']}");
}
```

---

## 🗃️ Database Schema

### carts tábla

```sql
CREATE TABLE carts (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    work_session_id BIGINT UNSIGNED NOT NULL,
    package_id BIGINT UNSIGNED NULL,
    coupon_id BIGINT UNSIGNED NULL,
    coupon_discount DECIMAL(10,2) DEFAULT 0,
    status ENUM('active', 'abandoned', 'converted') DEFAULT 'active',
    session_token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (work_session_id) REFERENCES work_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,

    INDEX idx_session_token (session_token),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
);
```

### cart_items tábla

```sql
CREATE TABLE cart_items (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    cart_id BIGINT UNSIGNED NOT NULL,
    photo_id BIGINT UNSIGNED NOT NULL,
    print_size_id BIGINT UNSIGNED NOT NULL,
    qty INT UNSIGNED NOT NULL DEFAULT 1,
    type ENUM('print', 'digital') DEFAULT 'print',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (print_size_id) REFERENCES print_sizes(id) ON DELETE CASCADE,

    UNIQUE INDEX idx_cart_photo_size (cart_id, photo_id, print_size_id)
);
```

### orders tábla

```sql
CREATE TABLE orders (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(32) UNIQUE NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    guest_email VARCHAR(255) NULL,
    cart_id BIGINT UNSIGNED NOT NULL,
    shipping_method_id BIGINT UNSIGNED NOT NULL,
    payment_method_id BIGINT UNSIGNED NOT NULL,
    shipping_address JSON NULL,
    package_point_id VARCHAR(64) NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    shipping DECIMAL(10,2) NOT NULL,
    cod_fee DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'payment_failed') DEFAULT 'pending',
    coupon_code VARCHAR(32) NULL,
    payment_transaction_id VARCHAR(100) NULL,
    paid_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    tracking_number VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (cart_id) REFERENCES carts(id),
    FOREIGN KEY (shipping_method_id) REFERENCES shipping_methods(id),
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),

    INDEX idx_order_number (order_number),
    INDEX idx_user (user_id),
    INDEX idx_guest_email (guest_email),
    INDEX idx_status (status)
);
```

### order_items tábla

```sql
CREATE TABLE order_items (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT UNSIGNED NOT NULL,
    photo_id BIGINT UNSIGNED NOT NULL,
    print_size_id BIGINT UNSIGNED NOT NULL,
    qty INT UNSIGNED NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id),
    FOREIGN KEY (print_size_id) REFERENCES print_sizes(id)
);
```

### coupons tábla

```sql
CREATE TABLE coupons (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(32) UNIQUE NOT NULL,
    type ENUM('percentage', 'fixed') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) NULL,
    max_uses INT UNSIGNED NULL,
    used_count INT UNSIGNED DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP NULL,
    valid_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_code (code),
    INDEX idx_active (is_active)
);
```

---

## 🔔 Events & Notifications

### Order Events

```php
// app/Events/OrderPlaced.php
class OrderPlaced
{
    public function __construct(public Order $order) {}
}

// app/Events/OrderPaid.php
class OrderPaid
{
    public function __construct(public Order $order) {}
}

// app/Events/OrderShipped.php
class OrderShipped
{
    public function __construct(
        public Order $order,
        public string $trackingNumber
    ) {}
}
```

### Notifications

```php
// app/Notifications/OrderConfirmation.php
class OrderConfirmation extends Notification
{
    use Queueable;

    public function __construct(public Order $order) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Rendelés visszaigazolás - {$this->order->order_number}")
            ->markdown('emails.orders.confirmation', [
                'order' => $this->order
            ]);
    }
}
```

---

## 🔄 Cart Abandonment

### Scheduled Job

```php
// app/Console/Commands/ProcessAbandonedCarts.php
class ProcessAbandonedCarts extends Command
{
    protected $signature = 'carts:process-abandoned';

    public function handle()
    {
        // Mark expired carts as abandoned
        Cart::where('status', 'active')
            ->where('expires_at', '<', now())
            ->update(['status' => 'abandoned']);

        // Send recovery emails (1 hour after abandonment)
        $abandonedCarts = Cart::where('status', 'abandoned')
            ->whereNotNull('user_id')
            ->where('updated_at', '<', now()->subHour())
            ->whereNull('recovery_email_sent_at')
            ->with('user', 'items')
            ->get();

        foreach ($abandonedCarts as $cart) {
            if ($cart->items->isNotEmpty()) {
                $cart->user->notify(new CartAbandonmentReminder($cart));
                $cart->update(['recovery_email_sent_at' => now()]);
            }
        }

        $this->info("Processed {$abandonedCarts->count()} abandoned carts.");
    }
}
```

---

## 🚀 Deployment Checklist

- [ ] Migration futtatva (carts, cart_items, orders, order_items, coupons)
- [ ] Shipping methods seed
- [ ] Payment methods seed
- [ ] Print sizes seed
- [ ] SimplePay credentials (.env)
- [ ] Routes regisztrálva
- [ ] Rate limiting (cart: 100/perc, checkout: 10/perc)
- [ ] CORS engedélyezve
- [ ] Queue worker fut
- [ ] Abandoned cart cron beállítva
- [ ] Email templates létrehozva
