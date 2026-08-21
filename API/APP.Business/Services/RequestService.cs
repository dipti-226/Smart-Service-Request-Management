using APP.Common.Models;
using APP.Models.DTOs.Requests;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace APP.Business.Services
{
    public class RequestService
    {
        private readonly string _connectionString;

        public RequestService(IConfiguration configuration)
        {
            _connectionString =
                configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException(
                    "DefaultConnection is not configured."
                );
        }

        public async Task<ApiResponse<RequestResponseDto>> CreateRequestAsync(
            CreateRequestDto dto)
        {
            try
            {
                await using SqlConnection connection =
                    new SqlConnection(_connectionString);

                await using SqlCommand command =
                    new SqlCommand("SSR_Request_Create", connection);

                command.CommandType = CommandType.StoredProcedure;

                command.Parameters.AddWithValue(
                    "@RequestType",
                    dto.RequestType);

                command.Parameters.AddWithValue(
                    "@RequestDescription",
                    dto.RequestDescription);

                command.Parameters.AddWithValue(
                    "@Priority",
                    dto.Priority);

                await connection.OpenAsync();

                await using SqlDataReader reader =
                    await command.ExecuteReaderAsync();

                if (!await reader.ReadAsync())
                {
                    return new ApiResponse<RequestResponseDto>
                    {
                        Success = false,
                        Message = "Request could not be created.",
                        Data = null
                    };
                }

                var request = MapRequest(reader);

                return new ApiResponse<RequestResponseDto>
                {
                    Success = true,
                    Message = "Request created successfully.",
                    Data = request
                };
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<ApiResponse<List<RequestResponseDto>>> GetAllRequestsAsync()
        {
            await using SqlConnection connection =
                new SqlConnection(_connectionString);

            await using SqlCommand command =
                new SqlCommand("SSR_Request_GetAll", connection);

            command.CommandType = CommandType.StoredProcedure;

            await connection.OpenAsync();

            await using SqlDataReader reader =
                await command.ExecuteReaderAsync();

            var requests = new List<RequestResponseDto>();

            while (await reader.ReadAsync())
            {
                requests.Add(MapRequest(reader));
            }

            return new ApiResponse<List<RequestResponseDto>>
            {
                Success = true,
                Message = "Requests retrieved successfully.",
                Data = requests
            };
        }

        public async Task<ApiResponse<RequestResponseDto>> GetRequestByIdAsync(
            int requestId)
        {
            await using SqlConnection connection =
                new SqlConnection(_connectionString);

            await using SqlCommand command =
                new SqlCommand("SSR_Request_GetById", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.AddWithValue("@RequestId", requestId);

            await connection.OpenAsync();

            await using SqlDataReader reader =
                await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return new ApiResponse<RequestResponseDto>
                {
                    Success = false,
                    Message = "Request not found.",
                    Data = null
                };
            }

            var request = MapRequest(reader);

            return new ApiResponse<RequestResponseDto>
            {
                Success = true,
                Message = "Request retrieved successfully.",
                Data = request
            };
        }

        public async Task<ApiResponse<DashboardDto>> GetDashboardAsync()
        {
            await using SqlConnection connection =
                new SqlConnection(_connectionString);

            await using SqlCommand command =
                new SqlCommand("SSR_Request_Dashboard_GetTotalCount", connection);

            command.CommandType = CommandType.StoredProcedure;

            await connection.OpenAsync();

            await using SqlDataReader reader =
                await command.ExecuteReaderAsync();

            var dashboard = new DashboardDto();

            if (await reader.ReadAsync())
            {
                dashboard.TotalRequests = reader["TotalRequests"] == DBNull.Value
                    ? 0 : Convert.ToInt32(reader["TotalRequests"]);

                dashboard.OpenRequests = reader["OpenRequests"] == DBNull.Value
                    ? 0 : Convert.ToInt32(reader["OpenRequests"]);

                dashboard.InProgressRequests = reader["InProgressRequests"] == DBNull.Value
                    ? 0 : Convert.ToInt32(reader["InProgressRequests"]);

                dashboard.ResolvedRequests = reader["ResolvedRequests"] == DBNull.Value
                    ? 0 : Convert.ToInt32(reader["ResolvedRequests"]);
            }

            return new ApiResponse<DashboardDto>
            {
                Success = true,
                Message = "Dashboard data retrieved successfully.",
                Data = dashboard
            };
        }

        private static RequestResponseDto MapRequest(SqlDataReader reader)
        {
            return new RequestResponseDto
            {
                RequestId = Convert.ToInt32(reader["RequestId"]),

                RequestCode =
                    reader["RequestCode"]?.ToString() ?? string.Empty,

                RequestType =
                    reader["RequestType"]?.ToString() ?? string.Empty,

                RequestDescription =
                    reader["RequestDescription"]?.ToString() ?? string.Empty,

                Priority =
                    reader["Priority"]?.ToString() ?? string.Empty,

                Status =
                    reader["Status"]?.ToString() ?? string.Empty,

                CreatedDate =
                    Convert.ToDateTime(reader["CreatedDate"]),

                UpdatedDate =
                    reader["UpdatedDate"] == DBNull.Value
                        ? null
                        : Convert.ToDateTime(reader["UpdatedDate"])
            };
        }

        public async Task<ApiResponse<RequestResponseDto>> UpdateRequestAsync(
            int requestId,
            UpdateRequestDto dto)
        {
            await using SqlConnection connection =
                new SqlConnection(_connectionString);

            await using SqlCommand command =
                new SqlCommand("SSR_Request_Update", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.AddWithValue("@RequestId", requestId);
            command.Parameters.AddWithValue("@RequestType", dto.RequestType);
            command.Parameters.AddWithValue("@RequestDescription", dto.RequestDescription);
            command.Parameters.AddWithValue("@Priority", dto.Priority);
            command.Parameters.AddWithValue("@Status", dto.Status);

            await connection.OpenAsync();

            await using SqlDataReader reader =
                await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return new ApiResponse<RequestResponseDto>
                {
                    Success = false,
                    Message = "Request not found or already inactive.",
                    Data = null
                };
            }

            var request = MapRequest(reader);

            return new ApiResponse<RequestResponseDto>
            {
                Success = true,
                Message = "Request updated successfully.",
                Data = request
            };
        }

        public async Task<ApiResponse<bool>> SoftDeleteRequestAsync(int requestId)
        {
            await using SqlConnection connection =
                new SqlConnection(_connectionString);

            await using SqlCommand command =
                new SqlCommand("SSR_Request_SoftDelete", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.AddWithValue("@RequestId", requestId);

            await connection.OpenAsync();

            object? result = await command.ExecuteScalarAsync();

            int rowsAffected = result == null ? 0 : Convert.ToInt32(result);

            if (rowsAffected == 0)
            {
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Request not found.",
                    Data = false
                };
            }

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Request deleted successfully.",
                Data = true
            };
        }
    }
}
