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
    [Authorize(Roles = "Employee")]
    public class EmployeeController : ControllerBase
    {
        private readonly AdvancedRequestService _advancedRequestService;

        public EmployeeController(AdvancedRequestService advancedRequestService)
        {
            _advancedRequestService = advancedRequestService;
        }

        // GET: api/Employee/requests/5
        // One request, only if the logged-in employee created it
        [HttpGet("requests/{id:int}")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>GetOwnRequest(int id)
        {
            if (!TryGetUserId(out int userId))
            {
                return InvalidUser();
            }

            var response = await _advancedRequestService.GetOwnRequestDetailsAsync(id, userId);

            return response.Success ? Ok(response) : Fail(response);
        }

        // PUT: api/Employee/requests/5
        // Edit own request (only while Open)
        [HttpPut("requests/{id:int}")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>UpdateOwnRequest(int id, UpdateOwnRequestDto dto)
        {
            if (!TryGetUserId(out int userId))
            {
                return InvalidUser();
            }

            var response = await _advancedRequestService.UpdateOwnRequestAsync(id, dto, userId);

            return response.Success ? Ok(response) : Fail(response);
        }

        // PUT: api/Employee/requests/5/cancel
        // Cancel own request (only while Open)
        [HttpPut("requests/{id:int}/cancel")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>CancelOwnRequest(int id)
        {
            if (!TryGetUserId(out int userId))
            {
                return InvalidUser();
            }

            var response = await _advancedRequestService.CancelOwnRequestAsync(id, userId);

            return response.Success ? Ok(response) : Fail(response);
        }

        // PUT: api/Employee/requests/5/close
        // Close own request (only while Resolved)
        [HttpPut("requests/{id:int}/close")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>> CloseOwnRequest(int id)
        {
            if (!TryGetUserId(out int userId))
            {
                return InvalidUser();
            }

            var response = await _advancedRequestService.CloseOwnRequestAsync(id, userId);

            return response.Success ? Ok(response) : Fail(response);
        }

        // PUT: api/Employee/requests/5/reopen
        // Reopen own request (only while Resolved)
        [HttpPut("requests/{id:int}/reopen")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>> ReopenOwnRequest(int id)
        {
            if (!TryGetUserId(out int userId))
            {
                return InvalidUser();
            }

            var response = await _advancedRequestService.ReopenOwnRequestAsync(id, userId);

            return response.Success ? Ok(response) : Fail(response);
        }

        private bool TryGetUserId(out int userId)
        {
            return int.TryParse(User.FindFirst("userId")?.Value, out userId);
        }

        private ActionResult InvalidUser()
        {
            return StatusCode(StatusCodes.Status403Forbidden,new ApiResponse<AdvancedRequestDto>
                {
                    Success = false,
                    Message = "Invalid user."
                });
        }

        // NOT_FOUND -> 404, everything else (NOT_OPEN) -> 400
        private ActionResult Fail(ApiResponse<AdvancedRequestDto> response)
        {
            if (response.ErrorCode == "NOT_FOUND")
            {
                return NotFound(response);
            }

            return BadRequest(response);
        }
    }
}