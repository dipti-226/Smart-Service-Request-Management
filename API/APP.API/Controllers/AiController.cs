using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.Ai;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly AiService _aiService;

        public AiController(AiService aiService)
        {
            _aiService = aiService;
        }

        // GET: api/Ai/status
        // Lets the screens show or hide the AI buttons
        [HttpGet("status")]
        public ActionResult<ApiResponse<AiStatusDto>> GetStatus()
        {
            return Ok(new ApiResponse<AiStatusDto>
            {
                Success = true,
                Message = "AI status retrieved successfully.",
                Data = new AiStatusDto { Enabled = _aiService.IsEnabled }
            });
        }
    }
}