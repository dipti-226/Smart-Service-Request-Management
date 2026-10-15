using APP.Common.Models;
using APP.Models.DTOs.Comments;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace APP.Business.Services
{
    public class CommentService
    {
        private readonly string _connectionString;

        public CommentService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection is not configured.");
        }

        // Comments of a request, oldest first.
        // "Not found" is returned for missing AND not-allowed requests.
        public async Task<ApiResponse<List<RequestCommentDto>>> GetCommentsAsync(int requestId,int callerUserId,string callerRole)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_RequestComment_GetByRequest", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
            command.Parameters.Add("@CallerUserId", SqlDbType.Int).Value = callerUserId;
            command.Parameters.Add("@CallerRole", SqlDbType.NVarChar, 50).Value = callerRole;

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            var comments = new List<RequestCommentDto>();

            while (await reader.ReadAsync())
            {
                // The SP returned only an error row
                if (comments.Count == 0 && HasColumn(reader, "ErrorCode"))
                {
                    return new ApiResponse<List<RequestCommentDto>>
                    {
                        Success = false,
                        Message = "Request not found.",
                        ErrorCode = "NOT_FOUND",
                        Data = null
                    };
                }

                comments.Add(MapComment(reader));
            }

            return new ApiResponse<List<RequestCommentDto>>
            {
                Success = true,
                Message = "Comments retrieved successfully.",
                Data = comments
            };
        }

        public async Task<ApiResponse<RequestCommentDto>> AddCommentAsync(int requestId,string commentText,int callerUserId,string callerRole)
        {
            await using SqlConnection connection = new SqlConnection(_connectionString);
            await using SqlCommand command = new SqlCommand("SSR_RequestComment_Add", connection);

            command.CommandType = CommandType.StoredProcedure;

            command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
            command.Parameters.Add("@CallerUserId", SqlDbType.Int).Value = callerUserId;
            command.Parameters.Add("@CallerRole", SqlDbType.NVarChar, 50).Value = callerRole;
            command.Parameters.Add("@CommentText", SqlDbType.NVarChar, 1000).Value = commentText.Trim();

            await connection.OpenAsync();
            await using SqlDataReader reader = await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return new ApiResponse<RequestCommentDto>
                {
                    Success = false,
                    Message = "Comment could not be added.",
                    Data = null
                };
            }

            if (HasColumn(reader, "ErrorCode"))
            {
                return new ApiResponse<RequestCommentDto>
                {
                    Success = false,
                    Message = "Request not found.",
                    ErrorCode = "NOT_FOUND",
                    Data = null
                };
            }

            return new ApiResponse<RequestCommentDto>
            {
                Success = true,
                Message = "Comment added successfully.",
                Data = MapComment(reader)
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

        private static RequestCommentDto MapComment(SqlDataReader reader)
        {
            return new RequestCommentDto
            {
                CommentId = Convert.ToInt32(reader["CommentId"]),
                RequestId = Convert.ToInt32(reader["RequestId"]),
                UserId = Convert.ToInt32(reader["UserId"]),
                Username = reader["Username"]?.ToString() ?? string.Empty,
                RoleName = reader["RoleName"]?.ToString() ?? string.Empty,
                CommentText = reader["CommentText"]?.ToString() ?? string.Empty,
                CreatedDate = Convert.ToDateTime(reader["CreatedDate"])
            };
        }
    }
}