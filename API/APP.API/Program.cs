using APP.Business.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using APP.Common.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    // Validation errors use the same { success, message } shape as every other API error
    options.InvalidModelStateResponseFactory = context =>
    {
        string message = context.ModelState.Values
            .SelectMany(entry => entry.Errors)
            .Select(error => error.ErrorMessage)
            .FirstOrDefault(text => !string.IsNullOrWhiteSpace(text))
            ?? "Invalid request data.";

        return new BadRequestObjectResult(new ApiResponse<object>
        {
            Success = false,
            Message = message,
            ErrorCode = "VALIDATION_ERROR",
            Data = null
        });
    };
});
// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT token. Example: Bearer {token}"
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
});

// Business Services
builder.Services.AddSingleton<PasswordService>();
builder.Services.AddScoped<RequestService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AdvancedRequestService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<CommentService>();
builder.Services.AddScoped<RequestHistoryService>();
builder.Services.AddScoped<RequestExportService>();

// JWT signing and validation configuration.
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"];

if (string.IsNullOrWhiteSpace(jwtKey) ||
    System.Text.Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key is missing or shorter than 32 bytes. Configure it using User Secrets locally or an environment variable when hosted.");
}


builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

// Authorization
builder.Services.AddAuthorization();

// Rate limiting (applied to login and register only, see AuthController)
var rateLimitSection = builder.Configuration.GetSection("RateLimiting");

int loginPermitLimit = Math.Max(1, rateLimitSection.GetValue<int>("Login:PermitLimit", 20));
int loginWindowSeconds = Math.Max(1, rateLimitSection.GetValue<int>("Login:WindowSeconds", 60));
int registerPermitLimit = Math.Max(1, rateLimitSection.GetValue<int>("Register:PermitLimit", 10));
int registerWindowSeconds = Math.Max(1, rateLimitSection.GetValue<int>("Register:WindowSeconds", 600));
bool trustForwardedHeaders = rateLimitSection.GetValue<bool>("TrustForwardedHeaders", false);

// One counter per client IP address
static string GetClientKey(HttpContext httpContext)
{
    return httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientKey(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = loginPermitLimit,
                Window = TimeSpan.FromSeconds(loginWindowSeconds),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("register", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientKey(httpContext),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = registerPermitLimit,
                Window = TimeSpan.FromSeconds(registerWindowSeconds),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    // Same { success, message } shape as every other API error
    options.OnRejected = async (context, cancellationToken) =>
    {
        string message = "Too many requests. Please try again later.";

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out TimeSpan retryAfter))
        {
            int seconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds));

            context.HttpContext.Response.Headers["Retry-After"] = seconds.ToString();
            message = $"Too many requests. Please try again in {seconds} seconds.";
        }

        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

        await context.HttpContext.Response.WriteAsJsonAsync(
            new ApiResponse<object>
            {
                Success = false,
                Message = message,
                ErrorCode = "RATE_LIMITED",
                Data = null
            },
            cancellationToken);
    };
});

// CORS - Angular
builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Only when the host sits behind a reverse proxy / CDN: read the real client IP.
// Leave RateLimiting:TrustForwardedHeaders = false when the API is reached directly,
// otherwise a caller could fake the header and dodge the IP limit.
if (trustForwardedHeaders)
{
    var forwardedOptions = new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    };

    forwardedOptions.KnownNetworks.Clear();
    forwardedOptions.KnownProxies.Clear();

    app.UseForwardedHeaders(forwardedOptions);
}

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS
app.UseHttpsRedirection();

// CORS
app.UseCors("AngularPolicy");

// Rate limiter (after CORS so the 429 response still reaches the Angular app)
app.UseRateLimiter();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Controllers
app.MapControllers();

app.Run();