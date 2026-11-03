using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.Ai;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly AiService _aiService;
        private readonly RequestAiService _requestAiService;
        private readonly RequestSummaryAiService _summaryAiService;
        private readonly ReplyDraftAiService _replyDraftAiService;
        private readonly DescriptionAssistAiService _descriptionAiService;
        private readonly QuickTipsAiService _quickTipsAiService;

        public AiController(AiService aiService,RequestAiService requestAiService,RequestSummaryAiService summaryAiService,ReplyDraftAiService replyDraftAiService,DescriptionAssistAiService descriptionAiService,QuickTipsAiService quickTipsAiService)
        {
            _aiService = aiService;
            _requestAiService = requestAiService;
            _summaryAiService = summaryAiService;
            _replyDraftAiService = replyDraftAiService;
            _descriptionAiService = descriptionAiService;
            _quickTipsAiService = quickTipsAiService;
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

        // POST: api/Ai/classify-request
        // Suggests a request type and priority from a description. Suggestion only.
        [HttpPost("classify-request")]
        [Authorize(Roles = "Admin,Employee")]
        [EnableRateLimiting("ai")]
        public async Task<ActionResult<ApiResponse<AiClassificationDto>>> ClassifyRequest(ClassifyRequestDto dto)
        {
            if (!int.TryParse(User.FindFirst("userId")?.Value, out int userId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<AiClassificationDto>
                {
                    Success = false,
                    Message = "Invalid user."
                });
            }

            var response = await _requestAiService.ClassifyAsync(
                dto.Description,
                userId,
                HttpContext.RequestAborted);

            return Ok(response);
        }

        // POST: api/Ai/improve-description
        // Points out missing details and offers clearer wording. Suggestion only.
        [HttpPost("improve-description")]
        [Authorize(Roles = "Admin,Employee")]
        [EnableRateLimiting("ai")]
        public async Task<ActionResult<ApiResponse<AiDescriptionHelpDto>>> ImproveDescription(ImproveDescriptionDto dto)
        {
            if (!int.TryParse(User.FindFirst("userId")?.Value, out int userId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<AiDescriptionHelpDto>
                {
                    Success = false,
                    Message = "Invalid user."
                });
            }

            var response = await _descriptionAiService.HelpAsync(
                dto.Description,
                dto.RequestType,
                userId,
                HttpContext.RequestAborted);

            return Ok(response);
        }

        // POST: api/Ai/quick-tips
        // A few safe things to try before submitting a request. Suggestion only.
        [HttpPost("quick-tips")]
        [Authorize(Roles = "Admin,Employee")]
        [EnableRateLimiting("ai")]
        public async Task<ActionResult<ApiResponse<AiQuickTipsDto>>> GetQuickTips(QuickTipsRequestDto dto)
        {
            if (!int.TryParse(User.FindFirst("userId")?.Value, out int userId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<AiQuickTipsDto>
                {
                    Success = false,
                    Message = "Invalid user."
                });
            }

            var response = await _quickTipsAiService.GetTipsAsync(
                dto.Description,
                dto.RequestType,
                userId,
                HttpContext.RequestAborted);

            return Ok(response);
        }

        // POST: api/Ai/summarize-request/5
        // A short summary of one request. An Admin can summarize any request,
        // a Technician only requests assigned to them.
        [HttpPost("summarize-request/{requestId:int}")]
        [Authorize(Roles = "Admin,Technician")]
        [EnableRateLimiting("ai")]
        public async Task<ActionResult<ApiResponse<AiRequestSummaryDto>>> SummarizeRequest(int requestId)
        {
            if (!int.TryParse(User.FindFirst("userId")?.Value, out int userId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<AiRequestSummaryDto>
                {
                    Success = false,
                    Message = "Invalid user."
                });
            }

            string role = User.IsInRole("Admin") ? "Admin" : "Technician";

            var response = await _summaryAiService.SummarizeAsync(
                requestId,
                userId,
                role,
                HttpContext.RequestAborted);

            return response.Success ? Ok(response) : NotFound(response);
        }

        // POST: api/Ai/draft-reply/5
        // A draft comment for the person to edit and post. Nothing is posted here.
        // An Admin can draft for any request, a Technician only for requests assigned to them.
        [HttpPost("draft-reply/{requestId:int}")]
        [Authorize(Roles = "Admin,Technician")]
        [EnableRateLimiting("ai")]
        public async Task<ActionResult<ApiResponse<AiReplyDraftDto>>> DraftReply(int requestId, DraftReplyDto dto)
        {
            if (!int.TryParse(User.FindFirst("userId")?.Value, out int userId))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<AiReplyDraftDto>
                {
                    Success = false,
                    Message = "Invalid user."
                });
            }

            string role = User.IsInRole("Admin") ? "Admin" : "Technician";

            var response = await _replyDraftAiService.DraftAsync(
                requestId,
                userId,
                role,
                dto.Intent,
                HttpContext.RequestAborted);

            return response.Success ? Ok(response) : NotFound(response);
        }
    }
}