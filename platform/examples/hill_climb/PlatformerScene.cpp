#include "examples/hill_climb/PlatformerScene.hpp"

#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/character/jump/JumpSettingsComponent.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    PlatformerScene::PlatformerScene()
        : Scene("Platformer Scene")
    {
    }

    void PlatformerScene::OnInitialize()
    {
        m_cameraManager.CreateCamera(1280.0f, 720.0f);

        m_player = m_charSystem.spawnCharacter(
            GetRegistry(), 1, CharacterType::Player, {0.0f, 0.0f});

        // Cuerpo visible: un rectángulo basta para leer altura y ritmo del salto.
        auto &shape = GetRegistry().AddComponent<ShapeComponent>(m_player);
        shape.Type = ShapeType::Rectangle;
        shape.Size = {48.0f, 64.0f};
        shape.Color = {0.76f, 0.96f, 0.0f, 1.0f};

        GetRegistry().AddComponent<RenderLayerComponent>(m_player);
        GetRegistry().AddComponent<VisibilityComponent>(m_player);

        // Los valores por defecto de JumpSettingsComponent ya traen la gravedad
        // asimétrica (1.0 subiendo / 2.0 cayendo) y la altura variable.
        GetRegistry().AddComponent<JumpSettingsComponent>(m_player);

        LOG_INFO("[PlatformerScene] Jugador listo (entidad #{}). Flechas para mover, Accept para saltar.", m_player);
    }

    void PlatformerScene::OnUpdate(double dt)
    {
        if (!m_input)
        {
            return;
        }

        auto snapshot = m_input->CreateSnapshot();
        m_actionContext.Update(snapshot);

        // --- Desplazamiento horizontal ---
        const glm::vec2 dir = m_actionContext.GetMovementVector();
        if (dir.x < -0.1f)
        {
            m_moveSystem.moveLeft(GetRegistry(), m_player, -dir.x);
        }
        else if (dir.x > 0.1f)
        {
            m_moveSystem.moveRight(GetRegistry(), m_player, dir.x);
        }
        else
        {
            m_moveSystem.stop(GetRegistry(), m_player);
        }

        // --- Salto con altura variable ---
        // Pulsar pide el salto; soltar antes del vértice lo recorta. Ese par
        // pulsar/soltar es lo que da el control fino de altura, y es justo lo
        // que ninguna secuencia guionada puede evaluar.
        const bool jumpHeld = m_actionContext.IsActionHeld(InputAction::Accept);

        if (jumpHeld && !m_jumpHeldLastFrame)
        {
            m_jumpSystem.requestJump(GetRegistry(), m_player);
        }
        else if (!jumpHeld && m_jumpHeldLastFrame)
        {
            m_jumpSystem.cancelJump(GetRegistry(), m_player);
        }

        m_jumpHeldLastFrame = jumpHeld;

        m_moveSystem.Update(GetRegistry(), dt);
        m_jumpSystem.Update(GetRegistry(), dt);
    }
}
