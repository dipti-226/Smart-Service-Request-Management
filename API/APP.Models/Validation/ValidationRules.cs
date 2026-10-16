namespace APP.Models.Validation
{
    // One place for every form rule and message.
    // Angular: core/validation/validation-rules.ts must say the same.
    public static class ValidationRules
    {
        // Limits
        public const int UsernameMin = 3;
        public const int UsernameMax = 50;
        public const int EmailMax = 150;
        public const int PasswordMin = 6;
        public const int PasswordMax = 100;
        public const int RequestTypeMax = 100;
        public const int DescriptionMax = 1000;
        public const int CommentMax = 1000;

        // Patterns (same text in Angular)
        public const string UsernamePattern = "^[A-Za-z0-9._-]+$";
        public const string EmailPattern = @"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$";
        public const string PriorityPattern = "^(Low|Medium|High|Critical)$";
        public const string StatusPattern = "^(Open|In Progress|On Hold|Resolved|Closed|Cancelled)$";

        // Messages
        public const string UsernameRequired = "Username is required.";
        public const string UsernameTooShort = "Username must be at least 3 characters.";
        public const string UsernameTooLong = "Username cannot be more than 50 characters.";
        public const string UsernameInvalid = "Use letters, numbers, dot, underscore or hyphen only.";

        public const string EmailRequired = "Email is required.";
        public const string EmailTooLong = "Email cannot be more than 150 characters.";
        public const string EmailInvalid = "Enter a valid email address.";

        public const string PasswordRequired = "Password is required.";
        public const string PasswordTooShort = "Password must be at least 6 characters.";
        public const string PasswordTooLong = "Password cannot be more than 100 characters.";

        public const string ConfirmPasswordRequired = "Please confirm your password.";
        public const string PasswordMismatch = "Passwords do not match.";

        public const string RequestTypeRequired = "Request type is required.";
        public const string RequestTypeTooLong = "Request type cannot be more than 100 characters.";

        public const string DescriptionRequired = "Request description is required.";
        public const string DescriptionTooLong = "Request description cannot be more than 1000 characters.";

        public const string PriorityRequired = "Priority is required.";
        public const string PriorityInvalid = "Priority must be Low, Medium, High or Critical.";

        public const string StatusRequired = "Status is required.";
        public const string StatusInvalid = "Status must be Open, In Progress, On Hold, Resolved, Closed or Cancelled.";

        public const string CommentRequired = "Comment cannot be empty.";
        public const string CommentTooLong = "Comment cannot be more than 1000 characters.";
    }
}