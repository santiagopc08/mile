#ifndef PLATFORM_ENGINE_FILESYSTEM_PROVIDERS_I_FILE_PROVIDER_HPP
#define PLATFORM_ENGINE_FILESYSTEM_PROVIDERS_I_FILE_PROVIDER_HPP

#include <string>
#include <vector>
#include <cstdint>

namespace platform
{
    class IFileProvider
    {
    public:
        virtual ~IFileProvider() = default;

        virtual bool Exists(const std::string &path) const = 0;
        virtual bool ReadBytes(const std::string &path, std::vector<uint8_t> &outData) = 0;
        virtual bool WriteBytes(const std::string &path, const std::vector<uint8_t> &data) = 0;
        virtual bool Delete(const std::string &path) = 0;
        virtual bool Move(const std::string &sourcePath, const std::string &targetPath) = 0;
        virtual bool Copy(const std::string &sourcePath, const std::string &targetPath) = 0;
        virtual std::vector<std::string> Enumerate(const std::string &directoryPath) const = 0;
    };
}

#endif // PLATFORM_ENGINE_FILESYSTEM_PROVIDERS_I_FILE_PROVIDER_HPP
