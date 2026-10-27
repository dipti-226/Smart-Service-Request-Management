using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.AdvancedRequests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/Request/{requestId:int}/status-history")]
    [Authorize(Roles = "Admin,Employee,Technician")]
    public class RequestHistoryController : ControllerBase
    {
        private readonly RequestHistoryService _historyService;

        public RequestHistoryController(RequestHistoryService historyService)
        {
            _historyService = historyService;
        }

        // GET: api/Request/5/status-history
        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<RequestStatusHistoryDto>>>> GetStatusHistory(int requestId)
        {
            if (!TryGetCaller(out int userId, out string role))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<List<RequestStatusHistoryDto>>
                {
                    Success = false,
                    Message = "Invalid user."
                });
            }

            var response = await _historyService.GetStatusHistoryAsync(requestId, userId, role);

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