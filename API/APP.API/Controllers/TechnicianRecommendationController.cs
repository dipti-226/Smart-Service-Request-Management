using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.Technicians;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class TechnicianRecommendationController : ControllerBase
    {
        private readonly TechnicianRecommendationService _recommendationService;

        public TechnicianRecommendationController(TechnicianRecommendationService recommendationService)
        {
            _recommendationService = recommendationService;
        }

        // GET: api/TechnicianRecommendation/5
        // The technician to consider for request 5 (suggestion only, nothing is assigned)
        [HttpGet("{requestId:int}")]
        public async Task<ActionResult<ApiResponse<TechnicianRecommendationDto>>> GetRecommendation(int requestId)
        {
            var response = await _recommendationService.GetRecommendationAsync(requestId);

            if (response.Success)
            {
                return Ok(response);
            }

            return response.ErrorCode == "NOT_FOUND"
                ? NotFound(response)
                : BadRequest(response);
        }
    }
}