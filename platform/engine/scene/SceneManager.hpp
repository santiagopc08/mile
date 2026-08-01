#ifndef PLATFORM_ENGINE_SCENE_SCENE_MANAGER_HPP
#define PLATFORM_ENGINE_SCENE_SCENE_MANAGER_HPP

#include "engine/scene/Scene.hpp"
#include <memory>

namespace platform
{
    class SceneManager
    {
    public:
        SceneManager();
        ~SceneManager();

        bool LoadScene(std::unique_ptr<Scene> scene);
        void UnloadScene();
        bool SwitchScene(std::unique_ptr<Scene> newScene);
        bool RestartScene();

        void Update(double dt);
        void FixedUpdate(double fixedDt);
        void PrepareRender();

        [[nodiscard]] Scene *GetActiveScene() const { return m_activeScene.get(); }
        [[nodiscard]] bool HasActiveScene() const { return m_activeScene != nullptr && m_activeScene->IsActive(); }

    private:
        std::unique_ptr<Scene> m_activeScene;
    };
}

#endif // PLATFORM_ENGINE_SCENE_SCENE_MANAGER_HPP
