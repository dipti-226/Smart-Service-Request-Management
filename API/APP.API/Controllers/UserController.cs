using APP.Business.Services;
using APP.Common.Models;
using APP.Models.DTOs.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace APP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;

        public UserController(UserService userService)
        {
            _userService = userService;
        }

        // GET: api/User/paged?search=&role=&isActive=&sortBy=&sortDir=&pageNumber=&pageSize=
        [HttpGet("paged")]
        public async Task<ActionResult<ApiResponse<PagedResult<UserListItemDto>>>>
            GetUsersPaged([FromQuery] UserListQueryDto query)
        {
            var response = await _userService.GetUsersPagedAsync(query);

            return Ok(response);
        }

        // PUT: api/User/5/active   body: { "isActive": false }
        [HttpPut("{id:int}/active")]
        public async Task<ActionResult<ApiResponse<UserListItemDto>>>
            SetUserActive(int id, SetUserActiveDto dto)
        {
            if (!int.TryParse(User.FindFirst("userId")?.Value, out int callerUserId))
            {
                return StatusCode(StatusCodes.Status403Forbidden,
                    new ApiResponse<UserListItemDto>
                    {
                        Success = false,
                        Message = "Invalid user."
                    });
            }

            var response = await _userService
                .SetUserActiveAsync(id, dto.IsActive!.Value, callerUserId);

            if (!response.Success)
            {
                if (response.ErrorCode == "USER_NOT_FOUND")
                {
                    return NotFound(response);
                }

                return BadRequest(response);
            }

            return Ok(response);
        }
    }
}