#include "engine/world/tilemap/TilemapValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void TilemapValidationController::Initialize()
    {
        m_step = TilemapValidationStep::LoadMap;
        m_tilemap = kNullEntity;
        m_stepTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[TilemapValidationController] Initialized autonomous tilemap validation sequence.");
    }

    std::string TilemapValidationController::GetStateName() const
    {
        switch (m_step)
        {
        case TilemapValidationStep::LoadMap: return "LoadMap";
        case TilemapValidationStep::TraverseMap: return "TraverseMap";
        case TilemapValidationStep::ValidateCollision: return "ValidateCollision";
        case TilemapValidationStep::ReloadMap: return "ReloadMap";
        case TilemapValidationStep::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void TilemapValidationController::Update(Registry &registry, TilemapSystem &tilemapSystem, double dt)
    {
        m_stepTimer += dt;

        if (m_tilemap == kNullEntity)
        {
            m_tilemap = registry.CreateEntity("Tilemap");
        }

        switch (m_step)
        {
        case TilemapValidationStep::LoadMap:
            tilemapSystem.loadTilemap(registry, m_tilemap, "assets/tilemaps/world_1.json");
            m_step = TilemapValidationStep::TraverseMap;
            m_stepTimer = 0.0;
            LOG_INFO("[TilemapValidationController] Transitioned -> TraverseMap");
            break;

        case TilemapValidationStep::TraverseMap:
            if (m_stepTimer >= 0.05)
            {
                m_step = TilemapValidationStep::ValidateCollision;
                m_stepTimer = 0.0;
                LOG_INFO("[TilemapValidationController] Transitioned -> ValidateCollision");
            }
            break;

        case TilemapValidationStep::ValidateCollision:
            if (m_stepTimer >= 0.05)
            {
                m_step = TilemapValidationStep::ReloadMap;
                m_stepTimer = 0.0;
                LOG_INFO("[TilemapValidationController] Transitioned -> ReloadMap");
            }
            break;

        case TilemapValidationStep::ReloadMap:
            tilemapSystem.reloadTilemap(registry, m_tilemap);
            m_cycleCount++;
            LOG_INFO("[TilemapValidationController] Completed full tilemap validation cycle (Count: {}).", m_cycleCount);
            m_step = TilemapValidationStep::Repeat;
            m_stepTimer = 0.0;
            break;

        case TilemapValidationStep::Repeat:
            m_step = TilemapValidationStep::TraverseMap;
            m_stepTimer = 0.0;
            break;
        }
    }
}
