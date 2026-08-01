#ifndef PLATFORM_ENGINE_ASSETS_ASSET_HPP
#define PLATFORM_ENGINE_ASSETS_ASSET_HPP

#include "engine/assets/AssetMetadata.hpp"
#include "engine/assets/AssetTypes.hpp"
#include <string>

namespace platform
{
    class Asset
    {
    public:
        Asset();
        explicit Asset(AssetMetadata metadata);
        virtual ~Asset() = default;

        [[nodiscard]] const AssetMetadata &GetMetadata() const { return m_metadata; }
        [[nodiscard]] AssetID GetID() const { return m_metadata.ID; }
        [[nodiscard]] const std::string &GetUUID() const { return m_metadata.UUID; }
        [[nodiscard]] const std::string &GetName() const { return m_metadata.Name; }
        [[nodiscard]] AssetType GetType() const { return m_metadata.Type; }

        void SetState(HandleState state) { m_state = state; }
        [[nodiscard]] HandleState GetState() const { return m_state; }
        [[nodiscard]] bool IsReady() const { return m_state == HandleState::Ready; }

        virtual bool Load() { m_state = HandleState::Ready; return true; }
        virtual void Unload() { m_state = HandleState::Unloaded; }

    protected:
        AssetMetadata m_metadata;
        HandleState m_state{HandleState::Unloaded};
    };
}

#endif // PLATFORM_ENGINE_ASSETS_ASSET_HPP
