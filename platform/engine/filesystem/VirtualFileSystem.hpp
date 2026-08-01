#ifndef PLATFORM_ENGINE_FILESYSTEM_VIRTUAL_FILE_SYSTEM_HPP
#define PLATFORM_ENGINE_FILESYSTEM_VIRTUAL_FILE_SYSTEM_HPP

#include "engine/filesystem/VirtualPath.hpp"
#include "engine/filesystem/MountPoint.hpp"
#include "engine/filesystem/providers/NativeFileProvider.hpp"
#include <vector>
#include <memory>
#include <unordered_map>

namespace platform
{
    class VirtualFileSystem
    {
    public:
        VirtualFileSystem();
        ~VirtualFileSystem();

        bool Initialize();
        void Shutdown();

        bool Mount(const std::string &scheme, const std::string &physicalRoot, IFileProvider *provider = nullptr, int priority = 0);
        bool Unmount(const std::string &scheme);

        [[nodiscard]] std::string ResolvePhysicalPath(const VirtualPath &vpath) const;
        [[nodiscard]] IFileProvider *GetProviderForScheme(const std::string &scheme) const;

        bool Exists(const VirtualPath &vpath) const;
        bool ReadBytes(const VirtualPath &vpath, std::vector<uint8_t> &outData);
        bool WriteBytes(const VirtualPath &vpath, const std::vector<uint8_t> &data);
        std::vector<std::string> Enumerate(const VirtualPath &vpath) const;

        [[nodiscard]] const std::vector<MountPoint> &GetMountPoints() const { return m_mounts; }
        [[nodiscard]] NativeFileProvider &GetDefaultNativeProvider() { return m_defaultNativeProvider; }
        [[nodiscard]] bool IsInitialized() const { return m_initialized; }

    private:
        std::vector<MountPoint> m_mounts;
        NativeFileProvider m_defaultNativeProvider;
        bool m_initialized{false};
    };
}

#endif // PLATFORM_ENGINE_FILESYSTEM_VIRTUAL_FILE_SYSTEM_HPP
