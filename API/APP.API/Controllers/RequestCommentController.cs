using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.Comments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/Request/{requestId:int}/comments")]
    [Authorize(Roles = "Admin,Employee,Technician")]
    public class RequestCommentController : ControllerBase
    {
        private readonly CommentService _commentService;

        public RequestCommentController(CommentService commentService)
        {
            _commentService = commentService;
        }

        // GET: api/Request/5/comments
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<RequestCommentDto>>>>GetComments(int requestId)
        {
            if (!TryGetCaller(out int userId, out string role))
            {
                return StatusCode(StatusCodes.Status403Forbidden,new ApiResponse<List<RequestCommentDto>>
                    {
                        Success = false,
                        Message = "Invalid user."
                    });
            }

            var response = await _commentService.GetCommentsAsync(requestId, userId, role);

            if (!response.Success)
            {
                return NotFound(response);
            }

            return Ok(response);
        }

        // POST: api/Request/5/comments   body: { "commentText": "..." }
        [HttpPost]
        public async Task<ActionResult<ApiResponse<RequestCommentDto>>>AddComment(int requestId, AddCommentDto dto)
        {
            if (!TryGetCaller(out int userId, out string role))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<RequestCommentDto>
                    {
                        Success = false,
                        Message = "Invalid user."
                    });
            }

            var response = await _commentService.AddCommentAsync(requestId, dto.CommentText, userId, role);

            if (!response.Success)
            {
                return NotFound(response);
            }

            return Ok(response);
        }

        private bool TryGetCaller(out int userId, out string role)
        {
            role = User.IsInRole("Admin")
                ? "Admin"
                : User.IsInRole("Employee")
                    ? "Employee"
                    : "Technician";

            return int.TryParse(User.FindFirst("userId")?.Value, out userId);
        }
    }
}