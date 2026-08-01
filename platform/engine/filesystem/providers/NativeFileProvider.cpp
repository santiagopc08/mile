#include "engine/filesystem/providers/NativeFileProvider.hpp"
#include <fstream>
#include <filesystem>

namespace platform
{
    namespace fs = std::filesystem;

    bool NativeFileProvider::Exists(const std::string &path) const
    {
        return fs::exists(path);
    }

    bool NativeFileProvider::ReadBytes(const std::string &path, std::vector<uint8_t> &outData)
    {
        std::ifstream file(path, std::ios::binary | std::ios::ate);
        if (!file.is_open())
        {
            return false;
        }

        std::streamsize size = file.tellg();
        file.seekg(0, std::ios::beg);

        outData.resize(static_cast<size_t>(size));
        if (file.read(reinterpret_cast<char *>(outData.data()), size))
        {
            return true;
        }
        return false;
    }

    bool NativeFileProvider::WriteBytes(const std::string &path, const std::vector<uint8_t> &data)
    {
        std::ofstream file(path, std::ios::binary);
        if (!file.is_open())
        {
            return false;
        }

        file.write(reinterpret_cast<const char *>(data.data()), static_cast<std::streamsize>(data.size()));
        return true;
    }

    bool NativeFileProvider::Delete(const std::string &path)
    {
        std::error_code ec;
        return fs::remove(path, ec);
    }

    bool NativeFileProvider::Move(const std::string &sourcePath, const std::string &targetPath)
    {
        std::error_code ec;
        fs::rename(sourcePath, targetPath, ec);
        return !ec;
    }

    bool NativeFileProvider::Copy(const std::string &sourcePath, const std::string &targetPath)
    {
        std::error_code ec;
        fs::copy_file(sourcePath, targetPath, fs::copy_options::overwrite_existing, ec);
        return !ec;
    }

    std::vector<std::string> NativeFileProvider::Enumerate(const std::string &directoryPath) const
    {
        std::vector<std::string> results;
        std::error_code ec;
        if (!fs::exists(directoryPath, ec))
        {
            return results;
        }

        for (const auto &entry : fs::recursive_directory_iterator(directoryPath, ec))
        {
            if (entry.is_regular_file())
            {
                results.push_back(entry.path().string());
            }
        }
        return results;
    }
}
