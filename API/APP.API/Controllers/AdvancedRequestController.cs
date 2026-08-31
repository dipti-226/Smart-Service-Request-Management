using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.AdvancedRequests;
using APP.Models.DTOs.Technicians;
using Microsoft.AspNetCore.Http;
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
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>
            GetRequestDetails(int id)
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
        public async Task<ActionResult<ApiResponse<List<TechnicianDto>>>>
            GetTechnicians()
        {
            var response = await _advancedRequestService.GetTechniciansAsync();
            return Ok(response);
        }

        // PUT:
        // api/AdvancedRequest/5/status

        [HttpPut("{id:int}/status")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>
            UpdateStatus(int id,UpdateRequestStatusDto dto)
        {
            var response = await _advancedRequestService.UpdateRequestStatusAsync(id, dto);
            if (!response.Success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }


        // PUT:
        // api/AdvancedRequest/5/technician

        [HttpPut("{id:int}/technician")]
        public async Task<ActionResult<ApiResponse<AdvancedRequestDto>>>
            AssignTechnician(int id,AssignTechnicianDto dto)
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
