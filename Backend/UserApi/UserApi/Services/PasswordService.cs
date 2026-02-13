using System.Security.Cryptography;
using System.Text;

namespace UserApprovalApi.Services
{
    public static class PasswordService
    {
        public static (byte[] hash, byte[] salt) HashPassword(string password)
        {
            using var hmac = new HMACSHA512();
            var salt = hmac.Key;
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return (hash, salt);
        }

        public static bool Verify(string password, byte[] hash, byte[] salt)
        {
            using var hmac = new HMACSHA512(salt);
            var computed = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
            return computed.SequenceEqual(hash);
        }
        //public static (byte[] hash, byte[] salt) HashPassword(string password)
        //{
        //    var salt = RandomNumberGenerator.GetBytes(16); 

        //    using var pbkdf2 = new Rfc2898DeriveBytes(
        //        password, salt, iterations: 100_000, HashAlgorithmName.SHA256);

        //    var hash = pbkdf2.GetBytes(32); 
        //    return (hash, salt);
        //}

        //public static bool Verify(string password, byte[] hash, byte[] salt)
        //{
        //    using var pbkdf2 = new Rfc2898DeriveBytes(
        //        password, salt, iterations: 100_000, HashAlgorithmName.SHA256);
        //    var computed = pbkdf2.GetBytes(32);
        //    return CryptographicOperations.FixedTimeEquals(computed, hash);
        //}

    }
}
