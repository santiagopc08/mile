#ifndef PLATFORM_ENGINE_ASSETS_HANDLES_WEAK_ASSET_HANDLE_HPP
#define PLATFORM_ENGINE_ASSETS_HANDLES_WEAK_ASSET_HANDLE_HPP

#include "engine/assets/handles/AssetHandle.hpp"

namespace platform
{
    template <typename T>
    class WeakAssetHandle
    {
    public:
        WeakAssetHandle() = default;
        explicit WeakAssetHandle(const AssetHandle<T> &handle)
            : m_id(handle.GetID()), m_weakAsset(handle.GetPtr()) {}

        [[nodiscard]] AssetID GetID() const { return m_id; }
        [[nodiscard]] bool IsExpired() const { return m_weakAsset.expired(); }

        [[nodiscard]] AssetHandle<T> Lock() const
        {
            auto ptr = m_weakAsset.lock();
            if (ptr)
            {
                return AssetHandle<T>(m_id, ptr, HandleState::Ready);
            }
            return AssetHandle<T>(m_id, nullptr, HandleState::Unloaded);
        }

    private:
        AssetID m_id{kInvalidAssetID};
        std::weak_ptr<T> m_weakAsset;
    };
}

#endif // PLATFORM_ENGINE_ASSETS_HANDLES_WEAK_ASSET_HANDLE_HPP
