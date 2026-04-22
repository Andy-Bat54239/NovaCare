using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NovaCare.API.Data;
using NovaCare.API.Helpers;
using NovaCare.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── JWT Authentication ────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // Keep short claim names ("role", "branchId") as-is
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        // Allow SignalR WebSocket connections to pass the token via query string
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddSignalR();

// ── Services ──────────────────────────────────────────────────────
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<NovaCare.API.Services.AuditService>();
builder.Services.AddScoped<NovaCare.API.Services.IEmailService, NovaCare.API.Services.EmailService>();

// Prevent EF Core navigation properties declared as "= null!" from being
// treated as HTTP-required fields by the model binder.
builder.Services.Configure<Microsoft.AspNetCore.Mvc.MvcOptions>(o =>
    o.SuppressImplicitRequiredAttributeForNonNullableReferenceTypes = true);

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// ── CORS — allow React frontend ───────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("NovaCarePolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174", "http://localhost:5175")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── Swagger ───────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "NovaCare Pharmacy API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Enter: Bearer {your_token}",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ── Static files (prescription uploads) ──────────────────────────
builder.Services.AddDirectoryBrowser();

var app = builder.Build();

// ── Middleware ────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "NovaCare Pharmacy API v1"));
}

app.UseStaticFiles();
app.UseCors("NovaCarePolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

// ── Auto-migrate and seed on startup ─────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();

    // Seed batches if none exist (programmatic — avoids PendingModelChangesWarning)
    if (!dbContext.Batches.Any())
    {
        var mfg  = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var exp1 = new DateTime(2027, 6, 1, 0, 0, 0, DateTimeKind.Utc);
        var exp2 = new DateTime(2027, 12, 1, 0, 0, 0, DateTimeKind.Utc);
        var now  = DateTime.UtcNow;

        // Medicine IDs 1-24, Branches 1-3 (active)
        var batches = new List<NovaCare.API.Models.Batch>();
        // Each medicine gets one batch per active branch, alternating expiry dates
        for (int med = 1; med <= 24; med++)
        {
            for (int branch = 1; branch <= 3; branch++)
            {
                batches.Add(new NovaCare.API.Models.Batch
                {
                    MedicineId        = med,
                    BranchId          = branch,
                    BatchNumber       = $"BCH-{med:D3}-{branch}-2025",
                    InitialQuantity   = 100,
                    RemainingQuantity = 80 - (med % 5) * 3,   // varied stock 65-80
                    ManufacturingDate = mfg,
                    ExpiryDate        = (med % 2 == 0) ? exp1 : exp2,
                    Supplier          = branch == 1 ? "MedSupply Rwanda" : branch == 2 ? "PharmaDist Ltd" : "HealthLink Co.",
                    CostPrice         = 1500m + (med * 100m),
                    CreatedAt         = now,
                });
            }
        }
        dbContext.Batches.AddRange(batches);
        dbContext.SaveChanges();
    }
}

app.Run();
