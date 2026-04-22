namespace NovaCare.API.DTOs;

public record LoginRequest(string Email, string Password);

public record LoginResponse(
    string Token,
    int Id,
    string FirstName,
    string LastName,
    string Email,
    int Role,
    int? BranchId,
    bool MustChangePassword,
    string[] Permissions
);

public record RegisterRequest(string FirstName, string LastName, string Email, string Password, string Phone);

public record RegisterResponse(string Email, string Message);

public record VerifyOtpRequest(string Email, string OtpCode);

public record ResendOtpRequest(string Email);
