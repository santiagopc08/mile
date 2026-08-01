#ifndef PLATFORM_ENGINE_ASSETS_EVENTS_ASSET_EVENTS_HPP
#define PLATFORM_ENGINE_ASSETS_EVENTS_ASSET_EVENTS_HPP

#include "engine/events/Event.hpp"
#include "engine/assets/AssetID.hpp"
#include <string>

namespace platform
{
    class AssetImportedEvent : public Event
    {
    public:
        AssetImportedEvent(AssetID id, std::string assetName)
            : m_id(id), m_assetName(std::move(assetName)) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::AssetImported; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Resource; }
        [[nodiscard]] std::string_view GetName() const override { return "AssetImportedEvent"; }

        [[nodiscard]] AssetID GetAssetID() const { return m_id; }
        [[nodiscard]] const std::string &GetAssetName() const { return m_assetName; }

    private:
        AssetID m_id;
        std::string m_assetName;
    };

    class AssetReloadedEvent : public Event
    {
    public:
        AssetReloadedEvent(AssetID id, std::string assetName)
            : m_id(id), m_assetName(std::move(assetName)) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::AssetReloaded; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Resource; }
        [[nodiscard]] std::string_view GetName() const override { return "AssetReloadedEvent"; }

        [[nodiscard]] AssetID GetAssetID() const { return m_id; }
        [[nodiscard]] const std::string &GetAssetName() const { return m_assetName; }

    private:
        AssetID m_id;
        std::string m_assetName;
    };

    class AssetUnloadedEvent : public Event
    {
    public:
        explicit AssetUnloadedEvent(AssetID id) : m_id(id) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::AssetUnloaded; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Resource; }
        [[nodiscard]] std::string_view GetName() const override { return "AssetUnloadedEvent"; }

        [[nodiscard]] AssetID GetAssetID() const { return m_id; }

    private:
        AssetID m_id;
    };
}

#endif // PLATFORM_ENGINE_ASSETS_EVENTS_ASSET_EVENTS_HPP
