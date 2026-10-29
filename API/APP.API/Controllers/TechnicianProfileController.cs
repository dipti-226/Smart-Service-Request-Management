using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.Technicians;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Technician")]
    public class TechnicianProfileController : ControllerBase
    {
        private readonly TechnicianProfileService _profileService;

        public TechnicianProfileController(TechnicianProfileService profileService)
        {
            _profileService = profileService;
        }

        // GET: api/TechnicianProfile/me
        // The logged-in technician's profile, plus the list of specializations to choose from
        [HttpGet("me")]
        public async Task<ActionResult<ApiResponse<TechnicianProfileDto>>> GetMyProfile()
        {
            if (!TryGetUserId(out int userId))
            {
                return InvalidUser();
            }

            var response = await _profileService.GetMyProfileAsync(userId);

            return response.Success ? Ok(response) : Fail(response);
        }

        // PUT: api/TechnicianProfile/me
        // Save the logged-in technician's own profile
        [HttpPut("me")]
        public async Task<ActionResult<ApiResponse<TechnicianProfileDto>>> SaveMyProfile(SaveTechnicianProfileDto dto)
        {
            if (!TryGetUserId(out int userId))
            {
                return InvalidUser();
            }

            var response = await _profileService.SaveMyProfileAsync(userId, dto);

            return response.Success ? Ok(response) : Fail(response);
        }

        private bool TryGetUserId(out int userId)
        {
            return int.TryParse(User.FindFirst("userId")?.Value, out userId);
        }

        private ActionResult InvalidUser()
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<TechnicianProfileDto>
            {
                Success = false,
                Message = "Invalid user."
            });
        }

        // NOT_FOUND -> 404, everything else -> 400
        private ActionResult Fail(ApiResponse<TechnicianProfileDto> response)
        {
            if (response.ErrorCode == "NOT_FOUND")
            {
                return NotFound(response);
            }

            return BadRequest(response);
        }
    }
}