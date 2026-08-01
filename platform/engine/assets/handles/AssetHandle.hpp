#ifndef PLATFORM_ENGINE_ASSETS_HANDLES_ASSET_HANDLE_HPP
#define PLATFORM_ENGINE_ASSETS_HANDLES_ASSET_HANDLE_HPP

#include "engine/assets/AssetID.hpp"
#include "engine/assets/AssetTypes.hpp"
#include <memory>

namespace platform
{
    template <typename T>
    class AssetHandle
    {
    public:
        AssetHandle() = default;
        explicit AssetHandle(AssetID id, std::shared_ptr<T> asset = nullptr, HandleState state = HandleState::Unloaded)
            : m_id(id), m_asset(std::move(asset)), m_state(state)
        {
            if (m_asset)
            {
                m_state = HandleState::Ready;
            }
        }

        [[nodiscard]] AssetID GetID() const { return m_id; }
        [[nodiscard]] HandleState GetState() const { return m_state; }

        [[nodiscard]] bool IsValid() const { return m_id != kInvalidAssetID; }
        [[nodiscard]] bool IsReady() const { return m_state == HandleState::Ready && m_asset != nullptr; }
        [[nodiscard]] bool IsMissing() const { return m_state == HandleState::Missing; }

        [[nodiscard]] std::shared_ptr<T> GetPtr() const { return m_asset; }
        [[nodiscard]] T *Get() const { return m_asset.get(); }
        [[nodiscard]] T *operator->() const { return m_asset.get(); }
        [[nodiscard]] T &operator*() const { return *m_asset; }

        explicit operator bool() const { return IsReady(); }

    private:
        AssetID m_id{kInvalidAssetID};
        std::shared_ptr<T> m_asset{nullptr};
        HandleState m_state{HandleState::Invalid};
    };
}

#endif // PLATFORM_ENGINE_ASSETS_HANDLES_ASSET_HANDLE_HPP
