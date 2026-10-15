namespace APP.Models.DTOs.Comments
{
    public class RequestCommentDto
    {
        public int CommentId { get; set; }
        public int RequestId { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public string CommentText { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
    }
}