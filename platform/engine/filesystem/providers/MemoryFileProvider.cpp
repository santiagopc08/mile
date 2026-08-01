#include "engine/filesystem/providers/MemoryFileProvider.hpp"

namespace platform
{
    bool MemoryFileProvider::Exists(const std::string &path) const
    {
        return m_files.find(path) != m_files.end();
    }

    bool MemoryFileProvider::ReadBytes(const std::string &path, std::vector<uint8_t> &outData)
    {
        auto it = m_files.find(path);
        if (it != m_files.end())
        {
            outData = it->second;
            return true;
        }
        return false;
    }

    bool MemoryFileProvider::WriteBytes(const std::string &path, const std::vector<uint8_t> &data)
    {
        m_files[path] = data;
        return true;
    }

    bool MemoryFileProvider::Delete(const std::string &path)
    {
        return m_files.erase(path) > 0;
    }

    bool MemoryFileProvider::Move(const std::string &sourcePath, const std::string &targetPath)
    {
        auto it = m_files.find(sourcePath);
        if (it != m_files.end())
        {
            m_files[targetPath] = std::move(it->second);
            m_files.erase(it);
            return true;
        }
        return false;
    }

    bool MemoryFileProvider::Copy(const std::string &sourcePath, const std::string &targetPath)
    {
        auto it = m_files.find(sourcePath);
        if (it != m_files.end())
        {
            m_files[targetPath] = it->second;
            return true;
        }
        return false;
    }

    std::vector<std::string> MemoryFileProvider::Enumerate(const std::string &directoryPath) const
    {
        std::vector<std::string> results;
        for (const auto &[path, data] : m_files)
        {
            (void)data;
            if (directoryPath.empty() || path.rfind(directoryPath, 0) == 0)
            {
                results.push_back(path);
            }
        }
        return results;
    }
}
