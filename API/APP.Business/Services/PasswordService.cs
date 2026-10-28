using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;

namespace APP.Business.Services
{
    public enum PasswordCheckResult
    {
        Failed,
        Valid,
        ValidRehashNeeded   // correct password, but the stored value is plain text or an old hash
    }

    public class PasswordService
    {
        // Every hash made by PasswordHasher (format V3) starts with this.
        private const string HashPrefix = "AQAAAA";

        private readonly PasswordHasher<object> _hasher = new();
        private readonly object _user = new();
        private readonly string _dummyHash;

        public PasswordService()
        {
            // Used only to spend the same time when a username does not exist.
            _dummyHash = _hasher.HashPassword(_user, Guid.NewGuid().ToString("N"));
        }

        public string Hash(string password)
        {
            return _hasher.HashPassword(_user, password);
        }

        public static bool IsHashed(string storedPassword)
        {
            return storedPassword.Length >= 60
                && storedPassword.StartsWith(HashPrefix, StringComparison.Ordinal);
        }

        public PasswordCheckResult Verify(string storedPassword, string providedPassword)
        {
            // Old rows: plain text. Accept once, then the caller replaces it with a hash.
            if (!IsHashed(storedPassword))
            {
                byte[] stored = Encoding.UTF8.GetBytes(storedPassword);
                byte[] provided = Encoding.UTF8.GetBytes(providedPassword);

                return CryptographicOperations.FixedTimeEquals(stored, provided)
                    ? PasswordCheckResult.ValidRehashNeeded
                    : PasswordCheckResult.Failed;
            }

            return _hasher.VerifyHashedPassword(_user, storedPassword, providedPassword) switch
            {
                PasswordVerificationResult.Success => PasswordCheckResult.Valid,
                PasswordVerificationResult.SuccessRehashNeeded => PasswordCheckResult.ValidRehashNeeded,
                _ => PasswordCheckResult.Failed
            };
        }

        // Called when the username is not found, so the response time does not
        // reveal which usernames exist.
        public void VerifyDummy(string providedPassword)
        {
            _hasher.VerifyHashedPassword(_user, _dummyHash, providedPassword);
        }
    }
}