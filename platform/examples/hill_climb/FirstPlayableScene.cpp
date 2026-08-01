#include "examples/hill_climb/FirstPlayableScene.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    FirstPlayableScene::FirstPlayableScene()
        : Scene("First Playable Scene")
    {
    }

    void FirstPlayableScene::OnInitialize()
    {
        // 1. Create One Camera
        m_cameraManager.CreateCamera(1280.0f, 720.0f);

        // 2. Create One Player Entity with TransformComponent, ShapeComponent, NameComponent, ActiveComponent
        m_playerEntity = CreateEntity("PlayerRectangle");

        auto &transform = GetRegistry().AddComponent<TransformComponent>(m_playerEntity);
        transform.SetPosition({0.0f, 0.0f});
        transform.SetScale({64.0f, 64.0f});

        auto &shape = GetRegistry().AddComponent<ShapeComponent>(m_playerEntity);
        shape.Type = ShapeType::Rectangle;
        shape.Size = {64.0f, 64.0f};
        shape.Color = {0.18f, 0.68f, 0.96f, 1.0f}; // Cyan/Blue rectangle

        GetRegistry().AddComponent<RenderLayerComponent>(m_playerEntity);
        GetRegistry().AddComponent<VisibilityComponent>(m_playerEntity);

        LOG_INFO("[PlayableScene] Spawned Player Rectangle (ID: {}) at (0,0).", m_playerEntity);
    }

    void FirstPlayableScene::OnUpdate(double dt)
    {
        if (m_input)
        {
            auto snapshot = m_input->CreateSnapshot();
            m_actionContext.Update(snapshot);

            glm::vec2 dir = m_actionContext.GetMovementVector();
            if (glm::length(dir) > 0.0f)
            {
                if (auto *transform = GetRegistry().GetComponent<TransformComponent>(m_playerEntity))
                {
                    glm::vec2 newPos = transform->Position + dir * m_moveSpeed * static_cast<float>(dt);
                    transform->SetPosition(newPos);
                }
            }
        }
    }
}
