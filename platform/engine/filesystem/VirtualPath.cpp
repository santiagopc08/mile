#include "engine/filesystem/VirtualPath.hpp"
#include <algorithm>

namespace platform
{
    VirtualPath::VirtualPath(std::string pathStr)
    {
        Parse(pathStr);
    }

    void VirtualPath::Parse(const std::string &pathStr)
    {
        std::string normalized = Normalize(pathStr);
        size_t schemePos = normalized.find("://");

        if (schemePos != std::string::npos)
        {
            m_scheme = normalized.substr(0, schemePos);
            m_relativePath = normalized.substr(schemePos + 3);
        }
        else
        {
            m_scheme = "assets"; // Default scheme
            m_relativePath = normalized;
        }

        m_fullPath = m_scheme + "://" + m_relativePath;
    }

    std::string VirtualPath::GetExtension() const
    {
        size_t dotPos = m_relativePath.find_last_of('.');
        if (dotPos != std::string::npos)
        {
            return m_relativePath.substr(dotPos);
        }
        return "";
    }

    std::string VirtualPath::GetFilename() const
    {
        size_t slashPos = m_relativePath.find_last_of('/');
        if (slashPos != std::string::npos)
        {
            return m_relativePath.substr(slashPos + 1);
        }
        return m_relativePath;
    }

    VirtualPath VirtualPath::GetParent() const
    {
        size_t slashPos = m_relativePath.find_last_of('/');
        if (slashPos != std::string::npos)
        {
            return VirtualPath(m_scheme + "://" + m_relativePath.substr(0, slashPos));
        }
        return VirtualPath(m_scheme + "://");
    }

    std::string VirtualPath::Normalize(std::string pathStr)
    {
        std::replace(pathStr.begin(), pathStr.end(), '\\', '/');
        // Strip trailing slashes
        while (pathStr.length() > 1 && pathStr.back() == '/' && pathStr.find("://") != (pathStr.length() - 3))
        {
            pathStr.pop_back();
        }
        return pathStr;
    }
}
