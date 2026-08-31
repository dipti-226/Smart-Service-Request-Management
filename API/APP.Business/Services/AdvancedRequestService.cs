using APP.Common.Models;
using APP.Models.DTOs.AdvancedRequests;
using APP.Models.DTOs.Technicians;
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
    public class AdvancedRequestService
    {
        private readonly string _connectionString;

        public AdvancedRequestService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException(
                    "DefaultConnection is not configured."
                );
        }
        // Get Request Details

        public async Task<ApiResponse<AdvancedRequestDto>> GetRequestDetailsAsync(
            int requestId)
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

        // Get Technicians

        public async Task<ApiResponse<List<TechnicianDto>>>
            GetTechniciansAsync()
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

        public async Task<ApiResponse<AdvancedRequestDto>>
            UpdateRequestStatusAsync(int requestId,UpdateRequestStatusDto dto)
        {
            // Validate status at API/service level
            var allowedStatuses = new[]
            {
                "Open",
                "In Progress",
                "Resolved"
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
            await using SqlCommand command =new SqlCommand("SSR_Request_UpdateStatus",connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@RequestId",requestId);
            command.Parameters.AddWithValue("@Status",dto.Status);
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

            var request = MapRequest(reader);

            return new ApiResponse<AdvancedRequestDto>
            {
                Success = true,
                Message = "Request status updated successfully.",
                Data = request
            };
        }

        // Assign Technician

        public async Task<ApiResponse<AdvancedRequestDto>>
            AssignTechnicianAsync(int requestId,AssignTechnicianDto dto)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Request_AssignTechnician",connection);
            command.CommandType = CommandType.StoredProcedure;
            command.Parameters.AddWithValue("@RequestId",requestId);
            command.Parameters.AddWithValue("@TechnicianId",dto.TechnicianId);
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

            var request = MapRequest(reader);

            return new ApiResponse<AdvancedRequestDto>
            {
                Success = true,
                Message = "Technician assigned successfully.",
                Data = request
            };
        }

        // Mapping
        private static AdvancedRequestDto MapRequest(
            SqlDataReader reader)
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
