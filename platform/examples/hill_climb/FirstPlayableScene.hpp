#ifndef PLATFORM_EXAMPLES_HILL_CLIMB_FIRST_PLAYABLE_SCENE_HPP
#define PLATFORM_EXAMPLES_HILL_CLIMB_FIRST_PLAYABLE_SCENE_HPP

#include "engine/scene/Scene.hpp"
#include "engine/input/actions/ActionContext.hpp"
#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/graphics/RenderSystem.hpp"
#include "engine/input/Input.hpp"

namespace platform
{
    class FirstPlayableScene : public Scene
    {
    public:
        FirstPlayableScene();
        ~FirstPlayableScene() override = default;

        void BindInput(Input *input) { m_input = input; }

        [[nodiscard]] EntityID GetPlayerEntity() const { return m_playerEntity; }
        [[nodiscard]] const ActionContext &GetActionContext() const { return m_actionContext; }
        [[nodiscard]] CameraManager &GetCameraManager() { return m_cameraManager; }
        [[nodiscard]] RenderSystem &GetRenderSystem() { return m_renderSystem; }

    protected:
        void OnInitialize() override;
        void OnUpdate(double dt) override;

    private:
        EntityID m_playerEntity{kNullEntity};
        ActionContext m_actionContext;
        CameraManager m_cameraManager;
        RenderSystem m_renderSystem;
        Input *m_input{nullptr};
        float m_moveSpeed{300.0f}; // 300 pixels per second
    };
}

#endif // PLATFORM_EXAMPLES_HILL_CLIMB_FIRST_PLAYABLE_SCENE_HPP
