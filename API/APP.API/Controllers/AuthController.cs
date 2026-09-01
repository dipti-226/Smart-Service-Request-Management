using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<LoginResponseDto>>> Login(LoginRequestDto dto)
        {
            var response = await _authService.LoginAsync(dto);

            if (!response.Success)
            {
                return Unauthorized(response);
            }

            return Ok(response);
        }

        [HttpPost("register")]
        public async Task<ActionResult<ApiResponse<bool>>> Register(RegisterRequestDto dto)
        {
            var response = await _authService.RegisterEmployeeAsync(dto);

            if (!response.Success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }

        [HttpPost("technician")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ApiResponse<bool>>> CreateTechnician(CreateTechnicianRequestDto dto)
        {
            var response = await _authService.CreateTechnicianAsync(dto);

            if (!response.Success)
            {
                return BadRequest(response);
            }

            return Ok(response);
        }
    }
}
