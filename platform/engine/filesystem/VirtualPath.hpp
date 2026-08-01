#ifndef PLATFORM_ENGINE_FILESYSTEM_VIRTUAL_PATH_HPP
#define PLATFORM_ENGINE_FILESYSTEM_VIRTUAL_PATH_HPP

#include <string>

namespace platform
{
    class VirtualPath
    {
    public:
        VirtualPath() = default;
        explicit VirtualPath(std::string pathStr);

        [[nodiscard]] const std::string &GetScheme() const { return m_scheme; }
        [[nodiscard]] const std::string &GetRelativePath() const { return m_relativePath; }
        [[nodiscard]] const std::string &GetFullPath() const { return m_fullPath; }

        [[nodiscard]] bool IsValid() const { return !m_scheme.empty(); }
        [[nodiscard]] std::string GetExtension() const;
        [[nodiscard]] std::string GetFilename() const;
        [[nodiscard]] VirtualPath GetParent() const;

        static std::string Normalize(std::string pathStr);

    private:
        void Parse(const std::string &pathStr);

        std::string m_scheme{"assets"};
        std::string m_relativePath;
        std::string m_fullPath{"assets://"};
    };
}

#endif // PLATFORM_ENGINE_FILESYSTEM_VIRTUAL_PATH_HPP
