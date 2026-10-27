using APP.Common.Models;
using APP.Models.DTOs.AdvancedRequests;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace APP.Business.Services
{
    public class RequestHistoryService
    {
        private readonly string _connectionString;

        public RequestHistoryService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection is not configured.");
        }

        // Status history of a request, oldest first. Read-only.
        // "Not found" is returned for missing AND not-allowed requests.
        public async Task<ApiResponse<List<RequestStatusHistoryDto>>> GetStatusHistoryAsync(int requestId, int callerUserId, string callerRole)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_Request_GetStatusHistory", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
            command.Parameters.Add("@CallerUserId", SqlDbType.Int).Value = callerUserId;
            command.Parameters.Add("@CallerRole", SqlDbType.NVarChar, 50).Value = callerRole;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            var history = new List<RequestStatusHistoryDto>();

            while (await reader.ReadAsync())
            {
                // The SP returned only an error row
                if (history.Count == 0 && HasColumn(reader, "ErrorCode"))
                {
                    return new ApiResponse<List<RequestStatusHistoryDto>>
                    {
                        Success = false,
                        Message = "Request not found.",
                        ErrorCode = "NOT_FOUND",
                        Data = null
                    };
                }

                history.Add(MapHistory(reader));
            }

            return new ApiResponse<List<RequestStatusHistoryDto>>
            {
                Success = true,
                Message = "Status history retrieved successfully.",
                Data = history
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

        private static string? GetNullableString(SqlDataReader reader, string columnName)
        {
            int ordinal = reader.GetOrdinal(columnName);

            return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
        }

        private static RequestStatusHistoryDto MapHistory(SqlDataReader reader)
        {
            int userOrdinal = reader.GetOrdinal("ChangedByUserId");

            return new RequestStatusHistoryDto
            {
                HistoryId = Convert.ToInt32(reader["HistoryId"]),
                RequestId = Convert.ToInt32(reader["RequestId"]),
                OldStatus = GetNullableString(reader, "OldStatus"),
                NewStatus = reader["NewStatus"]?.ToString() ?? string.Empty,
                ChangedByUserId = reader.IsDBNull(userOrdinal) ? (int?)null : Convert.ToInt32(reader["ChangedByUserId"]),
                ChangedByUsername = GetNullableString(reader, "ChangedByUsername"),
                ChangedByRole = GetNullableString(reader, "ChangedByRole"),
                Remarks = GetNullableString(reader, "Remarks"),
                ChangedDate = Convert.ToDateTime(reader["ChangedDate"])
            };
        }
    }
}