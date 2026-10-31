using APP.Common.Models;
using APP.Models.DTOs.Technicians;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace APP.Business.Services
{
    public class TechnicianRecommendationService
    {
        private readonly string _connectionString;
        private readonly int _maxActiveRequests;

        public TechnicianRecommendationService(IConfiguration configuration)
        {
            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection is not configured.");

            // Same setting the assignment check uses
            _maxActiveRequests =
                int.TryParse(configuration["Workload:MaxActiveRequestsPerTechnician"], out int max) && max > 0
                    ? max
                    : 3;
        }

        // The technician the admin should consider for this request
        public async Task<ApiResponse<TechnicianRecommendationDto>> GetRecommendationAsync(int requestId)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Request_GetRecommendedTechnician", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
            command.Parameters.Add("@MaxActiveRequests", SqlDbType.Int).Value = _maxActiveRequests;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            // No row: the request is fine, but nobody can take it right now
            if (!await reader.ReadAsync())
            {
                return new ApiResponse<TechnicianRecommendationDto>
                {
                    Success = true,
                    Message = "No technician is available.",
                    Data = new TechnicianRecommendationDto
                    {
                        HasRecommendation = false,
                        MaxActiveRequests = _maxActiveRequests,
                        Reason = "No technician is available right now. Every technician is at full capacity."
                    }
                };
            }

            if (HasColumn(reader, "ErrorCode"))
            {
                string errorCode = reader["ErrorCode"]?.ToString() ?? string.Empty;

                return new ApiResponse<TechnicianRecommendationDto>
                {
                    Success = false,
                    Message = errorCode == "REQUEST_LOCKED"
                        ? "A technician cannot be assigned to a cancelled or closed request."
                        : "Request not found.",
                    ErrorCode = errorCode == "REQUEST_LOCKED" ? "REQUEST_LOCKED" : "NOT_FOUND",
                    Data = null
                };
            }

            string requestType = reader["RequestType"]?.ToString() ?? string.Empty;
            int activeRequests = Convert.ToInt32(reader["ActiveRequests"]);
            bool matches = Convert.ToBoolean(reader["MatchesSpecialization"]);

            string reason = matches
                ? $"Specialist for {requestType} requests with the lightest workload ({activeRequests}/{_maxActiveRequests})."
                : $"No available {requestType} specialist, so this is the least busy technician ({activeRequests}/{_maxActiveRequests}).";

            return new ApiResponse<TechnicianRecommendationDto>
            {
                Success = true,
                Message = "Recommendation retrieved successfully.",
                Data = new TechnicianRecommendationDto
                {
                    HasRecommendation = true,
                    TechnicianId = Convert.ToInt32(reader["TechnicianId"]),
                    TechnicianName = reader["TechnicianName"]?.ToString() ?? string.Empty,
                    ActiveRequests = activeRequests,
                    MaxActiveRequests = _maxActiveRequests,
                    MatchesSpecialization = matches,
                    Reason = reason
                }
            };
        }

        private static bool HasColumn(SqlDataReader reader, string columnName)
        {
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (string.Equals(reader.GetName(i), columnName, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
    }
}