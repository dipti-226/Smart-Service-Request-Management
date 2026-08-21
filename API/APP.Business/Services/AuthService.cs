using APP.Common.Models;
using APP.Models.DTOs.Auth;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace APP.Business.Services
{
    public class AuthService
    {
        private readonly string _connectionString;
        private readonly IConfiguration _configuration;

        public AuthService(IConfiguration configuration)
        {
            _configuration = configuration;

            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException(
                    "DefaultConnection is not configured.");
        }

        public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginRequestDto dto)
        {
            await using SqlConnection connection =
                new SqlConnection(_connectionString);

            await using SqlCommand command =
                new SqlCommand("SSR_Admin_GetByUsername", connection);

            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@AdminName", dto.AdminName);

            await connection.OpenAsync();

            await using SqlDataReader reader =
                await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return new ApiResponse<LoginResponseDto>
                {
                    Success = false,
                    Message = "Invalid username or password.",
                    Data = null
                };
            }

            int adminId = Convert.ToInt32(reader["AdminId"]);
            string adminName = reader["AdminName"]?.ToString() ?? string.Empty;
            string storedPassword = reader["Password"]?.ToString() ?? string.Empty;

            await reader.CloseAsync();

            if (!string.Equals(dto.Password, storedPassword, StringComparison.Ordinal))
            {
                return new ApiResponse<LoginResponseDto>
                {
                    Success = false,
                    Message = "Invalid username or password.",
                    Data = null
                };
            }

            int expiryMinutes = GetExpiryMinutes();
            string token = GenerateJwtToken(adminId, adminName, expiryMinutes);

            return new ApiResponse<LoginResponseDto>
            {
                Success = true,
                Message = "Login successful.",
                Data = new LoginResponseDto
                {
                    Token = token,
                    AdminName = adminName,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
                }
            };
        }

        private string GenerateJwtToken(int adminId, string adminName, int expiryMinutes)
        {
            var jwtSection = _configuration.GetSection("Jwt");

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    jwtSection["Key"]
                    ?? throw new InvalidOperationException("Jwt:Key is not configured.")));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, adminName),
                new Claim("adminId", adminId.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: jwtSection["Issuer"],
                audience: jwtSection["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private int GetExpiryMinutes()
        {
            return int.TryParse(_configuration["Jwt:ExpiryMinutes"], out int minutes)
                ? minutes
                : 60;
        }
    }
}
