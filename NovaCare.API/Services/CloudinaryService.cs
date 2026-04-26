using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace NovaCare.API.Services;

public interface ICloudinaryService
{
    Task<string> UploadAsync(IFormFile file, string folder);
}

public class CloudinaryService(IConfiguration config) : ICloudinaryService
{
    private Cloudinary BuildClient()
    {
        var cloudName  = config["Cloudinary:CloudName"]!;
        var apiKey     = config["Cloudinary:ApiKey"]!;
        var apiSecret  = config["Cloudinary:ApiSecret"]!;
        var account    = new Account(cloudName, apiKey, apiSecret);
        return new Cloudinary(account) { Api = { Secure = true } };
    }

    public async Task<string> UploadAsync(IFormFile file, string folder)
    {
        var cloudinary = BuildClient();

        await using var stream = file.OpenReadStream();
        var ext        = Path.GetExtension(file.FileName).ToLower();
        var isPdf      = ext == ".pdf";
        var publicId   = $"{folder}/{Guid.NewGuid()}";

        if (isPdf)
        {
            var rawParams = new RawUploadParams
            {
                File     = new FileDescription(file.FileName, stream),
                PublicId = publicId,
                Folder   = folder,
            };
            var rawResult = await cloudinary.UploadAsync(rawParams);
            return rawResult.SecureUrl.ToString();
        }

        var imgParams = new ImageUploadParams
        {
            File     = new FileDescription(file.FileName, stream),
            PublicId = publicId,
            Folder   = folder,
        };
        var imgResult = await cloudinary.UploadAsync(imgParams);
        return imgResult.SecureUrl.ToString();
    }
}
