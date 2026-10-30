using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.Technicians;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class TechnicianRecommendationController : ControllerBase
    {
        private readonly TechnicianRecommendationService _recommendationService;
        private readonly TechnicianAiService _aiService;

        public TechnicianRecommendationController(
            TechnicianRecommendationService recommendationService,
            TechnicianAiService aiService)
        {
            _recommendationService = recommendationService;
            _aiService = aiService;
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

        // POST: api/TechnicianRecommendation/5/ai
        // An AI second opinion: reorders and explains the technicians the server already
        // considers eligible. Never assigns anyone. Falls back to the standard order.
        [HttpPost("{requestId:int}/ai")]
        [EnableRateLimiting("ai")]
        public async Task<ActionResult<ApiResponse<AiTechnicianSuggestionDto>>> GetAiSuggestion(int requestId)
        {
            if (!int.TryParse(User.FindFirst("userId")?.Value, out int userId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<AiTechnicianSuggestionDto>
                {
                    Success = false,
                    Message = "Invalid user."
                });
            }

            var response = await _aiService.SuggestAsync(requestId, userId, HttpContext.RequestAborted);

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