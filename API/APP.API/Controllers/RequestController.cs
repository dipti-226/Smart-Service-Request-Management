using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]

    public class RequestController : ControllerBase
    {
        private readonly RequestService _requestService;

        public RequestController(RequestService requestService)
        {
            _requestService = requestService;
        }

        // Reads the logged-in user id from the JWT "userId" claim
        private int? GetCurrentUserId()
        {
            return int.TryParse(User.FindFirst("userId")?.Value, out int userId)
                ? userId
                : null;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<ActionResult<ApiResponse<RequestResponseDto>>>
            CreateRequest(CreateRequestDto dto)
        {
            var response =
                await _requestService.CreateRequestAsync(dto, GetCurrentUserId());

            if (!response.Success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }

        // GET: api/Request/my
        // Requests created by the logged-in user
        [HttpGet("my")]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<ActionResult<ApiResponse<List<RequestResponseDto>>>>
            GetMyRequests()
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new ApiResponse<List<RequestResponseDto>>
                {
                    Success = false,
                    Message = "Invalid user."
                });
            }

            var response =
                await _requestService.GetMyRequestsAsync(userId.Value);

            return Ok(response);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<List<RequestResponseDto>>>>
            GetAllRequests()
        {
            var response =
                await _requestService.GetAllRequestsAsync();

            return Ok(response);
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<RequestResponseDto>>>
            GetRequestById(int id)
        {
            var response =
                await _requestService.GetRequestByIdAsync(id);

            if (!response.Success)
            {
                return NotFound(response);
            }

            return Ok(response);
        }

        [HttpGet("dashboard")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<DashboardDto>>>
            GetDashboard()
        {
            var response =
                await _requestService.GetDashboardAsync();

            return Ok(response);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<RequestResponseDto>>>
    UpdateRequest(int id, UpdateRequestDto dto)
        {
            var response =
                await _requestService.UpdateRequestAsync(id, dto, GetCurrentUserId(), "Admin");

            if (!response.Success)
            {
                // Status change not allowed -> 400, request missing -> 404 (as before)
                if (response.ErrorCode == "INVALID_TRANSITION")
                {
                    return BadRequest(response);
                }

                return NotFound(response);
            }

            return Ok(response);
        }
    }
}