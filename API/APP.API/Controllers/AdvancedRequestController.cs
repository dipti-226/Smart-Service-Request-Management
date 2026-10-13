using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.AdvancedRequests;
using APP.Models.DTOs.Technicians;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdvancedRequestController : ControllerBase
    {
        private readonly AdvancedRequestService _advancedRequestService;

        public AdvancedRequestController(AdvancedRequestService advancedRequestService)
        {
            _advancedRequestService = advancedRequestService;
        }

        // GET:
        // api/AdvancedRequest/5

        [HttpGet("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>GetRequestDetails(int id)
        {
            var response = await _advancedRequestService.GetRequestDetailsAsync(id);

            if (!response.Success)
            {
                return NotFound(response);
            }

            return Ok(response);
        }

        // GET:
        // api/AdvancedRequest/technicians

        [HttpGet("technicians")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<List<TechnicianDto>>>>GetTechnicians()
        {
            var response = await _advancedRequestService.GetTechniciansAsync();
            return Ok(response);
        }

        // PUT:
        // api/AdvancedRequest/5/status

        [HttpPut("{id:int}/status")]
        [Authorize(Roles = "Admin,Technician")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>
            UpdateStatus(int id, UpdateRequestStatusDto dto)
        {
            if (!TryGetCaller(out int callerUserId, out string callerRole))
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new ApiResponse<AdvancedRequestDto>
                    {
                        Success = false,
                        Message = "Invalid user."
                    });
            }

            var response = await _advancedRequestService
                .UpdateRequestStatusAsync(id, dto, callerUserId, callerRole);

            if (!response.Success)
            {
                if (response.ErrorCode == "NOT_ASSIGNED" ||
                    response.ErrorCode == "NOT_OWNER")
                {
                    return StatusCode(StatusCodes.Status403Forbidden, response);
                }

                return BadRequest(response);
            }

            return Ok(response);
        }
        // GET:
        // api/AdvancedRequest/5/allowed-statuses
        // Next statuses the logged-in user may choose for this request

        [HttpGet("{id:int}/allowed-statuses")]
        [Authorize(Roles = "Admin,Technician")]
        public async Task<ActionResult<ApiResponse<List<string>>>>
            GetAllowedStatuses(int id)
        {
            if (!TryGetCaller(out int callerUserId, out string callerRole))
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new ApiResponse<List<string>>
                    {
                        Success = false,
                        Message = "Invalid user."
                    });
            }

            var response = await _advancedRequestService
                .GetAllowedStatusesAsync(id, callerUserId, callerRole);

            return Ok(response);
        }

        // Reads the logged-in user's id and role (Admin or Technician) from the token
        private bool TryGetCaller(out int userId, out string role)
        {
            role = User.IsInRole("Admin") ? "Admin" : "Technician";

            return int.TryParse(User.FindFirst("userId")?.Value, out userId);
        }

        // PUT:
        // api/AdvancedRequest/5/technician

        [HttpPut("{id:int}/technician")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>AssignTechnician(int id,AssignTechnicianDto dto)
        {
            var response = await _advancedRequestService.AssignTechnicianAsync(id, dto);
            if (!response.Success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }
    }
}
