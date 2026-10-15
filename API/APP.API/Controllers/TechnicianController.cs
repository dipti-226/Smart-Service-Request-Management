using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.AdvancedRequests;
using APP.Models.DTOs.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Technician")]
    public class TechnicianController : ControllerBase
    {
        private readonly RequestService _requestService;
        private readonly AdvancedRequestService _advancedRequestService;

        public TechnicianController(RequestService requestService, AdvancedRequestService advancedRequestService)
        {
            _requestService = requestService;
            _advancedRequestService = advancedRequestService;
        }

        // GET: api/Technician/requests/paged?search=&status=&priority=&sortBy=&sortDir=&pageNumber=&pageSize=
        // Requests assigned to the logged-in technician
        [HttpGet("requests/paged")]
        public async Task<ActionResult<ApiResponse<PagedResult<RequestResponseDto>>>>GetAssignedRequestsPaged([FromQuery] RequestListQueryDto query)
        {
            if (!int.TryParse(User.FindFirst("userId")?.Value, out int userId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<PagedResult<RequestResponseDto>>
                    {
                        Success = false,
                        Message = "Invalid user."
                    });
            }

            var response = await _requestService.GetAssignedRequestsPagedAsync(query, userId);

            return Ok(response);
        }

        // GET: api/Technician/requests/5
        // One request, only if it is assigned to the logged-in technician
        [HttpGet("requests/{id:int}")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>GetAssignedRequest(int id)
        {
            if (!int.TryParse(User.FindFirst("userId")?.Value, out int userId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<AdvancedRequestDto>
                    {
                        Success = false,
                        Message = "Invalid user."
                    });
            }

            var response = await _advancedRequestService.GetAssignedRequestDetailsAsync(id, userId);

            if (!response.Success)
            {
                return NotFound(response);
            }

            return Ok(response);
        }
    }
}