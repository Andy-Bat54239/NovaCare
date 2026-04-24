# NovaCare Management System — Backend Documentation

A complete reference for the `NovaCare.API` project. Every major code block is annotated line-by-line so that a developer unfamiliar with ASP.NET Core or Entity Framework can understand each decision.

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | .NET 10 | Cross-platform host that executes the compiled C# code |
| Framework | ASP.NET Core 10 Web API | HTTP routing, controller dispatch, DI container, middleware pipeline |
| ORM | Entity Framework Core 10 | Converts C# classes ↔ SQL tables; generates and runs migrations |
| Database | SQL Server (remote, port 1433) | Persistent relational storage |
| Auth | JWT Bearer (`JwtBearer` 10.0.5) | Stateless token-based auth; no sessions/cookies |
| Password hashing | `BCrypt.Net-Next` 4.1.0 | Adaptive one-way hashing — the work factor (`$2a$11$`) makes brute-force expensive |
| API docs | Swashbuckle 6.9.0 | Generates OpenAPI spec + Swagger UI at `/swagger` in Development |
| Serialization | `System.Text.Json` | Built-in JSON library; configured to suppress null fields and break reference cycles |
| File serving | `app.UseStaticFiles()` | Serves uploaded files from `wwwroot/` as plain HTTP GETs |
| Language | C# 12 | Primary constructors, file-scoped namespaces, records, nullable ref types |

### NuGet package file (`NovaCare.API.csproj`)

```xml
<!-- BCrypt.Net-Next: provides BCrypt.HashPassword() and BCrypt.Verify() -->
<PackageReference Include="BCrypt.Net-Next" Version="4.1.0" />

<!-- JwtBearer: adds JWT authentication handler to the DI pipeline -->
<PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="10.0.5" />

<!-- EF Core SQL Server driver: translates LINQ → T-SQL for SQL Server -->
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="10.0.5" />

<!-- EF Core tooling: enables 'dotnet ef migrations add' CLI commands; PrivateAssets=all means it
     is only used at build/design time and is NOT shipped with the published binary -->
<PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="10.0.5">
  <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
  <PrivateAssets>all</PrivateAssets>
</PackageReference>

<!-- Swashbuckle: generates OpenAPI docs and the /swagger interactive UI -->
<PackageReference Include="Swashbuckle.AspNetCore" Version="6.9.0" />
```

---

## 2. Project Layout

```
NovaCare.API/
├── Controllers/     One .cs file per domain area; each class is an ApiController
├── Data/            AppDbContext — EF Core model configuration + seed data
├── DTOs/            Typed request/response records shared between controllers
├── Helpers/         JwtHelper — builds and signs JWT tokens
├── Middleware/       Reserved for future custom middleware (currently empty)
├── Migrations/      EF Core auto-generated migration files — do not edit manually
├── Models/          Entity classes; EF Core maps each one to a SQL table
├── Services/        AuditService — writes audit log rows
├── Uploads/         (legacy location; actual uploads go into wwwroot/)
├── wwwroot/         Static file root: wwwroot/uploads/prescriptions/ and /medicines/
├── Program.cs       The single entry point: registers DI, builds the pipeline, seeds DB
├── appsettings.json Connection string + JWT signing config
└── NovaCare.API.csproj  Project metadata, target framework, NuGet package refs
```

---

## 3. Configuration — `appsettings.json`

```jsonc
{
  "ConnectionStrings": {
    // "DefaultConnection" is the key EF Core looks for by convention when you call
    // builder.Configuration.GetConnectionString("DefaultConnection").
    // Server=10.176.224.21,1433  — IP address of the SQL Server host, port 1433
    // Database=NovaCareDB          — the catalog (database name) to connect to
    // User Id=sa; Password=...     — SQL Server authentication (not Windows auth)
    // TrustServerCertificate=True  — skip TLS certificate validation. The SQL Server
    //   uses a self-signed cert; without this the driver would throw a TLS error.
    //   NEVER use this in production — use a valid cert and remove this flag.
    // MultipleActiveResultSets=True (MARS) — allows the same connection to have more
    //   than one open DataReader at the same time. EF Core needs this when you do
    //   Include() chains or run sub-queries inside a loop on the same DbContext.
    "DefaultConnection": "Server=10.176.224.21,1433;Database=NovaCareDB;User Id=sa;Password=MyStr0ngPass123;TrustServerCertificate=True;MultipleActiveResultSets=True;"
  },
  "Jwt": {
    // Key: the secret used to sign tokens with HMAC-SHA256.
    //   Must be at least 32 bytes long (256 bits) because SHA-256 requires it.
    //   Anyone who knows this key can forge tokens. Move it to an environment
    //   variable or Azure Key Vault before going to production.
    "Key": "NovaCare_SuperSecretKey_2026_Pharmacy_Rwanda_!@#$%",

    // Issuer: a string the API puts inside the token as the "iss" claim.
    //   When the API validates an incoming token, it checks iss == this value.
    //   This prevents tokens issued by a different service from being accepted.
    "Issuer": "NovaCare.API",

    // Audience: the "aud" claim — who the token is intended for.
    //   The frontend sends tokens back; the API verifies aud == "NovaCare.Client".
    //   If you add a mobile app, give it a different audience so you can
    //   reject mobile tokens from the web API if needed.
    "Audience": "NovaCare.Client"
  }
}
```

---

## 4. Composition Root — `Program.cs`

`Program.cs` has two phases: **builder phase** (register services into the DI container) and **app phase** (wire up the middleware pipeline, then run).

### 4.1 Database registration

```csharp
// AddDbContext registers AppDbContext with a Scoped lifetime (one instance per HTTP
// request). The lambda configures EF Core to talk to SQL Server using the connection
// string from appsettings.json. EF Core translates all LINQ .Where()/.Select() etc.
// into T-SQL and sends them over this connection.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
```

### 4.2 JWT authentication registration

```csharp
var jwtKey = builder.Configuration["Jwt:Key"]!;
// The ! at the end asserts "this is not null" — the app will throw immediately on
// startup if the key is missing from config, rather than crashing on first login.

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // MapInboundClaims = false is CRITICAL.
        //
        // By default, the JWT middleware remaps claim names from the short JWT
        // standard names to long WS-Federation (WIF) URIs. For example:
        //   "role"  →  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        //   "sub"   →  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        //
        // If we left this as true (the default), then calling
        //   User.FindFirst("role")  would return null
        // because the claim is stored under the long URI name.
        // Setting it to false keeps the claim names exactly as they appear in the JWT,
        // so User.FindFirst("role") works as expected.
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            // ValidateIssuer: reject tokens whose "iss" claim doesn't match ValidIssuer.
            // Prevents tokens from a different API being accepted here.
            ValidateIssuer = true,

            // ValidateAudience: reject tokens whose "aud" claim doesn't match ValidAudience.
            ValidateAudience = true,

            // ValidateLifetime: reject tokens whose "exp" (expiry) timestamp has passed.
            // Without this, expired tokens would be accepted forever.
            ValidateLifetime = true,

            // ValidateIssuerSigningKey: verify the cryptographic signature on the token.
            // Without this, a tampered or forged token would be accepted.
            ValidateIssuerSigningKey = true,

            ValidIssuer   = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            // SymmetricSecurityKey wraps the raw bytes of the secret key.
            // Both signing (in JwtHelper) and validation use the same key —
            // this is what makes it "symmetric" (as opposed to RSA which uses a key pair).
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
```

### 4.3 Service registration

```csharp
// AddScoped: one instance per HTTP request; the instance is disposed at end of request.
// JwtHelper needs IConfiguration (injected automatically) to read Jwt:Key.
builder.Services.AddScoped<JwtHelper>();

// IHttpContextAccessor provides access to the current HttpContext from inside a
// service (not a controller). Without this, AuditService couldn't read the current
// user's claims or IP address. It's registered Singleton because it is thread-safe
// and creating it per-request would be wasteful.
builder.Services.AddHttpContextAccessor();

// AuditService is Scoped because it writes to AppDbContext (which is also Scoped).
// A Singleton service cannot safely depend on a Scoped service — that would be a
// "captive dependency" bug where the same DbContext is shared across requests.
builder.Services.AddScoped<NovaCare.API.Services.AuditService>();
```

### 4.4 Model binding quirk

```csharp
builder.Services.Configure<Microsoft.AspNetCore.Mvc.MvcOptions>(o =>
    // C# 8+ nullable reference types mark all non-nullable properties as implicitly
    // [Required] to the model binder. This is a problem for EF Core navigation
    // properties like: public Branch Branch { get; set; } = null!;
    // The = null! tells the C# compiler "I know this is null at init, trust me".
    // But without this setting, the MVC model binder sees a non-nullable property
    // and adds [Required] — so any POST body that doesn't include a fully populated
    // Branch object gets a 400 Bad Request, even though we only send BranchId.
    // This flag suppresses that implicit [Required] behavior. Add [Required] manually
    // on DTO properties that genuinely must be present in the request body.
    o.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true);
```

### 4.5 JSON serialization options

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        // ReferenceHandler.IgnoreCycles: when the serializer encounters a reference
        // cycle (e.g. Sale → Customer → Sales → Customer → ...), it simply stops
        // following the cycle and writes null at that point instead of throwing.
        // The alternative, ReferenceHandler.Preserve, emits $id/$ref markers which
        // are harder to consume in JavaScript.
        opts.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;

        // WhenWritingNull: omit any property whose value is null from the JSON output.
        // This keeps responses lean — e.g. Sale.Notes won't appear as "notes": null
        // when there are no notes.
        opts.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });
```

### 4.6 CORS policy

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("NovaCarePolicy", policy =>
    {
        // Vite dev server randomises its port between 5173, 5174, 5175 when the
        // default port is taken. All three are whitelisted so the frontend always works.
        // WithOrigins is an allowlist — any other origin gets a CORS error.
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175")
              .AllowAnyHeader()   // allow Authorization, Content-Type, etc.
              .AllowAnyMethod();  // allow GET, POST, PUT, PATCH, DELETE, OPTIONS
    });
});
```

### 4.7 Middleware pipeline (order is mandatory)

```csharp
// Swagger — only registered in Development so the API explorer isn't exposed in prod.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();      // serves /swagger/v1/swagger.json (the raw OpenAPI spec)
    app.UseSwaggerUI(...); // serves the HTML interactive explorer at /swagger
}

// UseStaticFiles: serves everything inside wwwroot/ as a file download.
// Must come BEFORE authentication so that /uploads/** files can be fetched by the
// React frontend without a bearer token (images are public URLs embedded in HTML).
app.UseStaticFiles();

// UseCors: attaches the CORS headers to responses. Must come before UseAuthentication
// so that pre-flight OPTIONS requests (which carry no auth token) are not rejected
// before the CORS headers are added — the browser would then silently block the request.
app.UseCors("NovaCarePolicy");

// UseAuthentication: reads the Authorization: Bearer <token> header, validates the
// JWT (issuer, audience, lifetime, signature), and populates User (ClaimsPrincipal)
// on the HttpContext so that User.FindFirst("role") works in controllers.
// MUST come before UseAuthorization.
app.UseAuthentication();

// UseAuthorization: checks whether the authenticated user satisfies the [Authorize]
// attribute on the matched controller/action. Returns 401 if not authenticated,
// 403 if authenticated but not allowed. Requires UseAuthentication to have run first.
app.UseAuthorization();

// MapControllers: scans for all classes annotated [ApiController] and registers their
// routes. This is where HTTP verbs + URL patterns are wired to C# methods.
app.MapControllers();
```

### 4.8 Auto-migrate and seed on startup

```csharp
// CreateScope creates a temporary DI scope so we can resolve Scoped services (like
// AppDbContext) outside of an HTTP request — at app startup there is no request.
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Database.Migrate() applies any pending EF Core migrations to the live database.
    // This is equivalent to running 'dotnet ef database update' manually.
    // On first run it creates all tables. On subsequent runs it is a near-no-op
    // (it checks a __EFMigrationsHistory table to see what has already been applied).
    // EnsureCreated() is NOT used here — that method creates tables without recording
    // migrations, which would permanently prevent future 'dotnet ef migrations add'.
    dbContext.Database.Migrate();

    // Batch seeding is done here (not in HasData) because computing values like
    // RemainingQuantity = 80 - (med % 5) * 3 would be treated as a "model change"
    // by EF tooling each time migrations are generated, triggering the noisy
    // PendingModelChangesWarning. Static HasData values must be compile-time constants.
    if (!dbContext.Batches.Any())
    {
        // ... builds one Batch per medicine (1-24) per active branch (1-3)
        dbContext.Batches.AddRange(batches);
        dbContext.SaveChanges(); // synchronous is fine here — still in startup, no requests yet
    }
}
```

---

## 5. Domain Model

Nine entity classes map to SQL Server tables. Each file is in `Models/`.

### 5.1 `User`

```csharp
public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty; // = string.Empty avoids null warnings
    public string LastName  { get; set; } = string.Empty;
    public string Email     { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; // BCrypt output, never plain text

    // Role is an int not an enum. This means the same integer (1, 2, 3) flows
    // unchanged into: the SQL column, the JWT "role" claim, and the frontend
    // permissions.js map — no conversions needed anywhere.
    // 1 = Admin, 2 = Manager, 3 = Pharmacist
    public int Role { get; set; }

    public int BranchId { get; set; }  // foreign key — read by JWT as the "branchId" claim
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties (EF Core loads these when .Include(u => u.Branch) is called)
    // = null! tells the compiler "this will be set by EF, not by us at construction".
    // The SuppressImplicitRequired... setting in Program.cs stops the model binder
    // from treating this as an HTTP-required field.
    public Branch Branch { get; set; } = null!;
    public ICollection<Sale> Sales { get; set; } = [];
    public ICollection<AuditLog> AuditLogs { get; set; } = [];
}
```

### 5.2 `Branch`

Pharmacy location. Four seeded rows (3 active, 1 inactive — Huye). No Delete endpoint — branches are effectively permanent records tied to sales history.

### 5.3 `Medicine`

```csharp
public class Medicine
{
    public int Id { get; set; }
    public string GenericName { get; set; } = string.Empty; // e.g. "Amoxicillin"
    public string BrandName   { get; set; } = string.Empty; // e.g. "Amoxil"
    public string Strength    { get; set; } = string.Empty; // e.g. "500mg"
    public string Form        { get; set; } = string.Empty; // Tablet/Capsule/Injection/Cream
    public string Category    { get; set; } = string.Empty; // Antibiotics, Vitamins, etc.
    public bool RequiresPrescription { get; set; }
    public decimal Price { get; set; }   // configured HasPrecision(12,2) in DbContext
    public string? ImagePath { get; set; }   // nullable — not all medicines have an image
    public string? Description { get; set; }

    // Collections let EF Core JOIN back from this medicine to all its related rows
    public ICollection<Batch> Batches { get; set; } = [];
    public ICollection<SaleItem> SaleItems { get; set; } = [];
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
```

### 5.4 `Batch`

Per-medicine, per-branch inventory lot. `RemainingQuantity` is the live stock counter — it is decremented by `SalesController.Create` via the FEFO algorithm. `InitialQuantity` is historical and never changes.

### 5.5 `Customer`

Stored customer record linked to internal Sales (pharmacist-rung). Unrelated to the public shop flow — a shop customer can place an Order with only a name/email/phone string; no `Customer` row is created.

### 5.6 `Sale` and `SaleItem`

```csharp
public class Sale
{
    public int Id { get; set; }
    // InvoiceNumber is generated server-side: "INV-yyyyMMdd-<6 random chars>"
    // Never trust the client to supply this.
    public string InvoiceNumber { get; set; } = string.Empty;
    public int? CustomerId { get; set; }  // nullable — walk-in sales have no Customer row
    public int UserId  { get; set; }  // which pharmacist rang this sale
    public int BranchId { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = "Cash"; // Cash/Card/Mobile Money/Insurance
    public string? Notes { get; set; }
    public DateTime SaleDate { get; set; } = DateTime.UtcNow;

    // Navigation properties — nullable so the model binder doesn't demand them on POST
    public Customer?  Customer { get; set; }
    public User?      User     { get; set; }
    public Branch?    Branch   { get; set; }
    public ICollection<SaleItem> Items { get; set; } = [];
}

public class SaleItem
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public int MedicineId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    // Subtotal is computed server-side (Quantity * UnitPrice) — never trust the client's value
    public decimal Subtotal { get; set; }

    public Sale?     Sale     { get; set; }
    public Medicine? Medicine { get; set; }
}
```

### 5.7 `Order` and `OrderItem`

Public shop order. Unlike Sales, Orders **do not deduct stock** when created — they sit as "Pending" until a staff member approves them in the dashboard. `ApprovedById` is set when a staff user calls `PATCH /api/orders/{id}/status` with `"Approved"`.

```csharp
public class Order
{
    public int Id { get; set; }
    // Shop customers are not registered users, so we store their contact info as plain strings
    public string CustomerName  { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public int BranchId { get; set; }  // which branch the customer chose at checkout
    public string Status { get; set; } = "Pending"; // Pending → Approved / Rejected
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public int? ApprovedById { get; set; }  // null until approved by a staff user
    // HasPrescription flips to true when any OrderItem's prescription is uploaded
    public bool HasPrescription { get; set; }

    public Branch Branch { get; set; } = null!;
    public User? ApprovedBy { get; set; }
    public ICollection<OrderItem> Items { get; set; } = [];
}
```

### 5.8 `ContactMessage`

Landing-page contact form submissions. Stored with `Status` = `Unread` | `Read` | `Replied`. The reply flow stores the reply text and timestamp on the same row — no separate email is sent (that would require an email service not yet integrated).

### 5.9 `AuditLog`

```csharp
public class AuditLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    // Action is a short verb: "Created", "Updated", "Deleted", "Login",
    // "Logout", "PasswordReset", "PasswordChanged", "Approved", "Rejected"
    public string Action { get; set; } = string.Empty;
    // Module identifies which part of the system: "Medicine", "Sale", "User", "Auth", "Order"
    public string Module { get; set; } = string.Empty;
    // Details is a free-text human-readable description, e.g. "Invoice INV-20260415-A3F9B1"
    public string? Details { get; set; }
    // IpAddress is the client's IP, captured from HttpContext.Connection.RemoteIpAddress
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
```

---

## 6. DbContext — `Data/AppDbContext.cs`

### 6.1 Primary constructor (C# 12)

```csharp
// C# 12 primary constructor: the parameter 'options' is automatically stored
// and passed to the base DbContext(options) constructor.
// The old way required an explicit field + constructor body.
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
```

### 6.2 DbSets

```csharp
// Each DbSet<T> represents a SQL table. The property name becomes the table name
// (EF Core pluralises it). You query through these: db.Sales.Where(...).ToListAsync()
public DbSet<User>           Users           => Set<User>();
public DbSet<Branch>         Branches        => Set<Branch>();
public DbSet<Medicine>       Medicines       => Set<Medicine>();
public DbSet<Batch>          Batches         => Set<Batch>();
public DbSet<Customer>       Customers       => Set<Customer>();
public DbSet<Sale>           Sales           => Set<Sale>();
public DbSet<SaleItem>       SaleItems       => Set<SaleItem>();
public DbSet<Order>          Orders          => Set<Order>();
public DbSet<OrderItem>      OrderItems      => Set<OrderItem>();
public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
public DbSet<AuditLog>       AuditLogs       => Set<AuditLog>();
```

### 6.3 Decimal precision

```csharp
// SQL Server's default decimal is decimal(18,2). EF Core will use that, but it
// will also emit a 'no precision configured' warning every startup because it
// cannot know if you intended 18,2 or something else.
// HasPrecision(12, 2): 12 total digits, 2 after the decimal point.
// This is large enough for RWF values in the millions while suppressing the warning.
modelBuilder.Entity<Medicine>().Property(m => m.Price).HasPrecision(12, 2);
modelBuilder.Entity<Batch>().Property(b => b.CostPrice).HasPrecision(12, 2);
modelBuilder.Entity<Sale>().Property(s => s.TotalAmount).HasPrecision(12, 2);
// ... and for SaleItem.UnitPrice, SaleItem.Subtotal, Order.TotalAmount, OrderItem.UnitPrice
```

### 6.4 Delete behavior — why NoAction everywhere

```csharp
// SQL Server refuses to create a table relationship that would allow a single
// DELETE to cascade through two or more different paths to the same table.
// Example of why this matters in NovaCare:
//
//   Branch  ──(HasMany)──>  Users  ──(HasMany)──>  Sales    ← path 1: Branch→User→Sale
//   Branch  ──(HasMany)──>  Sales                            ← path 2: Branch→Sale directly
//
// If both relationships used Cascade, SQL Server would raise:
//   "Introducing FOREIGN KEY constraint ... may cause cycles or multiple cascade paths"
//
// The fix: use NoAction on every FK. This means the database will NOT automatically
// delete children when a parent is deleted. The application code must handle cleanup
// manually. If you try to delete a Branch that still has Users, the DB will throw a
// foreign-key violation — which is actually safer (no accidental data loss).

modelBuilder.Entity<Sale>()
    .HasOne(s => s.User)        // Sale has one User (the pharmacist who made the sale)
    .WithMany(u => u.Sales)     // User has many Sales
    .HasForeignKey(s => s.UserId)
    .OnDelete(DeleteBehavior.NoAction); // do not cascade deletes
```

### 6.5 Seed data strategy

```csharp
// HasData() is the EF Core way to include reference/seed data in migrations.
// The values must be compile-time-deterministic (no DateTime.Now, no Guid.NewGuid())
// otherwise EF will think the model changed every time you run 'dotnet ef migrations add'.
//
// User passwords are pre-hashed CONSTANTS.
// Plain text: admin123 / manager123 / pharma123
// If you change a password, you must compute a new BCrypt hash, update the constant,
// then add a new migration.
const string adminHash   = "$2a$11$jMB7..."; // BCrypt output for "admin123"
const string managerHash = "$2a$11$Aud1..."; // BCrypt output for "manager123"
const string pharmaHash  = "$2a$11$S7du..."; // BCrypt output for "pharma123"

modelBuilder.Entity<User>().HasData(
    new User {
        Id = 1,                          // must be a fixed ID for HasData (EF needs it to diff)
        FirstName = "Admin",
        Email = "admin@novacare.rw",
        PasswordHash = adminHash,
        Role = 1,                        // Admin
        BranchId = 1,
        IsActive = true,
        // Use a fixed UTC date — not DateTime.UtcNow — to avoid PendingModelChangesWarning
        CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
    },
    // ... 6 more users
);
```

---

## 7. Authentication & Authorization

### 7.1 How a JWT is built — `Helpers/JwtHelper.cs`

```csharp
public class JwtHelper(IConfiguration config)  // primary constructor injects IConfiguration
{
    public string GenerateToken(User user)
    {
        // SymmetricSecurityKey wraps the raw bytes of the secret.
        // "Symmetric" means the same key is used to both sign and verify.
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));

        // SigningCredentials bundles the key with the algorithm choice.
        // HmacSha256 = HMAC using SHA-256 hashing. Industry standard for JWT.
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            // "sub" (subject) — standard JWT claim for the user identifier.
            // Stored as a string because JWT values are always strings.
            new Claim("sub",              user.Id.ToString()),

            // Standard IANA claim names for email/name. These map to ClaimTypes.Email etc.
            new Claim(ClaimTypes.Email,      user.Email),
            new Claim(ClaimTypes.GivenName,  user.FirstName),
            new Claim(ClaimTypes.Surname,    user.LastName),

            // Custom short-name claims. With MapInboundClaims=false, these are read
            // back exactly as "role" and "branchId" — no URI mangling.
            new Claim("role",     user.Role.ToString()),
            new Claim("branchId", user.BranchId.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:            config["Jwt:Issuer"],
            audience:          config["Jwt:Audience"],
            claims:            claims,
            expires:           DateTime.UtcNow.AddHours(8),  // 8-hour session
            signingCredentials: creds
        );

        // WriteToken serialises the token to the compact Base64url string:
        // header.payload.signature
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

**Why 8 hours?** Long enough for a full pharmacy shift (morning–evening) without forcing mid-shift re-login, short enough to limit exposure if a token is stolen.

### 7.2 Reading claims in controllers

```csharp
// User is a ClaimsPrincipal — populated by UseAuthentication() from the JWT.
// FindFirst("role") searches for a claim named "role". The ! asserts non-null;
// the controller's [Authorize] attribute guarantees the claim exists before we get here.
var role     = int.Parse(User.FindFirst("role")!.Value);
var branchId = int.Parse(User.FindFirst("branchId")!.Value);
var userId   = int.Parse(User.FindFirst("sub")!.Value);
```

### 7.3 Authorization pattern

The project uses three layers of authorization, applied inline rather than via policy attributes:

1. **`[Authorize]` at class level** — any request without a valid JWT gets a `401 Unauthorized` before the action method even runs.
2. **Role check inline** — for admin-only actions, the controller reads the `role` claim and returns `403 Forbidden` if the caller isn't role 1. Example from `UsersController`:
   ```csharp
   var role = int.Parse(User.FindFirst("role")!.Value);
   if (role != 1) return Forbid(); // 403 — authenticated but not authorized
   ```
3. **Branch scoping inline** — for branch-sensitive data, the controller filters by `branchId` unless the caller is an admin (role 1):
   ```csharp
   // Admins see all branches; everyone else sees only their branch
   if (role != 1) query = query.Where(o => o.BranchId == branchId);
   ```

### 7.4 Public endpoints (no `[Authorize]` required)

| Route | Reason |
|---|---|
| `POST /api/auth/login` | Login itself — no token yet |
| `GET /api/medicines`, `/{id}`, `/categories` | Shop browsing |
| `GET /api/batches` | Shop stock availability |
| `GET /api/branches`, `/{id}` | Shop branch selector |
| `POST /api/orders` | Customer checkout |
| `POST /api/orders/{oid}/items/{iid}/prescription` | Customer prescription upload |
| `POST /api/contact-messages` | Landing-page contact form |

---

## 8. Controllers — Line-by-Line

### 8.1 `AuthController`

```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    // Case-insensitive email lookup + active-only filter in a single DB round trip.
    // FirstOrDefaultAsync returns null if no match (doesn't throw).
    var user = await db.Users
        .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower()
                                  && u.IsActive);

    // BCrypt.Verify(plainText, hash) computes the BCrypt of the input and compares
    // it to the stored hash in constant time (resistant to timing attacks).
    // We combine the null check and hash check — both failures give the same 401
    // so an attacker can't tell whether the email exists or the password is wrong.
    if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        return Unauthorized(new { message = "Invalid email or password." });

    var token = jwt.GenerateToken(user); // build the signed JWT

    // userIdOverride: at this point User.FindFirst("sub") is null (not yet authenticated).
    // We pass the resolved user's ID directly so AuditService can write the log row.
    await audit.LogAsync("Login", "Auth", $"User {user.Email} logged in",
                         userIdOverride: user.Id);

    // Return the token + user info so the frontend can store both in localStorage.
    return Ok(new LoginResponse(token, user.Id, user.FirstName,
                                user.LastName, user.Email, user.Role, user.BranchId));
}

[HttpPost("logout")]
public async Task<IActionResult> Logout()
{
    // JWT is stateless — the server holds no session to invalidate.
    // "Logout" server-side just records the event. The client is responsible
    // for deleting the token from localStorage.
    await audit.LogAsync("Logout", "Auth");
    return Ok(new { message = "Logged out successfully." });
}
```

### 8.2 `SalesController` — FEFO stock deduction

```csharp
[HttpPost]
public async Task<IActionResult> Create([FromBody] Sale sale)
{
    // Reset Id to 0 so EF Core treats this as an INSERT (not an UPDATE).
    // Without this, a malicious client could send Id=5 and overwrite an existing sale.
    sale.Id = 0;
    sale.SaleDate = DateTime.UtcNow; // always server time, never trust the client

    // Generate a unique invoice number. Guid.NewGuid() gives 36 chars; [..6] takes the
    // first 6, ToUpper() makes it easier to read on paper receipts.
    sale.InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

    // FEFO = First Expiry First Out.
    // We walk through each item in the sale and deduct from the oldest batches first.
    foreach (var item in sale.Items)
    {
        var remaining = item.Quantity; // how many units we still need to deduct

        // Fetch all batches for this medicine at this branch that:
        //   - still have stock (RemainingQuantity > 0)
        //   - have not yet expired (ExpiryDate > now)
        //   - ordered so that the batch expiring soonest is first (FEFO)
        var batches = await db.Batches
            .Where(b => b.MedicineId        == item.MedicineId
                     && b.BranchId          == sale.BranchId
                     && b.RemainingQuantity  > 0
                     && b.ExpiryDate         > DateTime.UtcNow)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync();

        foreach (var batch in batches)
        {
            if (remaining <= 0) break; // all quantity satisfied — stop

            // Deduct up to the batch's remaining stock (don't go negative)
            var deduct = Math.Min(batch.RemainingQuantity, remaining);
            batch.RemainingQuantity -= deduct;
            remaining -= deduct;
            // EF Core tracks this change automatically — SaveChangesAsync will UPDATE
        }

        // Compute subtotal server-side — don't trust client-sent value
        item.Subtotal = item.Quantity * item.UnitPrice;
    }

    db.Sales.Add(sale);
    await db.SaveChangesAsync(); // one round trip: inserts Sale + all SaleItems + updates Batches
    await audit.LogAsync("Created", "Sale", $"Invoice {sale.InvoiceNumber} — RWF {sale.TotalAmount:N0}");
    return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale);
}
```

### 8.3 `OrdersController` — prescription upload

```csharp
[HttpPost("{orderId}/items/{itemId}/prescription")]
// No [Authorize] — shop customers upload prescriptions without logging in
public async Task<IActionResult> UploadPrescription(int orderId, int itemId, IFormFile file)
{
    // Verify the OrderItem exists and belongs to the Order (prevents IDOR attacks
    // where someone uploads a prescription to another customer's order item)
    var item = await db.OrderItems
        .FirstOrDefaultAsync(i => i.Id == itemId && i.OrderId == orderId);
    if (item is null) return NotFound();

    // 5 MB cap: 5 * 1024 * 1024 = 5,242,880 bytes
    if (file.Length > 5 * 1024 * 1024)
        return BadRequest("File size must be under 5MB.");

    // Allowlist of extensions — never trust the MIME type header from the browser alone
    var allowed = new[] { ".jpg", ".jpeg", ".png", ".pdf" };
    var ext = Path.GetExtension(file.FileName).ToLower();
    if (!allowed.Contains(ext)) return BadRequest("Only JPG, PNG, or PDF files are allowed.");

    // env.WebRootPath is the path to wwwroot/. Fall back to "wwwroot" if not set
    // (e.g. in a unit test host that doesn't serve static files).
    var uploadsDir = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", "prescriptions");
    Directory.CreateDirectory(uploadsDir); // no-op if the directory already exists

    // Rename to a GUID so:
    //   1. Two uploads of the same file don't overwrite each other
    //   2. The original filename (which could contain path traversal chars) is never used
    var fileName = $"{Guid.NewGuid()}{ext}";
    var filePath = Path.Combine(uploadsDir, fileName);

    // await using: disposes the FileStream as soon as the copy finishes, even on exception.
    // FileMode.Create: creates the file if it doesn't exist, truncates if it does.
    await using var stream = new FileStream(filePath, FileMode.Create);
    await file.CopyToAsync(stream); // async copy — doesn't block a thread while writing

    // Store the public URL path on the entity so the frontend can display the file
    item.PrescriptionImagePath = $"/uploads/prescriptions/{fileName}";
    item.PrescriptionFileName  = file.FileName; // keep the original name for display only

    // Flip the HasPrescription flag on the parent Order so staff can filter
    var order = await db.Orders.FindAsync(orderId);
    if (order is not null) order.HasPrescription = true;

    await db.SaveChangesAsync();
    return Ok(new { path = item.PrescriptionImagePath }); // tell the client where the file lives
}
```

### 8.4 `UsersController` — password management

```csharp
// Admin-only: reset any user's password without knowing their current one
[HttpPost("{id}/password")]
public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest request)
{
    // Inline role check — [Authorize(Roles="1")] would also work, but inline is simpler
    // given that roles are plain integers, not string names in this project.
    var role = int.Parse(User.FindFirst("role")!.Value);
    if (role != 1) return Forbid(); // 403 — authenticated but not an admin

    if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        return BadRequest(new { message = "New password must be at least 6 characters." });

    var user = await db.Users.FindAsync(id);
    if (user is null) return NotFound();

    // BCrypt.HashPassword with no explicit work factor uses the library's default (11).
    // The resulting hash is a self-contained string that includes the algorithm
    // version, work factor, salt, and hash — everything BCrypt.Verify needs later.
    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
    await db.SaveChangesAsync();
    await audit.LogAsync("PasswordReset", "User", $"Reset password for {user.Email}");

    return Ok(new { message = "Password reset." });
}

// Self-service: user changes their own password (must supply current password)
[HttpPost("me/password")]
public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
{
    var userId = int.Parse(User.FindFirst("sub")!.Value);
    var user   = await db.Users.FindAsync(userId);
    if (user is null) return NotFound();

    // BCrypt.Verify runs the hash algorithm on the supplied plain text and compares
    // it to the stored hash. It is constant-time, preventing timing attacks.
    if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        return BadRequest(new { message = "Current password is incorrect." });

    if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        return BadRequest(new { message = "New password must be at least 6 characters." });

    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
    await db.SaveChangesAsync();
    await audit.LogAsync("PasswordChanged", "Profile", "Changed own password");

    return Ok(new { message = "Password updated." });
}
```

### 8.5 `DashboardController` — role-scoped stats

```csharp
[HttpGet("stats")]
public async Task<IActionResult> GetStats()
{
    // Extract all three claims at once — every subsequent query may need them
    var role     = int.Parse(User.FindFirst("role")!.Value);
    var branchId = int.Parse(User.FindFirst("branchId")!.Value);
    var userId   = int.Parse(User.FindFirst("sub")!.Value);

    var today      = DateTime.UtcNow.Date;           // midnight UTC today
    var ninetyDays = today.AddDays(90);              // for "expiring soon" threshold

    if (role == 1) // Admin — unrestricted system-wide view
    {
        // Each of these is a separate async DB query. They run sequentially here
        // (could be parallelised with Task.WhenAll if performance becomes an issue).
        var totalRevenue   = await db.Sales.SumAsync(s => s.TotalAmount);
        var totalMedicines = await db.Medicines.CountAsync();
        var activeUsers    = await db.Users.CountAsync(u => u.IsActive);
        var pendingOrders  = await db.Orders.CountAsync(o => o.Status == "Pending");
        // Low stock = any batch with 1-9 units remaining (not zero — those are empty)
        var lowStock       = await db.Batches.CountAsync(b => b.RemainingQuantity < 10
                                                           && b.RemainingQuantity > 0);
        var unreadMessages = await db.ContactMessages.CountAsync(m => m.Status == "Unread");
        // Expiring "soon" = within 90 days, not already expired, still has stock
        var expiringSoon   = await db.Batches.CountAsync(b => b.ExpiryDate > today
                                                           && b.ExpiryDate <= ninetyDays
                                                           && b.RemainingQuantity > 0);
        return Ok(new { role, totalRevenue, totalMedicines, activeUsers,
                        pendingOrders, lowStock, unreadMessages, expiringSoon });
    }

    if (role == 2) // Manager — branch-scoped, no cross-branch data
    {
        var branchRevenue = await db.Sales
            .Where(s => s.BranchId == branchId)
            .SumAsync(s => s.TotalAmount);
        // ... branch-scoped counts
        return Ok(new { role, branchRevenue, /* ... */ });
    }

    // Pharmacist (role == 3) — personal stats only
    var myTodaySales   = await db.Sales
        .Where(s => s.UserId == userId && s.SaleDate >= today)
        .CountAsync();
    // ... etc.
    return Ok(new { role, myTodaySales, /* ... */ });
}
```

### 8.6 `AuditLogsController` — access control and pagination

```csharp
[HttpGet]
public async Task<IActionResult> GetAll(
    [FromQuery] int? userId,    // optional filter: logs for a specific user
    [FromQuery] string? action, // optional filter: e.g. "Login", "Created"
    [FromQuery] string? module, // optional filter: e.g. "Sale", "Auth"
    [FromQuery] string? from,   // optional ISO date string
    [FromQuery] string? to)
{
    var role          = int.Parse(User.FindFirst("role")!.Value);
    var currentUserId = int.Parse(User.FindFirst("sub")!.Value);

    // Include(l => l.User) tells EF Core to JOIN the Users table so we can
    // project UserName and UserEmail without a separate query.
    var query = db.AuditLogs.Include(l => l.User).AsQueryable();

    // Non-admins can only see their own activity — enforced server-side,
    // regardless of what userId filter the client sends.
    if (role != 1) query = query.Where(l => l.UserId == currentUserId);

    // Optional filters — all additive (AND logic)
    if (userId.HasValue)   query = query.Where(l => l.UserId == userId);
    if (!string.IsNullOrEmpty(action))
        query = query.Where(l => l.Action == action);
    // DateTime.TryParse: if the string can't be parsed, the filter is silently skipped
    if (!string.IsNullOrEmpty(from) && DateTime.TryParse(from, out var fromDate))
        query = query.Where(l => l.Timestamp >= fromDate);
    if (!string.IsNullOrEmpty(to) && DateTime.TryParse(to, out var toDate))
        query = query.Where(l => l.Timestamp <= toDate);

    // Take(500): hard cap to prevent the response body from becoming enormous.
    // OrderByDescending ensures the most recent events appear first.
    // Select projects only the fields the client needs (avoids sending PasswordHash etc.)
    var logs = await query
        .OrderByDescending(l => l.Timestamp)
        .Take(500)
        .Select(l => new {
            l.Id, l.UserId,
            UserName  = l.User.FirstName + " " + l.User.LastName,
            UserEmail = l.User.Email,
            l.Action, l.Module, l.Details, l.IpAddress, l.Timestamp
        })
        .ToListAsync();

    return Ok(logs);
}
```

---

## 9. Services — `AuditService`

```csharp
// AppDbContext and IHttpContextAccessor are injected via primary constructor.
// AuditService is Scoped — it shares the same DbContext instance as the controller
// that called it within the same HTTP request. This means audit rows are part of
// the same unit of work (though they are SaveChangesAsync'd separately).
public class AuditService(AppDbContext db, IHttpContextAccessor http)
{
    public async Task LogAsync(
        string action,
        string module,
        string? details = null,
        int? userIdOverride = null)   // used at login time when User claims aren't set yet
    {
        var userId = userIdOverride ?? ResolveUserId();
        // If we can't resolve a user (anonymous endpoint, no override) just skip.
        // Never throw from an audit logger — that would break the actual operation.
        if (userId is null) return;

        // RemoteIpAddress can be null (e.g. in unit tests or behind certain proxies).
        // The ?. (null-conditional) returns null safely rather than throwing.
        var ip = http.HttpContext?.Connection.RemoteIpAddress?.ToString();

        db.AuditLogs.Add(new AuditLog
        {
            UserId    = userId.Value,
            Action    = action,
            Module    = module,
            Details   = details,
            IpAddress = ip,
            Timestamp = DateTime.UtcNow,
        });
        // SaveChangesAsync here is a separate write from the controller's SaveChangesAsync.
        // This means: if the audit write fails, an exception bubbles up but the main
        // operation has already been committed. Consider wrapping both in a transaction
        // if atomicity is required.
        await db.SaveChangesAsync();
    }

    private int? ResolveUserId()
    {
        // http.HttpContext can be null outside of an HTTP request context.
        // FindFirst("sub") returns null if the claim isn't present (anonymous user).
        var sub = http.HttpContext?.User.FindFirst("sub")?.Value;
        // int.TryParse: returns false (and id=0) if sub is null or non-numeric.
        // The ternary returns null in that case, indicating "no user to log".
        return int.TryParse(sub, out var id) ? id : null;
    }
}
```

---

## 10. EF Core Migrations

### What a migration file contains

When you run `dotnet ef migrations add <Name>`, EF Core compares the current `AppDbContext` model against the last migration's snapshot and generates a C# file with:
- `Up()` method: SQL to apply the change (CREATE TABLE, ADD COLUMN, etc.)
- `Down()` method: SQL to revert it (DROP TABLE, DROP COLUMN, etc.)
- A snapshot update to `AppDbContextModelSnapshot.cs` for the next diff

### `Database.Migrate()` vs `EnsureCreated()`

| | `Database.Migrate()` | `EnsureCreated()` |
|---|---|---|
| Applies pending migrations | ✅ Yes | ❌ No |
| Records in `__EFMigrationsHistory` | ✅ Yes | ❌ No |
| Works with future migrations | ✅ Yes | ❌ No (breaks them) |
| Creates DB from scratch if missing | ✅ Yes | ✅ Yes |
| **Use in production?** | **Yes** | **Never** |

`EnsureCreated()` creates tables by reading the current model — it doesn't go through migrations. Once you call it, the `__EFMigrationsHistory` table is absent, and future `dotnet ef migrations add` will fail or produce incorrect diffs.

### Migration history

| Migration | What it does |
|---|---|
| `20260414154659_InitialCreate` | Creates all 11 tables; seeds Branches, Users, Medicines, Customers via `HasData` |
| `20260415080827_FixNullability` | Tightens nullable/required column definitions |

```bash
# Add a new migration after changing a Model or AppDbContext
cd NovaCare.API
dotnet ef migrations add <DescriptiveName>

# Apply manually (optional — Program.cs does this automatically on startup)
dotnet ef database update

# Roll back the last migration (locally only — never in production without a plan)
dotnet ef database update <PreviousMigrationName>
```

---

## 11. Static File Uploads

### How `IFormFile` works

```csharp
// IFormFile represents a file sent as multipart/form-data.
// The ASP.NET Core model binder reads the multipart stream and wraps it in IFormFile.
// Key properties:
//   file.Length      — byte count (check this BEFORE reading to enforce size limits)
//   file.FileName    — the browser-supplied original name (NEVER use as a disk path)
//   file.ContentType — MIME type from the browser (unreliable — validate extension instead)
//   file.CopyToAsync — streams the file to a target stream without loading it all in memory

public async Task<IActionResult> UploadImage(IFormFile file)
{
    if (file is null || file.Length == 0)
        return BadRequest(new { message = "No file uploaded." });

    // Check length FIRST — before touching file content — to fail fast
    if (file.Length > 5 * 1024 * 1024)  // 5 MB = 5 × 1024 × 1024 bytes
        return BadRequest(new { message = "File size must be under 5MB." });

    // Allowlist approach: only explicitly permitted extensions are accepted.
    // Blocklist approaches ("anything except .exe") are fragile.
    var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
    var ext = Path.GetExtension(file.FileName).ToLower(); // .ToLower() handles "FILE.JPG"
    if (!allowed.Contains(ext))
        return BadRequest(new { message = "Only JPG, PNG, or WEBP files are allowed." });

    // env.WebRootPath = the absolute path to wwwroot/ on this server.
    // Path.Combine builds an OS-safe path (uses \ on Windows, / on Linux).
    var uploadsDir = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads", "medicines");
    Directory.CreateDirectory(uploadsDir); // creates the folder tree if it doesn't exist

    // Guid.NewGuid() produces a globally unique identifier like "3f7a2c1b-...".
    // Using it as the filename means:
    //   - Two uploads with the same original name don't overwrite each other
    //   - Original filenames with ../ or other traversal chars are never used on disk
    var fileName = $"{Guid.NewGuid()}{ext}";
    var filePath = Path.Combine(uploadsDir, fileName);

    // await using: C# 8 async dispose pattern.
    // The FileStream is opened, the file is copied asynchronously (no thread blocked),
    // then the stream is closed and flushed — even if CopyToAsync throws.
    await using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    // Return the public URL path. The client can construct the full URL as
    // http://localhost:5232 + path (done in MedicineImage.jsx on the frontend).
    return Ok(new { path = $"/uploads/medicines/{fileName}" });
}
```

### Upload storage map

| What | Disk path | Served at | Produced by |
|---|---|---|---|
| Prescription images | `wwwroot/uploads/prescriptions/<guid>.<ext>` | `/uploads/prescriptions/<guid>.<ext>` | `OrdersController.UploadPrescription` |
| Medicine images | `wwwroot/uploads/medicines/<guid>.<ext>` | `/uploads/medicines/<guid>.<ext>` | `MedicinesController.UploadImage` |

---

## 12. Running the Backend

```bash
cd NovaCare.API

# Restore NuGet packages (only needed first time or after csproj changes)
dotnet restore

# Run the development server. Program.cs calls Database.Migrate() on startup,
# so all migrations are applied and seed data is checked before the first request.
dotnet run
# → http://localhost:5232  (HTTP)
# → http://localhost:5232/swagger  (Swagger UI — dev only)
```

---

## 13. Design Decisions

### Primary constructors (C# 12)

```csharp
// Old way (C# 10 and earlier):
public class MyService
{
    private readonly AppDbContext _db;
    public MyService(AppDbContext db) { _db = db; }
}

// New way (C# 12 primary constructor) — used everywhere in this project:
public class MyService(AppDbContext db)
{
    // 'db' is available as a parameter in all methods.
    // No field declaration needed unless you want a named backing field.
}
```

### Integers, not enums, for Role

Using `int Role` (1/2/3) means:
- The SQL column is an `int` — no string conversion.
- The JWT `role` claim is `"1"` — `int.Parse()` in controllers, no `Enum.TryParse`.
- The frontend `permissions.js` key is `1`, `2`, `3` — no string→int mapping.

Trade-off: magic numbers scattered through controller code. Mitigated by comments on the `User` model and a `getRoleName()` helper on the frontend.

### No repository pattern

Controllers talk directly to `AppDbContext`. Reasons:
1. EF Core is already an abstraction over SQL — adding a repository is a second abstraction with no concrete benefit for this project size.
2. `IQueryable<T>` lets controllers compose filters efficiently (the WHERE clause is built in C# and sent as a single SQL query).
3. Repositories typically return `IEnumerable<T>` which materialises all rows into memory before filtering — wasteful.

### Audit as an explicit side-effect

`AuditService.LogAsync` is called explicitly by each controller *after* its own `SaveChangesAsync`. This ensures:
- An action that fails (e.g. DB constraint violation) is never logged.
- An audit failure (rare) doesn't roll back the main operation.

The alternative — intercepting `SaveChangesAsync` via a `DbContext` override — would log every EF change indiscriminately and make it hard to write meaningful `Details` strings.

### Orders ≠ Sales

| | Order | Sale |
|---|---|---|
| Created by | Public shop customer | Authenticated pharmacist |
| Stock deducted? | No | Yes (FEFO) |
| Lifecycle | Pending → Approved/Rejected | Terminal (no status changes) |
| Purpose | Customer intent / reservation | Accounting record of stock leaving |

### `DeleteBehavior.NoAction` everywhere

SQL Server raises `FOREIGN KEY constraint ... may cause cycles or multiple cascade paths` when a single `DELETE` can reach the same table through two or more cascade chains. Using `NoAction` avoids this entirely. The trade-off is that deletes must be handled intentionally in application code (currently there is no bulk-delete functionality — deletions are done one record at a time via explicit API calls).

---

## 14. File Index

| File | Purpose |
|---|---|
| `Program.cs` | Startup, DI, pipeline, auto-migrate/seed |
| `appsettings.json` | Connection string + JWT signing config |
| `NovaCare.API.csproj` | Target framework + NuGet packages |
| `Data/AppDbContext.cs` | EF model, relationships, HasData seed |
| `Helpers/JwtHelper.cs` | Builds + signs JWTs (claims, expiry, HS256) |
| `Services/AuditService.cs` | Resolves user from claims, writes AuditLog rows |
| `DTOs/AuthDtos.cs` | `LoginRequest(Email, Password)` and `LoginResponse(Token, Id, ...)` |
| `Models/User.cs` | User entity (Role int, BCrypt hash, nav props) |
| `Models/Medicine.cs` | Catalog item (brand, generic, category, price, image) |
| `Models/Batch.cs` | Per-branch stock lot (FEFO source of truth) |
| `Models/Sale.cs` + `SaleItem.cs` | POS sale record + line items |
| `Models/Order.cs` + `OrderItem.cs` | Shop order + line items + prescription path |
| `Models/Branch.cs` | Pharmacy location |
| `Models/Customer.cs` | Registered customer (linked to Sales, not Orders) |
| `Models/ContactMessage.cs` | Landing-page contact form submission |
| `Models/AuditLog.cs` | Immutable activity log row |
| `Controllers/AuthController.cs` | `POST /login`, `POST /logout` |
| `Controllers/UsersController.cs` | User CRUD + `/me` profile + password flows |
| `Controllers/MedicinesController.cs` | Catalog CRUD + `/upload-image` |
| `Controllers/BatchesController.cs` | Stock batch CRUD (GET public) |
| `Controllers/BranchesController.cs` | Branch CRUD (GET public) |
| `Controllers/CustomersController.cs` | Customer CRUD |
| `Controllers/SalesController.cs` | POS sales + FEFO deduction |
| `Controllers/OrdersController.cs` | Shop orders + prescription upload (POST public) |
| `Controllers/ContactMessagesController.cs` | Contact form + read/reply/delete |
| `Controllers/AuditLogsController.cs` | Activity log with role-scoped access |
| `Controllers/DashboardController.cs` | Stats + notification feed + sales chart |
| `Migrations/20260414154659_InitialCreate.cs` | Baseline schema + all seed data |
| `Migrations/20260415080827_FixNullability.cs` | Nullable/required column tightening |
| `wwwroot/uploads/prescriptions/` | Customer prescription uploads |
| `wwwroot/uploads/medicines/` | Admin medicine image uploads |
