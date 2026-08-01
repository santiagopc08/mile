#ifndef PLATFORM_ENGINE_FILESYSTEM_PROVIDERS_MEMORY_FILE_PROVIDER_HPP
#define PLATFORM_ENGINE_FILESYSTEM_PROVIDERS_MEMORY_FILE_PROVIDER_HPP

#include "engine/filesystem/providers/IFileProvider.hpp"
#include <unordered_map>

namespace platform
{
    class MemoryFileProvider : public IFileProvider
    {
    public:
        bool Exists(const std::string &path) const override;
        bool ReadBytes(const std::string &path, std::vector<uint8_t> &outData) override;
        bool WriteBytes(const std::string &path, const std::vector<uint8_t> &data) override;
        bool Delete(const std::string &path) override;
        bool Move(const std::string &sourcePath, const std::string &targetPath) override;
        bool Copy(const std::string &sourcePath, const std::string &targetPath) override;
        std::vector<std::string> Enumerate(const std::string &directoryPath) const override;

    private:
        std::unordered_map<std::string, std::vector<uint8_t>> m_files;
    };
}

#endif // PLATFORM_ENGINE_FILESYSTEM_PROVIDERS_MEMORY_FILE_PROVIDER_HPP
