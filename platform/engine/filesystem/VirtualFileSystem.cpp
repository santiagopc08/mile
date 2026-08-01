#include "engine/filesystem/VirtualFileSystem.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    VirtualFileSystem::VirtualFileSystem() = default;

    VirtualFileSystem::~VirtualFileSystem()
    {
        Shutdown();
    }

    bool VirtualFileSystem::Initialize()
    {
        if (m_initialized)
        {
            return true;
        }

        // Mount default virtual schemes
        Mount("engine", "engine/", &m_defaultNativeProvider, 0);
        Mount("game", "game/", &m_defaultNativeProvider, 0);
        Mount("assets", "assets/", &m_defaultNativeProvider, 0);
        Mount("cache", "cache/", &m_defaultNativeProvider, 0);
        Mount("temp", "temp/", &m_defaultNativeProvider, 0);
        Mount("user", "user/", &m_defaultNativeProvider, 0);

        m_initialized = true;
        LOG_INFO("[VFS] Virtual File System initialized with default mount points.");
        return true;
    }

    void VirtualFileSystem::Shutdown()
    {
        if (!m_initialized)
        {
            return;
        }

        m_mounts.clear();
        m_initialized = false;
        LOG_INFO("[VFS] Virtual File System shutdown complete.");
    }

    bool VirtualFileSystem::Mount(const std::string &scheme, const std::string &physicalRoot, IFileProvider *provider, int priority)
    {
        IFileProvider *actualProvider = provider ? provider : &m_defaultNativeProvider;
        m_mounts.push_back({scheme, physicalRoot, actualProvider, priority});

        // Sort mounts by priority descending
        std::sort(m_mounts.begin(), m_mounts.end(), [](const MountPoint &a, const MountPoint &b) {
            return a.Priority > b.Priority;
        });

        LOG_INFO("[VFS] Mounted '{}://' -> '{}' (Priority: {}).", scheme, physicalRoot, priority);
        return true;
    }

    bool VirtualFileSystem::Unmount(const std::string &scheme)
    {
        auto it = std::remove_if(m_mounts.begin(), m_mounts.end(), [&](const MountPoint &m) {
            return m.Scheme == scheme;
        });

        if (it != m_mounts.end())
        {
            m_mounts.erase(it, m_mounts.end());
            return true;
        }
        return false;
    }

    std::string VirtualFileSystem::ResolvePhysicalPath(const VirtualPath &vpath) const
    {
        for (const auto &mount : m_mounts)
        {
            if (mount.Scheme == vpath.GetScheme())
            {
                std::string root = mount.PhysicalRoot;
                if (!root.empty() && root.back() != '/')
                {
                    root += '/';
                }
                return root + vpath.GetRelativePath();
            }
        }
        return vpath.GetRelativePath();
    }

    IFileProvider *VirtualFileSystem::GetProviderForScheme(const std::string &scheme) const
    {
        for (const auto &mount : m_mounts)
        {
            if (mount.Scheme == scheme)
            {
                return mount.Provider;
            }
        }
        return const_cast<NativeFileProvider *>(&m_defaultNativeProvider);
    }

    bool VirtualFileSystem::Exists(const VirtualPath &vpath) const
    {
        IFileProvider *provider = GetProviderForScheme(vpath.GetScheme());
        if (provider)
        {
            std::string physical = ResolvePhysicalPath(vpath);
            return provider->Exists(physical);
        }
        return false;
    }

    bool VirtualFileSystem::ReadBytes(const VirtualPath &vpath, std::vector<uint8_t> &outData)
    {
        IFileProvider *provider = GetProviderForScheme(vpath.GetScheme());
        if (provider)
        {
            std::string physical = ResolvePhysicalPath(vpath);
            return provider->ReadBytes(physical, outData);
        }
        return false;
    }

    bool VirtualFileSystem::WriteBytes(const VirtualPath &vpath, const std::vector<uint8_t> &data)
    {
        IFileProvider *provider = GetProviderForScheme(vpath.GetScheme());
        if (provider)
        {
            std::string physical = ResolvePhysicalPath(vpath);
            return provider->WriteBytes(physical, data);
        }
        return false;
    }

    std::vector<std::string> VirtualFileSystem::Enumerate(const VirtualPath &vpath) const
    {
        IFileProvider *provider = GetProviderForScheme(vpath.GetScheme());
        if (provider)
        {
            std::string physical = ResolvePhysicalPath(vpath);
            return provider->Enumerate(physical);
        }
        return {};
    }
}
