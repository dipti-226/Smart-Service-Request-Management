using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]

    public class RequestController : ControllerBase
    {
        private readonly RequestService _requestService;
        private readonly RequestExportService _exportService;

        public RequestController(RequestService requestService, RequestExportService exportService)
        {
            _requestService = requestService;
            _exportService = exportService;
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
        public async Task<ActionResult<ApiResponse<RequestResponseDto>>>CreateRequest(CreateRequestDto dto)
        {
            var response = await _requestService.CreateRequestAsync(dto, GetCurrentUserId());

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
        public async Task<ActionResult<ApiResponse<List<RequestResponseDto>>>>GetMyRequests()
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

            var response = await _requestService.GetMyRequestsAsync(userId.Value);

            return Ok(response);
        }

        // GET: api/Request/paged?search=&status=&priority=&sortBy=&sortDir=&pageNumber=&pageSize=
        // All requests, paged (Admin)
        [HttpGet("paged")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<PagedResult<RequestResponseDto>>>>GetRequestsPaged([FromQuery] RequestListQueryDto query)
        {
            var response = await _requestService.GetRequestsPagedAsync(query);

            return Ok(response);
        }

        // GET: api/Request/my/paged?...
        // Requests created by the logged-in user, paged
        [HttpGet("my/paged")]
        [Authorize(Roles = "Admin,Employee")]
        public async Task<ActionResult<ApiResponse<PagedResult<RequestResponseDto>>>>GetMyRequestsPaged([FromQuery] RequestListQueryDto query)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new ApiResponse<PagedResult<RequestResponseDto>>
                {
                    Success = false,
                    Message = "Invalid user."
                });
            }

            var response = await _requestService.GetRequestsPagedAsync(query, userId.Value);

            return Ok(response);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<List<RequestResponseDto>>>>GetAllRequests()
        {
            var response = await _requestService.GetAllRequestsAsync();

            return Ok(response);
        }

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<RequestResponseDto>>>GetRequestById(int id)
        {
            var response = await _requestService.GetRequestByIdAsync(id);

            if (!response.Success)
            {
                return NotFound(response);
            }

            return Ok(response);
        }

        // GET: api/Request/export?search=&status=&priority=&sortBy=&sortDir=
        // CSV file with every request that matches the filters (Admin)
        [HttpGet("export")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ExportRequests([FromQuery] RequestListQueryDto query)
        {
            var result = await _exportService.BuildCsvAsync(query);

            if (!result.Success || result.Data == null)
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = result.Message,
                    Data = false
                });
            }

            string fileName = $"service-requests-{DateTime.UtcNow:yyyyMMdd-HHmm}.csv";

            return File(result.Data, "text/csv; charset=utf-8", fileName);
        }

        [HttpGet("dashboard")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<DashboardDto>>>GetDashboard()
        {
            var response = await _requestService.GetDashboardAsync();

            return Ok(response);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<RequestResponseDto>>>UpdateRequest(int id, UpdateRequestDto dto)
        {
            var response = await _requestService.UpdateRequestAsync(id, dto, GetCurrentUserId(), "Admin");

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

        // DELETE: api/Request/5
        // Soft delete (the row stays in the database with IsActive = 0)
        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<bool>>>DeleteRequest(int id)
        {
            var response = await _requestService.SoftDeleteRequestAsync(id);

            if (!response.Success)
            {
                return NotFound(response);
            }

            return Ok(response);
        }
    }
}