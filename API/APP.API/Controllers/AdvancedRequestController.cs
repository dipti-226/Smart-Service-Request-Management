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
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>UpdateStatus(int id, UpdateRequestStatusDto dto)
        {
            int? callerUserId = null;
            string? callerRole = null;

            // Technician can update only the requests assigned to them.
            // Admin passes nothing, so the Admin flow is unchanged.
            if (User.IsInRole("Technician"))
            {
                callerRole = "Technician";

                if (!int.TryParse(User.FindFirst("userId")?.Value, out int userId))
                {
                    return StatusCode(StatusCodes.Status403Forbidden,
                        new ApiResponse<AdvancedRequestDto>
                        {
                            Success = false,
                            Message = "Invalid user."
                        });
                }
                callerUserId = userId;
            }

            var response = await _advancedRequestService.UpdateRequestStatusAsync(id, dto, callerUserId, callerRole);

            if (!response.Success)
            {
                if (response.ErrorCode == "NOT_ASSIGNED")
                {
                    return StatusCode(StatusCodes.Status403Forbidden, response);
                }

                return BadRequest(response);
            }
            return Ok(response);
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
