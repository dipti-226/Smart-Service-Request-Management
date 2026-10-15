using APP.Common.Models;
using APP.Models.DTOs.AdvancedRequests;
using APP.Models.DTOs.Technicians;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace APP.Business.Services
{
    public class AdvancedRequestService
    {
        private readonly string _connectionString;

        public AdvancedRequestService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection is not configured.");
        }
        // Get Request Details

        public async Task<ApiResponse<AdvancedRequestDto>> GetRequestDetailsAsync(int requestId)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_AdvancedRequest_GetById", connection);

            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@RequestId", requestId);
            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
            {
                return new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = "Request not found.",
                    Data = null
                };
            }

            var request = MapRequest(reader);

            return new ApiResponse<AdvancedRequestDto>
            {
                Success = true,
                Message = "Request details retrieved successfully.",
                Data = request
            };
        }

        // One request, only if it is assigned to the logged-in technician.
        // "Not found" is returned for missing AND not-assigned requests.
        public async Task<ApiResponse<AdvancedRequestDto>> GetAssignedRequestDetailsAsync(int requestId,int technicianUserId)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Request_GetAssignedById", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
            command.Parameters.Add("@TechnicianUserId", SqlDbType.Int).Value = technicianUserId;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = "Request not found.",
                    Data = null
                };
            }

            return new ApiResponse<AdvancedRequestDto>
            {
                Success = true,
                Message = "Request details retrieved successfully.",
                Data = MapRequest(reader)
            };
        }
        // Get Technicians

        public async Task<ApiResponse<List<TechnicianDto>>>GetTechniciansAsync()
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Technician_GetAll", connection);

            command.CommandType = CommandType.StoredProcedure;

            await connection.OpenAsync();

            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            var technicians = new List<TechnicianDto>();

            while (await reader.ReadAsync())
            {
                technicians.Add(new TechnicianDto
                {
                    TechnicianId = Convert.ToInt32(reader["TechnicianId"]),
                    TechnicianName = reader["TechnicianName"]?.ToString() ?? string.Empty,
                    IsActive = Convert.ToBoolean(reader["IsActive"]),
                    CreatedDate = Convert.ToDateTime(reader["CreatedDate"])
                });
            }

            return new ApiResponse<List<TechnicianDto>>
            {
                Success = true,
                Message = "Technicians retrieved successfully.",
                Data = technicians
            };
        }

        // Update Request Status

        public async Task<ApiResponse<AdvancedRequestDto>>UpdateRequestStatusAsync(int requestId,UpdateRequestStatusDto dto,int? callerUserId = null,string? callerRole = null)
        {
            // Validate status at API/service level
            var allowedStatuses = new[]
            {
                "Open",
                "In Progress",
                "On Hold",
                "Resolved",
                "Closed",
                "Cancelled"
            };

            if (!allowedStatuses.Contains(dto.Status))
            {
                return new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = "Invalid request status.",
                    Data = null
                };
            }

            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Request_UpdateStatus", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@RequestId", requestId);
            command.Parameters.AddWithValue("@Status", dto.Status);

            // Caller info: used by the SP for ownership, transition rules and history
            command.Parameters.Add("@CallerUserId", SqlDbType.Int).Value =(object?)callerUserId ?? DBNull.Value;
            command.Parameters.Add("@CallerRole", SqlDbType.NVarChar, 50).Value =(object?)callerRole ?? DBNull.Value;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
            {
                return new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = "Request not found or already inactive.",
                    Data = null
                };
            }

            // The SP returned only an error row
            if (HasColumn(reader, "ErrorCode"))
            {
                string errorCode = reader["ErrorCode"]?.ToString() ?? string.Empty;

                string currentStatus = HasColumn(reader, "CurrentStatus")? reader["CurrentStatus"]?.ToString() ?? string.Empty: string.Empty;

                string message = errorCode switch
                {
                    "NOT_ASSIGNED" => "You can update the status only for requests assigned to you.",
                    "NOT_OWNER" => "You can update the status only for your own requests.",
                    "INVALID_TRANSITION" =>
                        string.Equals(currentStatus, dto.Status, StringComparison.OrdinalIgnoreCase)
                            ? $"Request is already in '{currentStatus}' status."
                            : $"Status cannot be changed from '{currentStatus}' to '{dto.Status}'.",
                    _ => "Request status could not be updated."
                };

                return new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = message,
                    ErrorCode = errorCode,
                    Data = null
                };
            }

            var request = MapRequest(reader);

            return new ApiResponse<AdvancedRequestDto>
            {
                Success = true,
                Message = "Request status updated successfully.",
                Data = request
            };
        }

        public async Task<ApiResponse<List<string>>> GetAllowedStatusesAsync(int requestId,int? callerUserId,string callerRole)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Request_GetAllowedStatuses", connection);
            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
            command.Parameters.Add("@CallerUserId", SqlDbType.Int).Value = (object?)callerUserId ?? DBNull.Value;
            command.Parameters.Add("@CallerRole", SqlDbType.NVarChar, 50).Value = callerRole;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            var statuses = new List<string>();

            while (await reader.ReadAsync())
            {
                statuses.Add(reader.GetString(0));
            }

            return new ApiResponse<List<string>>
            {
                Success = true,
                Message = "Allowed statuses retrieved successfully.",
                Data = statuses
            };
        }

        // Assign Technician

        public async Task<ApiResponse<AdvancedRequestDto>>AssignTechnicianAsync(int requestId, AssignTechnicianDto dto)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Request_AssignTechnician", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@RequestId", requestId);
            command.Parameters.AddWithValue("@TechnicianId", dto.TechnicianId);

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = "Request or technician not found.",
                    Data = null
                };
            }

            // SP returned only an ErrorCode column (request or technician not valid)
            if (HasColumn(reader, "ErrorCode"))
            {
                string errorCode = reader["ErrorCode"]?.ToString() ?? string.Empty;

                string message = errorCode switch
                {
                    "REQUEST_NOT_FOUND" => "Request not found or already inactive.",
                    "TECHNICIAN_NOT_FOUND" => "Technician not found or inactive.",
                    _ => "Request or technician not found."
                };

                return new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = message,
                    ErrorCode = errorCode,
                    Data = null
                };
            }

            var request = MapRequest(reader);

            return new ApiResponse<AdvancedRequestDto>
            {
                Success = true,
                Message = "Technician assigned successfully.",
                Data = request
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
        // Mapping
        private static AdvancedRequestDto MapRequest(SqlDataReader reader)
        {
            return new AdvancedRequestDto
            {
                RequestId = Convert.ToInt32(reader["RequestId"]),
                RequestCode = reader["RequestCode"]?.ToString() ?? string.Empty,
                RequestType = reader["RequestType"]?.ToString() ?? string.Empty,
                RequestDescription = reader["RequestDescription"]?.ToString() ?? string.Empty,
                Priority = reader["Priority"]?.ToString() ?? string.Empty,
                Status = reader["Status"]?.ToString() ?? string.Empty,
                TechnicianId = reader["TechnicianId"] == DBNull.Value ? null : Convert.ToInt32(reader["TechnicianId"]),
                TechnicianName = reader["TechnicianName"] == DBNull.Value ? null : reader["TechnicianName"]?.ToString(),
                CreatedDate = Convert.ToDateTime(reader["CreatedDate"]),
                UpdatedDate = reader["UpdatedDate"] == DBNull.Value ? null : Convert.ToDateTime(reader["UpdatedDate"])
            };
        }
    }
}
