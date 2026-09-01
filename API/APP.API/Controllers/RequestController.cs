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
    [Authorize(Roles = "Admin")]

    public class RequestController : ControllerBase
    {
        private readonly RequestService _requestService;

        public RequestController(RequestService requestService)
        {
            _requestService = requestService;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<RequestResponseDto>>>
            CreateRequest(CreateRequestDto dto)
        {
            var response =
                await _requestService.CreateRequestAsync(dto);

            if (!response.Success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<RequestResponseDto>>>>
            GetAllRequests()
        {
            var response =
                await _requestService.GetAllRequestsAsync();

            return Ok(response);
        }

        [HttpGet("{id:int}")]
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
        public async Task<ActionResult<ApiResponse<DashboardDto>>>
            GetDashboard()
        {
            var response =
                await _requestService.GetDashboardAsync();

            return Ok(response);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ApiResponse<RequestResponseDto>>>
            UpdateRequest(int id, UpdateRequestDto dto)
        {
            var response =
                await _requestService.UpdateRequestAsync(id, dto);

            if (!response.Success)
            {
                return NotFound(response);
            }

            return Ok(response);
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult<ApiResponse<bool>>>
            DeleteRequest(int id)
        {
            var response =
                await _requestService.SoftDeleteRequestAsync(id);

            if (!response.Success)
            {
                return NotFound(response);
            }

            return Ok(response);
        }
    }
}
