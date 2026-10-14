using APP.Common.Models;
using APP.Models.DTOs.Users;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace APP.Business.Services
{
    public class UserService
    {
        private readonly string _connectionString;

        // Columns the list may be sorted by (anything else falls back to CreatedDate)
        private static readonly HashSet<string> UserSortColumns =
            new(StringComparer.OrdinalIgnoreCase)
            {
                "Username", "Email", "RoleName", "IsActive", "CreatedDate"
            };

        public UserService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection is not configured.");
        }

        public async Task<ApiResponse<PagedResult<UserListItemDto>>> GetUsersPagedAsync(
            UserListQueryDto query)
        {
            string sortBy = !string.IsNullOrWhiteSpace(query.SortBy) &&
                            UserSortColumns.Contains(query.SortBy)
                ? query.SortBy
                : "CreatedDate";

            string sortDir = string.Equals(query.SortDir, "ASC", StringComparison.OrdinalIgnoreCase)
                ? "ASC"
                : "DESC";

            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_User_GetPaged", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@Search", SqlDbType.NVarChar, 100).Value =
                string.IsNullOrWhiteSpace(query.Search) ? DBNull.Value : query.Search.Trim();
            command.Parameters.Add("@RoleName", SqlDbType.NVarChar, 50).Value =
                string.IsNullOrWhiteSpace(query.Role) ? DBNull.Value : query.Role;
            command.Parameters.Add("@IsActive", SqlDbType.Bit).Value =
                (object?)query.IsActive ?? DBNull.Value;
            command.Parameters.Add("@SortBy", SqlDbType.NVarChar, 30).Value = sortBy;
            command.Parameters.Add("@SortDir", SqlDbType.NVarChar, 4).Value = sortDir;
            command.Parameters.Add("@PageNumber", SqlDbType.Int).Value = query.PageNumber;
            command.Parameters.Add("@PageSize", SqlDbType.Int).Value = query.PageSize;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            var result = new PagedResult<UserListItemDto>();

            // Result set 1: paging info
            if (await reader.ReadAsync())
            {
                result.TotalCount = Convert.ToInt32(reader["TotalCount"]);
                result.PageNumber = Convert.ToInt32(reader["PageNumber"]);
                result.PageSize = Convert.ToInt32(reader["PageSize"]);
                result.TotalPages = Convert.ToInt32(reader["TotalPages"]);
            }

            // Result set 2: rows
            await reader.NextResultAsync();

            while (await reader.ReadAsync())
            {
                result.Items.Add(MapUser(reader));
            }

            return new ApiResponse<PagedResult<UserListItemDto>>
            {
                Success = true,
                Message = "Users retrieved successfully.",
                Data = result
            };
        }

        public async Task<ApiResponse<UserListItemDto>> SetUserActiveAsync(
            int userId,
            bool isActive,
            int callerUserId)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_User_SetActive", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@UserId", SqlDbType.Int).Value = userId;
            command.Parameters.Add("@IsActive", SqlDbType.Bit).Value = isActive;
            command.Parameters.Add("@CallerUserId", SqlDbType.Int).Value = callerUserId;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return new ApiResponse<UserListItemDto>
                {
                    Success = false,
                    Message = "User status could not be updated.",
                    Data = null
                };
            }

            // The SP returned only an error row
            if (HasColumn(reader, "ErrorCode"))
            {
                string errorCode = reader["ErrorCode"]?.ToString() ?? string.Empty;

                string message = errorCode switch
                {
                    "USER_NOT_FOUND" => "User not found.",
                    "CANNOT_CHANGE_SELF" => "You cannot activate or deactivate your own account.",
                    "ADMIN_NOT_ALLOWED" => "Admin accounts cannot be activated or deactivated.",
                    _ => "User status could not be updated."
                };

                return new ApiResponse<UserListItemDto>
                {
                    Success = false,
                    Message = message,
                    ErrorCode = errorCode,
                    Data = null
                };
            }

            return new ApiResponse<UserListItemDto>
            {
                Success = true,
                Message = isActive
                    ? "User activated successfully."
                    : "User deactivated successfully.",
                Data = MapUser(reader)
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

        private static UserListItemDto MapUser(SqlDataReader reader)
        {
            return new UserListItemDto
            {
                UserId = Convert.ToInt32(reader["UserId"]),
                Username = reader["Username"]?.ToString() ?? string.Empty,
                Email = reader["Email"]?.ToString() ?? string.Empty,
                RoleName = reader["RoleName"]?.ToString() ?? string.Empty,
                IsActive = Convert.ToBoolean(reader["IsActive"]),
                CreatedDate = Convert.ToDateTime(reader["CreatedDate"])
            };
        }
    }
}