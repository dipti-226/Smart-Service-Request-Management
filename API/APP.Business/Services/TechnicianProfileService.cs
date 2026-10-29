using APP.Common.Models;
using APP.Models.DTOs.Technicians;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace APP.Business.Services
{
    public class TechnicianProfileService
    {
        private readonly string _connectionString;

        public TechnicianProfileService(IConfiguration configuration)
        {
            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection is not configured.");
        }

        // The logged-in technician's own profile
        public async Task<ApiResponse<TechnicianProfileDto>> GetMyProfileAsync(int userId)
        {
            TechnicianProfileDto? profile = await LoadProfileAsync(userId);

            if (profile is null)
            {
                return NotFoundResponse();
            }

            return new ApiResponse<TechnicianProfileDto>
            {
                Success = true,
                Message = "Profile retrieved successfully.",
                Data = profile
            };
        }

        // Saves the name, phone and specializations, then returns the saved profile
        public async Task<ApiResponse<TechnicianProfileDto>> SaveMyProfileAsync(int userId,SaveTechnicianProfileDto dto)
        {
            bool saved;
            string errorCode;

            await using (SqlConnection connection = new SqlConnection(_connectionString))
            await using (SqlCommand command = new SqlCommand("SSR_TechnicianProfile_Save", connection))
            {
                command.CommandType = CommandType.StoredProcedure;

                command.Parameters.Add("@UserId", SqlDbType.Int).Value = userId;
                command.Parameters.Add("@FullName", SqlDbType.NVarChar, 100).Value = dto.FullName.Trim();
                command.Parameters.Add("@Phone", SqlDbType.NVarChar, 20).Value = string.IsNullOrWhiteSpace(dto.Phone) ? DBNull.Value : dto.Phone.Trim();
                command.Parameters.Add("@SpecializationIds", SqlDbType.NVarChar, 500).Value = string.Join(",", dto.SpecializationIds.Distinct());

                await connection.OpenAsync();
                await using SqlDataReader reader = await command.ExecuteReaderAsync();

                if (!await reader.ReadAsync())
                {
                    return SaveFailedResponse("Unable to save your profile.", "SAVE_FAILED");
                }

                saved = Convert.ToBoolean(reader["Success"]);
                errorCode = reader["ErrorCode"]?.ToString() ?? string.Empty;
            }

            if (!saved)
            {
                return errorCode switch
                {
                    "TECHNICIAN_NOT_FOUND" => NotFoundResponse(),
                    "NO_SPECIALIZATION" or "INVALID_SPECIALIZATION" =>
                        SaveFailedResponse("Select at least one valid specialization.", "INVALID_SPECIALIZATION"),
                    _ => SaveFailedResponse("Unable to save your profile.", "SAVE_FAILED")
                };
            }

            TechnicianProfileDto? profile = await LoadProfileAsync(userId);

            if (profile is null)
            {
                return NotFoundResponse();
            }

            return new ApiResponse<TechnicianProfileDto>
            {
                Success = true,
                Message = "Profile saved successfully.",
                Data = profile
            };
        }

        private async Task<TechnicianProfileDto?> LoadProfileAsync(int userId)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_TechnicianProfile_GetByUserId", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@UserId", SqlDbType.Int).Value = userId;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            // Result set 1: the profile (no row = not an active technician)
            if (!await reader.ReadAsync())
            {
                return null;
            }

            var profile = new TechnicianProfileDto
            {
                UserId = Convert.ToInt32(reader["UserId"]),
                Username = reader["Username"]?.ToString() ?? string.Empty,
                Email = reader["Email"]?.ToString() ?? string.Empty,
                TechnicianId = Convert.ToInt32(reader["TechnicianId"]),
                FullName = reader["FullName"]?.ToString() ?? string.Empty,
                Phone = reader["Phone"]?.ToString() ?? string.Empty,
                IsProfileComplete = Convert.ToBoolean(reader["IsProfileComplete"])
            };

            // Result set 2: every active specialization
            await reader.NextResultAsync();

            while (await reader.ReadAsync())
            {
                profile.Specializations.Add(new SpecializationDto
                {
                    SpecializationId = Convert.ToInt32(reader["SpecializationId"]),
                    Name = reader["Name"]?.ToString() ?? string.Empty,
                    RequestType = reader["RequestType"]?.ToString() ?? string.Empty,
                    IsSelected = Convert.ToBoolean(reader["IsSelected"])
                });
            }

            return profile;
        }

        private static ApiResponse<TechnicianProfileDto> NotFoundResponse()
        {
            return new ApiResponse<TechnicianProfileDto>
            {
                Success = false,
                Message = "Technician profile not found.",
                ErrorCode = "NOT_FOUND",
                Data = null
            };
        }

        private static ApiResponse<TechnicianProfileDto> SaveFailedResponse(string message, string errorCode)
        {
            return new ApiResponse<TechnicianProfileDto>
            {
                Success = false,
                Message = message,
                ErrorCode = errorCode,
                Data = null
            };
        }
    }
}