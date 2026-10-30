using APP.Common.Models;
using APP.Models.DTOs.AdvancedRequests;
using APP.Models.DTOs.Technicians;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;
using APP.Models.DTOs.Requests;

namespace APP.Business.Services
{
    public class AdvancedRequestService
    {
        private readonly string _connectionString;

        // Most Open / In Progress / On Hold requests one technician may hold at a time
        private readonly int _maxActiveRequests;

        public AdvancedRequestService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection is not configured.");

            _maxActiveRequests =
                int.TryParse(configuration["Workload:MaxActiveRequestsPerTechnician"], out int max) && max > 0
                    ? max
                    : 3;
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
        public async Task<ApiResponse<AdvancedRequestDto>> GetAssignedRequestDetailsAsync(int requestId, int technicianUserId)
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

        // One request, only if the logged-in employee created it.
        // "Not found" is returned for missing AND not-own requests.
        public async Task<ApiResponse<AdvancedRequestDto>> GetOwnRequestDetailsAsync(int requestId,int callerUserId)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Request_GetOwnById", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
            command.Parameters.Add("@CallerUserId", SqlDbType.Int).Value = callerUserId;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = "Request not found.",
                    ErrorCode = "NOT_FOUND",
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

        // Edit an own request (type, description, priority) while it is Open
        public async Task<ApiResponse<AdvancedRequestDto>> UpdateOwnRequestAsync(int requestId,UpdateOwnRequestDto dto,int callerUserId)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Request_UpdateOwn", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
            command.Parameters.Add("@CallerUserId", SqlDbType.Int).Value = callerUserId;
            command.Parameters.Add("@RequestType", SqlDbType.NVarChar, 100).Value = dto.RequestType.Trim();
            command.Parameters.Add("@RequestDescription", SqlDbType.NVarChar, 1000).Value = dto.RequestDescription.Trim();
            command.Parameters.Add("@Priority", SqlDbType.NVarChar, 20).Value = dto.Priority;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = "Request not found.",
                    ErrorCode = "NOT_FOUND",
                    Data = null
                };
            }

            // The SP returned only an error row
            if (HasColumn(reader, "ErrorCode"))
            {
                string currentStatus = HasColumn(reader, "CurrentStatus")
                    ? reader["CurrentStatus"]?.ToString() ?? string.Empty
                    : string.Empty;

                return new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = $"Only requests in 'Open' status can be edited. This request is '{currentStatus}'.",
                    ErrorCode = "NOT_OPEN",
                    Data = null
                };
            }

            return new ApiResponse<AdvancedRequestDto>
            {
                Success = true,
                Message = "Request updated successfully.",
                Data = MapRequest(reader)
            };
        }

        // Cancel an own request while it is Open.
        // Uses the normal status update (Employee role), so the transition rules
        // and the status history are applied exactly as for every other status change.
        public async Task<ApiResponse<AdvancedRequestDto>> CancelOwnRequestAsync(int requestId,int callerUserId)
        {
            var result = await UpdateRequestStatusAsync(
                requestId,
                new UpdateRequestStatusDto { Status = "Cancelled" },
                callerUserId,
                "Employee");

            if (result.Success)
            {
                result.Message = "Request cancelled successfully.";
                return result;
            }

            if (result.ErrorCode == "INVALID_TRANSITION")
            {
                result.Message = "Only requests in 'Open' status can be cancelled.";
                result.ErrorCode = "NOT_OPEN";
            }
            else
            {
                // Not the owner, or the request does not exist: same answer for both
                result.Message = "Request not found.";
                result.ErrorCode = "NOT_FOUND";
            }

            return result;
        }

        // Close an own request after it is Resolved
        public Task<ApiResponse<AdvancedRequestDto>> CloseOwnRequestAsync(int requestId, int callerUserId)
        {
            return ChangeOwnStatusAsync(
                requestId, callerUserId, "Closed",
                "Request closed successfully.",
                "Only requests in 'Resolved' status can be closed.");
        }

        // Reopen an own request after it is Resolved (status goes back to Open)
        public Task<ApiResponse<AdvancedRequestDto>> ReopenOwnRequestAsync(int requestId, int callerUserId)
        {
            return ChangeOwnStatusAsync(
                requestId, callerUserId, "Open",
                "Request reopened successfully.",
                "Only requests in 'Resolved' status can be reopened.");
        }

        // Same normal status update as cancel: ownership, transition rules and history
        // are all applied by SSR_Request_UpdateStatus with the Employee role.
        private async Task<ApiResponse<AdvancedRequestDto>> ChangeOwnStatusAsync(int requestId,int callerUserId,string newStatus,string successMessage,string wrongStatusMessage)
        {
            var result = await UpdateRequestStatusAsync(
                requestId,
                new UpdateRequestStatusDto { Status = newStatus },
                callerUserId,
                "Employee");

            if (result.Success)
            {
                result.Message = successMessage;
                return result;
            }

            if (result.ErrorCode == "INVALID_TRANSITION")
            {
                result.Message = wrongStatusMessage;
                result.ErrorCode = "NOT_RESOLVED";
            }
            else
            {
                // Not the owner, or the request does not exist: same answer for both
                result.Message = "Request not found.";
                result.ErrorCode = "NOT_FOUND";
            }

            return result;
        }
        // Get Technicians
        public async Task<ApiResponse<List<TechnicianDto>>> GetTechniciansAsync()
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
                    CreatedDate = Convert.ToDateTime(reader["CreatedDate"]),
                    FullName = reader["FullName"]?.ToString() ?? string.Empty,
                    Specializations = reader["Specializations"]?.ToString() ?? string.Empty,
                    ActiveRequests = Convert.ToInt32(reader["ActiveRequests"]),
                    MaxActiveRequests = _maxActiveRequests,
                    IsAtCapacity = Convert.ToInt32(reader["ActiveRequests"]) >= _maxActiveRequests
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

        public async Task<ApiResponse<AdvancedRequestDto>> UpdateRequestStatusAsync(int requestId, UpdateRequestStatusDto dto, int? callerUserId = null, string? callerRole = null)
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
            command.Parameters.Add("@CallerUserId", SqlDbType.Int).Value = (object?)callerUserId ?? DBNull.Value;
            command.Parameters.Add("@CallerRole", SqlDbType.NVarChar, 50).Value = (object?)callerRole ?? DBNull.Value;

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

                string currentStatus = HasColumn(reader, "CurrentStatus") ? reader["CurrentStatus"]?.ToString() ?? string.Empty : string.Empty;

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

        public async Task<ApiResponse<List<string>>> GetAllowedStatusesAsync(int requestId, int? callerUserId, string callerRole)
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

        public async Task<ApiResponse<AdvancedRequestDto>> AssignTechnicianAsync(int requestId, AssignTechnicianDto dto)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Request_AssignTechnician", connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@RequestId", requestId);
            command.Parameters.AddWithValue("@TechnicianId", dto.TechnicianId);
            command.Parameters.AddWithValue("@MaxActiveRequests", _maxActiveRequests);

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
                    "TECHNICIAN_AT_CAPACITY" =>
                        $"This technician already has {_maxActiveRequests} active requests (Open, In Progress or On Hold), which is the limit. Choose another technician.",
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